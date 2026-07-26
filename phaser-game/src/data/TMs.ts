import { MoveData } from '../battle/Pokemon';
import { PokemonType } from '../battle/TypeChart';

// ── Gym-leader TMs ───────────────────────────────────────────────────────────
// Each gym leader awards a TM. TMs are reusable (like HMs) and — unlike the
// overworld-only HM Fly — actually take effect in battle: `buildFromEntry`
// folds a taught TM's move into the Pokémon's battle moveset (see PartyBattle).
// Any Pokémon may learn a gym TM (no type restriction) so the reward is usable.

const M = (
  name: string, type: string, category: 'physical' | 'special' | 'status',
  power: number, accuracy = 100, pp = 10,
): MoveData => ({ name, type: type as PokemonType, category, power, accuracy, pp });

export interface TmDef {
  key: string;        // bag item key
  move: string;       // move taught
  badgeFlag: string;  // registry flag set when its gym is beaten (for the reward + retro grant)
  data: MoveData;     // battle data for the move
  price?: number;     // if set, purchasable at the Dept. Store 3F TM corner
}

export const TMS: TmDef[] = [
  { key: 'tm_darkpulse',     move: 'Dark Pulse',     badgeFlag: 'gymLeaderDefeated',   data: M('Dark Pulse',     'dark',     'special',  80,  100) }, // Capitol · Leader Jin (first gym)
  { key: 'tm_closecombat',   move: 'Close Combat',   badgeFlag: 'baekduGymDefeated',   data: M('Close Combat',   'fighting', 'physical', 120, 100) },
  { key: 'tm_stoneedge',     move: 'Stone Edge',     badgeFlag: 'dolmoeGymDefeated',   data: M('Stone Edge',     'rock',     'physical', 100, 80)  },
  { key: 'tm_woodhammer',    move: 'Wood Hammer',    badgeFlag: 'forestGymDefeated',   data: M('Wood Hammer',    'grass',    'physical', 120, 100) },
  { key: 'tm_dazzlinggleam', move: 'Dazzling Gleam', badgeFlag: 'geumgangGymDefeated', data: M('Dazzling Gleam', 'fairy',    'special',  80,  100) },
  { key: 'tm_surf',          move: 'Surf',           badgeFlag: 'haeanGymDefeated',    data: M('Surf',           'water',    'special',  90,  100) },
  { key: 'tm_auroraveil',    move: 'Aurora Veil',    badgeFlag: 'seoraeGymDefeated',   data: M('Aurora Veil',    'ice',      'status',   0,   100) },
  { key: 'tm_thunderbolt',   move: 'Thunderbolt',    badgeFlag: 'sunriseGymDefeated',  data: M('Thunderbolt',    'electric', 'special',  90,  100) },
  { key: 'tm_calmmind',      move: 'Calm Mind',      badgeFlag: 'smeargleQuestDone',   data: M('Calm Mind',      'psychic',  'status',   0,   100) }, // Artist Sora (Pine Needle studio)
  // ── Purchasable TMs — Capitol Dept. Store, 3F (never auto-granted; badgeFlag unused) ──
  { key: 'tm_bodyslam',   move: 'Body Slam',   badgeFlag: '__shopTM__', price: 3000, data: M('Body Slam',   'normal',   'physical', 85, 100) },
  { key: 'tm_brickbreak', move: 'Brick Break', badgeFlag: '__shopTM__', price: 3000, data: M('Brick Break', 'fighting', 'physical', 75, 100) },
  { key: 'tm_shadowclaw', move: 'Shadow Claw', badgeFlag: '__shopTM__', price: 4000, data: M('Shadow Claw', 'ghost',    'physical', 70, 100) },
  { key: 'tm_icebeam',    move: 'Ice Beam',    badgeFlag: '__shopTM__', price: 5000, data: M('Ice Beam',    'ice',      'special',  90, 100) },
  { key: 'tm_flamethrower', move: 'Flamethrower', badgeFlag: '__shopTM__', price: 5000, data: M('Flamethrower', 'fire', 'special', 90, 100) },
];

/** Move name (lowercased) → battle data, for the moves TMs teach. */
export const TM_MOVE_DATA: Record<string, MoveData> =
  Object.fromEntries(TMS.map(t => [t.move.toLowerCase(), t.data]));

export function tmForMove(move: string): TmDef | undefined {
  return TMS.find(t => t.move.toLowerCase() === move.toLowerCase());
}
