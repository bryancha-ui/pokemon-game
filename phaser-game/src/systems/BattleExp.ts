import Phaser from 'phaser';
import { PartySystem } from './PartySystem';
import { t, pokeNameEn } from './i18n';

/**
 * Award EXP to every party slot that participated in the battle EXCEPT the
 * currently-active slot (the battle scene already handles the active Pokémon via
 * its live Pokemon object). Applies the EXP to the stored party data so benched
 * Pokémon level up too. Returns level-up notice lines to show after the active one.
 */
/** A benched Pokémon that gained one or more levels this battle — the caller uses
 *  these to run the move-learning prompt so EXP-share level-ups never silently
 *  swap a move. `from`/`to` bracket the levels crossed. */
export interface BenchLevelUp { slot: number; from: number; to: number; }

export function awardBenchExp(
  registry: Phaser.Data.DataManager,
  participants: Set<number>,
  activeSlot: number,
  amount: number,
  leveledOut?: BenchLevelUp[],
): string[] {
  const levelUps: string[] = [];
  const enNames: string[] = [];
  const koNames: string[] = [];
  const party = PartySystem.get(registry);
  for (const slot of participants) {
    if (slot === activeSlot) continue;
    if (!party[slot]) continue;
    if (party[slot].hp <= 0) continue;   // fainted Pokémon earn no EXP
    const fromLevel = party[slot].level;
    const res = PartySystem.gainExpForSlot(registry, slot, amount);
    enNames.push(res.name.toUpperCase());
    koNames.push(pokeNameEn(res.name));
    if (res.leveledTo) leveledOut?.push({ slot, from: fromLevel, to: res.leveledTo });
    if (res.leveledTo) levelUps.push(t(
      `✨ ${res.name.toUpperCase()} grew to Lv. ${res.leveledTo}!`,
      `✨ ${pokeNameEn(res.name)}(은)는 Lv. ${res.leveledTo}로 성장했다!`));
  }
  if (enNames.length === 0) return [];
  // One summary line so the player sees benched battlers shared the EXP, then any level-ups.
  const enWho = enNames.length <= 2 ? enNames.join(' & ') : `${enNames.length} other battlers`;
  const koWho = koNames.length <= 2 ? koNames.join(', ') : `다른 배틀 참가 포켓몬 ${koNames.length}마리`;
  return [t(`${enWho} also gained ${amount} EXP!`, `${koWho}(도) ${amount} 경험치를 얻었다!`), ...levelUps];
}
