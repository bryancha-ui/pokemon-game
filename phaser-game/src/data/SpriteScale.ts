/**
 * Battle display-size multiplier for physically-large Pokémon. All sprites are
 * normally fit to the same on-screen size; these get scaled up so leviathans,
 * towering totems and legendaries actually look big. 1 = normal.
 *
 * Keyed by sprite key (the battle texture key). Add or tune entries freely.
 */
export const SPRITE_SCALE: Record<string, number> = {
  // ── Huge ──
  arctorodon:   1.75,   // Rock/Ice leviathan
  daejangseung: 1.55,   // towering totem-of-totems
  // ── Legendaries / very large ──
  hwanwoong:    1.5,
  nabihalmang:  1.45,
  cheonjisin:   1.45,
  'nosdan-sovereign': 1.4,
  poongbaek:    1.35,
  woosa:        1.35,
  woonsa:       1.35,
  // ── Big final-stage designs ──
  snoqueen:     1.0,   // 60% smaller than the standard fit
  thanatoat:    1.3,
  seuphaisin:   1.3,
  honutomb:     1.25,
  banderado:    1.25,
  moransae:     1.25,
  mperodactyl:  1.3,
  noeryong:     1.3,
  komodread:    1.25,
  yeomtaeja:    1.5,
  namsoon:      1.4,
  // ── Rival's evolved starters (ace in the later rival fights) — make him loom ──
  scorpent:     1.35,
  munklift:     1.35,
  onnujang:     1.35,
  pipetiger:     1.35,
  tyranitar:     1.35
};

/** Display-size multiplier for a battle sprite key (default 1). */
export function spriteScale(key: string | undefined): number {
  return (key && SPRITE_SCALE[key]) || 1;
}
