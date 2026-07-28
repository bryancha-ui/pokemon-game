import Phaser from 'phaser';
import { PartySystem } from './PartySystem';

// A whiteout warps the player to the last Pokémon Center they visited. Every Pokémon
// Center records itself here on entry (see PokemonCenterScene.create); until one is
// visited we fall back to the shared Waterfall City center.
const DEFAULT_CENTER = 'PokemonCenterScene';
const DEFAULT_RETURN = 'WorldMapScene';

/** Remember this Pokémon Center as the respawn point for the next whiteout. */
export function recordLastCenter(scene: Phaser.Scene, returnScene: string): void {
  const reg = scene.game.registry;
  reg.set('lastCenterKey', scene.scene.key);
  reg.set('lastCenterReturn', returnScene);
}

/** The blackout line, using the player's chosen name. */
export function blackoutMessage(reg: Phaser.Data.DataManager): string {
  const name = (reg.get('playerName') as string) || '플레이어';
  return `${name}는 눈앞이 깜깜해졌다…`;
}

/** Whiteout: fully heal the party and warp to the last Pokémon Center visited. */
export function blackoutToCenter(scene: Phaser.Scene): void {
  const reg = scene.game.registry;
  PartySystem.healAll(reg);
  const centerKey = (reg.get('lastCenterKey') as string) || DEFAULT_CENTER;
  const ret = (reg.get('lastCenterReturn') as string) || DEFAULT_RETURN;
  reg.set('pcReturnScene', ret);   // so the shared center exits to the right city
  scene.cameras.main.fadeOut(800, 0, 0, 0, () => scene.scene.start(centerKey));
}
