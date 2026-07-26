import { getEffectiveness, PokemonType } from './TypeChart';

export type MoveCategory = 'physical' | 'special' | 'status';

export interface MoveData {
  name: string;
  type: PokemonType;
  category: MoveCategory;
  power: number;
  accuracy: number;
  pp: number;
}

export interface Move {
  data: MoveData;
  pp: number;
}

export interface PokemonData {
  id: number;
  name: string;
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

  takeDamage(move: Move, attacker: Pokemon): { dmg: number; critical: boolean; effectiveness: number } {
    const effectiveness = getEffectiveness(move.data.type, this.data.type1, this.data.type2);
    const isCritical = Math.random() < 0.0625;
    const critical = isCritical ? 1.5 : 1;
    const atk = move.data.category === 'special' ? attacker.spAtk : attacker.atk;
    const def = move.data.category === 'special' ? this.spDef : this.def;

    // Constant reduced from +2 → +1 so the floor term doesn't dominate
    // at low levels when atk/def stats are small.
    const dmg = move.data.power === 0 ? 0 : Math.max(1, Math.floor(
      ((2 * attacker.level / 5 + 2) * move.data.power * (atk / def) / 50 + 1)
      * effectiveness * critical
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
