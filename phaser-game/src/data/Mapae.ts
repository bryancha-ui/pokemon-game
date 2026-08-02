import Phaser from 'phaser';

// ── 마패 (mapae) — the northern 어사대 tokens ─────────────────────────────────────
// The Northern League doesn't use gym badges. Each of the eight 어사대장 (Inspectorate
// Chiefs) runs a regional test; clearing it awards one 마패 (the royal-inspector's horse
// tablet). All eight 마패 + the eight southern badges make a trainer eligible for the
// Northern League. Each entry keys a registry flag `mapae_<key>` set true on victory.

export interface MapaeDef { key: string; city: string; chief: string; }

export const MAPAE: MapaeDef[] = [
  { key: 'kaesong',   city: 'Songhyeon',   chief: '어사대장 Hyeon' },    // scholar / Psychic  (sprite: npc_eosajang)
  { key: 'nampo',     city: 'Parangpo',     chief: '어사대장 Haemin' },   // west-sea barrage / Water
  { key: 'wonsan',    city: 'Haesol',    chief: '어사대장 Haegang' },  // east coast / Fighting
  { key: 'hamhung',   city: 'Gangcheoldo',   chief: '어사대장 Cheolju' },  // steelworks / Steel
  { key: 'chongjin',  city: 'Muyeonhang',  chief: '어사대장 Mukyeong' }, // far-NE fog port / Dark
  { key: 'sinuiju',   city: 'Binghagwan',   chief: '어사대장 Amrok' },    // Yalu border ice / Ice·Dragon
  { key: 'samjiyon',  city: 'Samho',  chief: '어사대장 Seolwon' },  // Baekdu highland / Ice
  { key: 'pyeongseong',city: 'Gwanmunseong',chief: '어사대장 Supreme Gwang' },  // capital, final certification / Supreme Commander
];

/** The capital is the eighth/final trial, so its gate is unlocked by the seven
 * regional tablets only. Keep this rule central so checkpoints, Fly and direct
 * scene restores cannot disagree. */
export const PYEONGSEONG_REQUIRED_MAPAE = 7;
const REGIONAL_MAPAE_KEYS = MAPAE.filter(m => m.key !== 'pyeongseong').map(m => m.key);

const flag = (key: string) => `mapae_${key}`;

export function hasMapae(reg: Phaser.Data.DataManager, key: string): boolean {
  return !!reg.get(flag(key));
}
export function awardMapae(reg: Phaser.Data.DataManager, key: string): void {
  reg.set(flag(key), true);
  // Update the count in registry
  const currentCount = MAPAE.reduce((n, m) => n + (reg.get(flag(m.key)) ? 1 : 0), 0);
  reg.set('mapaeCount', currentCount);
}
/** How many of the eight 마패 the player currently holds. */
export function mapaeCount(reg: Phaser.Data.DataManager): number {
  // Use cached count from registry if available, otherwise calculate
  const cached = reg.get('mapaeCount') as number;
  if (cached !== undefined) return cached;
  const calculated = MAPAE.reduce((n, m) => n + (reg.get(flag(m.key)) ? 1 : 0), 0);
  reg.set('mapaeCount', calculated);
  return calculated;
}

/** Count only the seven tablets earned before entering Gwanmunseong. */
export function regionalMapaeCount(reg: Phaser.Data.DataManager): number {
  return REGIONAL_MAPAE_KEYS.reduce((n, key) => n + (hasMapae(reg, key) ? 1 : 0), 0);
}

/** Authoritative entry condition for Pyeongseong/Gwanmunseong. */
export function canEnterPyeongseong(reg: Phaser.Data.DataManager): boolean {
  return regionalMapaeCount(reg) >= PYEONGSEONG_REQUIRED_MAPAE;
}
/** Eligible for the Northern League: all 8 마패 AND all 8 southern badges. */
export function northernLeagueEligible(reg: Phaser.Data.DataManager): boolean {
  return mapaeCount(reg) >= 8 && !!reg.get('sunriseGymDefeated');
}
