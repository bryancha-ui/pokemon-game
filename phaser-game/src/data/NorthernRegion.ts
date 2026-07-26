// ── Northern region (Phase 2) EXP boost ──────────────────────────────────────
// The northern circuit runs at Lv 60–90, where the level curve (level² × 3 per
// level) badly outpaces the linear EXP gains. To keep progression from crawling,
// wild and trainer battles fought in the north award extra EXP.

type Reg = { get(key: string): unknown };

/** Every scene that counts as the high-level northern region. */
const NORTHERN_SCENES = new Set<string>([
  // 어사대 (마패) circuit cities
  'KaesongCityScene', 'NampoCityScene', 'WonsanCityScene', 'HamhungCityScene',
  'ChongjinCityScene', 'SinuijuCityScene', 'SamjiyonCityScene', 'PyeongyangCityScene',
  // northern routes & beaches
  'RyesongValleyScene', 'AhobiryongPassScene', 'NampoBeachScene', 'WonsanBeachScene',
  'SijungCoastScene', 'HamhungMineScene', 'ChilboHighlandsScene', 'KaemaPlateauScene', 'FogboundManorScene',
  'SamjiyonAjitRoadScene', 'NosdanHideoutScene', 'SinuijuIceCaveScene',
  // Northern League + post-game II
  'NorthernPlazaScene', 'NorthernColiseumScene', 'NorthernReachesScene',
  'SacredPeakScene', 'BaekduSummitScene',
]);

/** How much extra EXP northern battles award (1.6 = +60%). */
export const NORTHERN_EXP_MULT = 1.6;

export function isNorthernScene(scene: unknown): boolean {
  return typeof scene === 'string' && NORTHERN_SCENES.has(scene);
}

/** EXP multiplier for a battle, based on the scene it returns to. */
export function expMultiplierFor(registry: Reg): number {
  const scene = (registry.get('trainerReturnScene') as string) ?? (registry.get('wildReturnScene') as string);
  return isNorthernScene(scene) ? NORTHERN_EXP_MULT : 1;
}
