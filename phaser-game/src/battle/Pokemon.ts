import { getEffectiveness, PokemonType } from './TypeChart';

export type MoveCategory = 'physical' | 'special' | 'status';
export type BattleStat = 'atk' | 'def' | 'spAtk' | 'spDef' | 'spd' | 'accuracy' | 'evasion';

export interface MoveStatChange {
  stat: BattleStat;
  change: number;
}

export interface MoveData {
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
  /** Optional PokeAPI/bespoke effect metadata used by the shared move engine. */
  healing?: number;       // percent of the user's max HP
  drain?: number;         // percent of damage dealt restored to the user
  statChanges?: MoveStatChange[];
  effectTarget?: 'user' | 'target';
  effectChance?: number;
  twoTurn?: 'air' | 'underground' | 'charge';
}

export interface Move {
  data: MoveData;
  pp: number;
}

export interface PokemonData {
  id: number;
  name: string;
  ability?: string;
  type1: PokemonType;
  type2?: PokemonType;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  baseSpAtk: number;
  baseSpDef: number;
  baseSpd: number;
  spriteUrl: string;
}

export class Pokemon {
  readonly data: PokemonData;
  private _level: number;
  readonly moves: Move[];

  maxHp = 0;
  hp = 0;
  atk = 0;
  def = 0;
  spAtk = 0;
  spDef = 0;
  spd = 0;
  exp = 0;
  private stages: Record<BattleStat, number> = {
    atk: 0, def: 0, spAtk: 0, spDef: 0, spd: 0, accuracy: 0, evasion: 0,
  };

  get level() { return this._level; }

  constructor(data: PokemonData, level: number, moves: MoveData[]) {
    this.data = data;
    this._level = level;
    this.moves = moves.slice(0, 4).map(m => ({ data: m, pp: m.pp }));
    this.recalcStats();
    this.hp = this.maxHp;
  }

  private recalcStats() {
    const l = this._level, d = this.data;
    // Divider 25 (instead of 100) makes base-stat differences meaningful at
    // low levels and keeps HP high enough that individual hits feel fair.
    this.maxHp  = Math.floor((d.baseHp    * l) / 25) + l + 10;
    this.atk    = Math.floor((d.baseAtk   * l) / 25) + 5;
    this.def    = Math.floor((d.baseDef   * l) / 25) + 5;
    this.spAtk  = Math.floor((d.baseSpAtk * l) / 25) + 5;
    this.spDef  = Math.floor((d.baseSpDef * l) / 25) + 5;
    this.spd    = Math.floor((d.baseSpd   * l) / 25) + 5;
  }

  /** EXP needed to reach the next level.
   *  level 5→6: 75   level 6→7: 108   level 7→8: 147  */
  expToNextLevel(): number {
    return this._level * this._level * 3;
  }

  /**
   * Add EXP. Returns true if a level-up occurred (may level up multiple times).
   * Caller should loop while gainExp returns true.
   */
  gainExp(amount: number): boolean {
    this.exp += amount;
    if (this.exp >= this.expToNextLevel()) {
      this.exp -= this.expToNextLevel();
      this.levelUp();
      return true;
    }
    return false;
  }

  levelUp(): number {
    this._level++;
    this.recalcStats();
    this.hp = this.maxHp;   // level-up fully restores HP
    return this._level;
  }

  get isKO() { return this.hp <= 0; }
  get name()  { return this.data.name; }

  getStage(stat: BattleStat): number { return this.stages[stat]; }

  modifyStage(stat: BattleStat, amount: number): number {
    const before = this.stages[stat];
    this.stages[stat] = Math.max(-6, Math.min(6, before + amount));
    return this.stages[stat] - before;
  }

  clearNegativeStages(): void {
    for (const stat of Object.keys(this.stages) as BattleStat[]) {
      if (this.stages[stat] < 0) this.stages[stat] = 0;
    }
  }

  /** Effective in-battle stat after standard Pokémon stage multipliers. */
  battleStat(stat: Exclude<BattleStat, 'accuracy' | 'evasion'>): number {
    const raw = this[stat];
    const stage = this.stages[stat];
    const multiplier = stage >= 0 ? (2 + stage) / 2 : 2 / (2 - stage);
    return Math.max(1, raw * multiplier);
  }

  accuracyMultiplier(): number {
    const stage = this.stages.accuracy;
    return stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage);
  }

  evasionMultiplier(): number {
    const stage = this.stages.evasion;
    return stage >= 0 ? (3 + stage) / 3 : 3 / (3 - stage);
  }

  takeDamage(move: Move, attacker: Pokemon): { dmg: number; critical: boolean; effectiveness: number } {
    const effectiveness = getEffectiveness(move.data.type, this.data.type1, this.data.type2);
    const isCritical = effectiveness > 0 && Math.random() < 0.0625;
    const critical = isCritical ? 1.5 : 1;
    const atk = move.data.category === 'special' ? attacker.battleStat('spAtk') : attacker.battleStat('atk');
    const def = move.data.category === 'special' ? this.battleStat('spDef') : this.battleStat('def');
    const stab = move.data.type === attacker.data.type1 || move.data.type === attacker.data.type2 ? 1.5 : 1;

    // Constant reduced from +2 → +1 so the floor term doesn't dominate
    // at low levels when atk/def stats are small.
    const dmg = move.data.power === 0 || effectiveness === 0 ? 0 : Math.max(1, Math.floor(
      ((2 * attacker.level / 5 + 2) * move.data.power * (atk / def) / 50 + 1)
      * stab * effectiveness * critical
    ));

    this.hp = Math.max(0, this.hp - dmg);
    return { dmg, critical: isCritical, effectiveness };
  }

  useMove(move: Move): boolean {
    if (move.pp <= 0) return false;
    move.pp--;
    return true;
  }

  heal(amount: number) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }
}
