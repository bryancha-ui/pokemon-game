// ── Legendary / mythical guard ──────────────────────────────────────────────
// Ordinary trainers must never field a box-legendary. Any National-Dex legendary
// that slips into a trainer team is swapped for a strong NON-legendary of similar
// tier. (Custom creatures — nabihalmang, cheonjisin, etc. — are the game's own
// species, not National-Dex legendaries, and are handled via `custom` keys, so
// they are unaffected.)

export const LEGENDARY_IDS = new Set<number>([
  // Gen 1
  144, 145, 146, 150, 151,
  // Gen 2
  243, 244, 245, 249, 250, 251,
  // Gen 3
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
  // Gen 4
  480, 481, 482, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 493,
  // Gen 5
  494, 638, 639, 640, 641, 642, 643, 644, 645, 646, 647, 648, 649,
]);

export function isLegendary(id: number): boolean {
  return LEGENDARY_IDS.has(id);
}

// Strong but NON-legendary substitutes (pseudo-legendaries / heavy hitters).
const SUBS = [248, 149, 376, 445, 373, 635, 306, 464, 530, 612];

/** Return a safe, non-legendary id for a trainer's Pokémon (id `0` = custom is untouched). */
export function deLegendify(id: number): number {
  return isLegendary(id) ? SUBS[id % SUBS.length] : id;
}
