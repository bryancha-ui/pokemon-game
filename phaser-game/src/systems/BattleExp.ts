import Phaser from 'phaser';
import { PartySystem } from './PartySystem';

/**
 * Award EXP to every party slot that participated in the battle EXCEPT the
 * currently-active slot (the battle scene already handles the active Pokémon via
 * its live Pokemon object). Applies the EXP to the stored party data so benched
 * Pokémon level up too. Returns level-up notice lines to show after the active one.
 */
export function awardBenchExp(
  registry: Phaser.Data.DataManager,
  participants: Set<number>,
  activeSlot: number,
  amount: number,
): string[] {
  const levelUps: string[] = [];
  const names: string[] = [];
  const party = PartySystem.get(registry);
  for (const slot of participants) {
    if (slot === activeSlot) continue;
    if (!party[slot]) continue;
    if (party[slot].hp <= 0) continue;   // fainted Pokémon earn no EXP
    const res = PartySystem.gainExpForSlot(registry, slot, amount);
    names.push(res.name.toUpperCase());
    if (res.leveledTo) levelUps.push(`✨ ${res.name.toUpperCase()} grew to Lv. ${res.leveledTo}!`);
  }
  if (names.length === 0) return [];
  // One summary line so the player sees benched battlers shared the EXP, then any level-ups.
  const who = names.length <= 2 ? names.join(' & ') : `${names.length} other battlers`;
  return [`${who} also gained ${amount} EXP!`, ...levelUps];
}
