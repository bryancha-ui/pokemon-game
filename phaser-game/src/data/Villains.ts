/**
 * Team Suri and 노스단 (Team North) are the story's criminal organizations. Once you
 * beat one of their grunts/leaders in the field, that villain clears out — their
 * operation there is broken. EVERY other trainer (gym trainers, route trainers,
 * ace trainers, etc.) stays standing where they were after the battle.
 *
 * Pass any combination of a trainer's key / name / label.
 */
export function vanishesAfterDefeat(...ids: (string | undefined)[]): boolean {
  const s = ids.filter(Boolean).join(' ').toLowerCase();
  return s.includes('suri')     // Team Suri
      || s.includes('nosdan')   // 노스단 (romanized)
      || s.includes('노스단')    // 노스단 (Korean)
      || s.includes('grunt');   // generic villain grunt (all belong to Suri/노스단)
}
