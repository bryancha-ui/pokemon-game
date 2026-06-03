import { PokemonData } from '../battle/Pokemon';
import { MoveData } from '../battle/Pokemon';

export interface StarterDef {
  data: PokemonData;
  ability: string;
  flavorA: string;
  flavorB: string;
  startingMoves: MoveData[];
  spriteKey: string;
}

// ── Moves ─────────────────────────────────────────────────────────────────────

const TACKLE:       MoveData = { name: 'Tackle',       type: 'normal',  category: 'physical', power: 40, accuracy: 100, pp: 35 };

// Munkain (Grass)
const RAZOR_LEAF:   MoveData = { name: 'Razor Leaf',   type: 'grass',   category: 'physical', power: 55, accuracy:  95, pp: 25 };
const LEAF_BLADE:   MoveData = { name: 'Leaf Blade',   type: 'grass',   category: 'physical', power: 90, accuracy: 100, pp: 15 };
const SYNTHESIS:    MoveData = { name: 'Synthesis',    type: 'grass',   category: 'status',   power:  0, accuracy: 100, pp:  5 };

// Vipour (Fire / Poison)
const FLAME_BURST:  MoveData = { name: 'Flame Burst',  type: 'fire',    category: 'special',  power: 70, accuracy: 100, pp: 15 };
const FIRE_FANG:    MoveData = { name: 'Fire Fang',    type: 'fire',    category: 'physical', power: 65, accuracy:  95, pp: 15 };
const SMOKESCREEN:  MoveData = { name: 'Smokescreen',  type: 'normal',  category: 'status',   power:  0, accuracy: 100, pp: 20 };

// Onnurian (Water / Ghost)
const BUBBLEBEAM:   MoveData = { name: 'Bubblebeam',   type: 'water',   category: 'special',  power: 65, accuracy: 100, pp: 20 };
const SHADOW_BALL:  MoveData = { name: 'Shadow Ball',  type: 'ghost',   category: 'special',  power: 80, accuracy: 100, pp: 15 };
const MIST:         MoveData = { name: 'Mist',         type: 'ice',     category: 'status',   power:  0, accuracy: 100, pp: 30 };

// ── Starters ──────────────────────────────────────────────────────────────────
// Base stats are boosted ~30 % above the original sketches so battles feel
// fair at the levels players actually reach them (lv 12-13 at gym).

export const STARTERS: StarterDef[] = [
  {
    spriteKey: 'munkain',
    ability: 'Overgrow',
    flavorA: 'Its tail has a special power to keep food fresh. It always carries prey like fruit in its tail.',
    flavorB: 'Before winter it stores food in its tail. Fruit it forgets to eat sprouts and becomes part of the tail.',
    startingMoves: [TACKLE, RAZOR_LEAF, LEAF_BLADE, SYNTHESIS],
    data: {
      id: 901, name: 'Munkain',
      type1: 'grass', type2: undefined,
      baseHp:    60,   // was 45
      baseAtk:   65,   // was 49
      baseDef:   65,   // was 49
      baseSpAtk: 72,   // was 55
      baseSpDef: 72,   // was 55
      baseSpd:   60,   // was 45
      spriteUrl: '/assets/munkain.jpg',
    },
  },
  {
    spriteKey: 'vipour',
    ability: 'Blaze',
    flavorA: 'Smoke from burning food drifts from its neck organ. Elements in the smoke make prey feel strangely at ease.',
    flavorB: 'It draws attention with S-shaped movements. When prey lets its guard down, Vipour bites and paralyzes them.',
    startingMoves: [TACKLE, FLAME_BURST, FIRE_FANG, SMOKESCREEN],
    data: {
      id: 902, name: 'Vipour',
      type1: 'fire', type2: 'poison',
      baseHp:    55,   // was 39
      baseAtk:   70,   // was 52
      baseDef:   58,   // was 43
      baseSpAtk: 85,   // was 62  ← main boost so fire moves connect
      baseSpDef: 65,   // was 50
      baseSpd:   85,   // was 65
      spriteUrl: '/assets/vipour.jpg',
    },
  },
  {
    spriteKey: 'onnurian',
    ability: 'Torrent',
    flavorA: 'Based on the crane, the Korean Grim Reaper, and Hwatu cards. It silently guides lost souls across still water.',
    flavorB: 'Its hollow, mournful cry echoes across rivers at dusk. Fishermen say hearing it means rain — or something else.',
    startingMoves: [TACKLE, BUBBLEBEAM, SHADOW_BALL, MIST],
    data: {
      id: 903, name: 'Onnurian',
      type1: 'water', type2: 'ghost',
      baseHp:    60,   // was 44
      baseAtk:   55,   // was 40
      baseDef:   68,   // was 52
      baseSpAtk: 88,   // was 65  ← main boost for water/ghost offence
      baseSpDef: 78,   // was 58
      baseSpd:   65,   // was 50
      spriteUrl: '/assets/onnurian.jpg',
    },
  },
];

// Type badge colours
export const TYPE_COLORS: Record<string, number> = {
  grass:   0x4caf50,
  fire:    0xff5722,
  water:   0x2196f3,
  poison:  0x9c27b0,
  ghost:   0x5e35b1,
  normal:  0x9e9e9e,
  dark:    0x37474f,
  rock:    0x8d6e63,
  flying:  0x4fc3f7,
  ground:  0xd4a843,
  ice:     0x80deea,
  fighting:0xe53935,
  psychic: 0xe91e63,
  bug:     0x8bc34a,
  dragon:  0x4a148c,
  electric:0xffeb3b,
  steel:   0x78909c,
  fairy:   0xf48fb1,
};
