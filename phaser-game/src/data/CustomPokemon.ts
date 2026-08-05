import { PokemonData, MoveData } from '../battle/Pokemon';

// ── Disguijar ─────────────────────────────────────────────────────────────────
// Rock/Flying swift — found on the mountain route to Seoul.
// Inspired by a stone sparrow/swift with golden eye-spots.

export const DISGUIJAR_MOVES: MoveData[] = [
  { name: 'Wing Attack', type: 'flying',  category: 'physical', power: 60, accuracy: 100, pp: 35 },
  { name: 'Rock Throw',  type: 'rock',    category: 'physical', power: 50, accuracy: 90,  pp: 15 },
  { name: 'Sand Attack', type: 'ground',  category: 'status',   power: 0,  accuracy: 100, pp: 15 },
  { name: 'Swift',       type: 'normal',  category: 'special',  power: 60, accuracy: 100, pp: 20 },
];

export const DISGUIJAR_DATA: PokemonData = {
  id:          904,
  name:        'Disguijar',
  ability:     'Sturdy',
  type1:       'rock',
  type2:       'flying',
  baseHp:      55,
  baseAtk:     75,
  baseDef:     85,
  baseSpAtk:   40,
  baseSpDef:   70,
  baseSpd:     95,
  spriteUrl:   'assets/disguijar.png',
};

export const DISGUIJAR_CATCH_RATE = 204;  // ~80% catch rate (204/255 ≈ 0.80)

// ── Corrpanda ──────────────────────────────────────────────────────────────────
// Dark cat-fox — Gym Leader Jin's ace. Fast and cunning.

export const CORRPANDA_MOVES: MoveData[] = [
  { name: 'Night Slash',  type: 'dark',   category: 'physical', power: 70, accuracy: 100, pp: 15 },
  { name: 'Bite',         type: 'dark',   category: 'physical', power: 60, accuracy: 100, pp: 25 },
  { name: 'Shadow Claw',  type: 'ghost',  category: 'physical', power: 70, accuracy: 100, pp: 15 },
  { name: 'Screech',      type: 'normal', category: 'status',   power:  0, accuracy:  85, pp: 40 },
];

export const CORRPANDA_DATA: PokemonData = {
  id:          905,
  name:        'Corrpanda',
  ability:     'Pressure',
  type1:       'dark',
  type2:       undefined,
  baseHp:      55,
  baseAtk:     75,
  baseDef:     50,
  baseSpAtk:   55,
  baseSpDef:   55,
  baseSpd:     95,
  spriteUrl:   'assets/corrpanda.png',
};

export const CORRPANDA_CATCH_RATE = 30;

// ── Encounter tables ───────────────────────────────────────────────────────────

export interface EncounterEntry {
  id: string | number;   // string = custom key, number = PokéAPI id
  weight: number;
  minLevel: number;
  maxLevel: number;
  isCustom: boolean;
  catchRate: number;
}

export const OUTDOOR_ENCOUNTERS: EncounterEntry[] = [
  { id: 'disguijar', weight: 32, minLevel: 4, maxLevel: 8, isCustom: true,  catchRate: 204 }, // ~80% catch rate
  { id: 'gawlhawk',  weight: 18, minLevel: 4, maxLevel: 8, isCustom: true,  catchRate: 200 }, // Rock/Flying
  { id: 74,          weight: 22, minLevel: 3, maxLevel: 7, isCustom: false, catchRate: 255 }, // Geodude
  { id: 66,          weight: 12, minLevel: 4, maxLevel: 7, isCustom: false, catchRate: 180 }, // Machop
  { id: 21,          weight: 10, minLevel: 3, maxLevel: 6, isCustom: false, catchRate: 255 }, // Spearow
  { id: 25,          weight: 14, minLevel: 3, maxLevel: 7, isCustom: false, catchRate: 190 }, // Pikachu
  { id: 246,         weight:  6, minLevel: 4, maxLevel: 6, isCustom: false, catchRate: 45  }, // Larvitar
];

export const CAVE_ENCOUNTERS: EncounterEntry[] = [
  { id: 41,          weight: 32, minLevel: 4, maxLevel: 7, isCustom: false, catchRate: 255 }, // Zubat
  { id: 'nosepassx', weight: 18, minLevel: 4, maxLevel: 7, isCustom: true,  catchRate: 200 }, // Nosepass (Rock/Psychic)
  { id: 'crystbeetle', weight: 14, minLevel: 5, maxLevel: 8, isCustom: true, catchRate: 190 }, // Crystbeetle
  { id: 95,          weight: 14, minLevel: 5, maxLevel: 7, isCustom: false, catchRate: 45  }, // Onix
  { id: 246,         weight: 12, minLevel: 4, maxLevel: 6, isCustom: false, catchRate: 45  }, // Larvitar
  { id: 74,          weight: 10, minLevel: 4, maxLevel: 7, isCustom: false, catchRate: 255 }, // Geodude
];

export function pickEncounter(table: EncounterEntry[]): EncounterEntry {
  const total = table.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of table) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return table[table.length - 1];
}

export function randomLevel(entry: EncounterEntry): number {
  return entry.minLevel + Math.floor(Math.random() * (entry.maxLevel - entry.minLevel + 1));
}
