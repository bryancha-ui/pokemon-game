import { CliffClimbScene, CliffTrainer, CLIFF_ENCOUNTERS } from './CliffClimbScene';
import { EncounterEntry } from '../data/CustomPokemon';

/** Sunrise Cliffs — Field 2: the Mid Ascent (a quiet scenic climb). */
export class SunriseCliff2Scene extends CliffClimbScene {
  protected sceneKey = 'SunriseCliff2Scene';
  protected title = '⛰️ Sunrise Cliffs — Mid Ascent (2/3)';
  protected returnKey = 'sunCliff2Return';
  protected encounters: EncounterEntry[] = CLIFF_ENCOUNTERS;
  // The 노스단 rearguard that used to block this ascent has been removed.
  protected trainers: CliffTrainer[] = [];

  constructor() { super('SunriseCliff2Scene'); }

  protected exitSouth() {
    this.registry.set('sunCliff1ReturnX', 11 * this.TS + 16); this.registry.set('sunCliff1ReturnY', 2 * this.TS + 16);
    this.fade(() => this.scene.start('SunriseCliff1Scene'));
  }
  protected exitNorth() {
    this.registry.set('sunCliff3ReturnX', 12 * this.TS + 16); this.registry.set('sunCliff3ReturnY', 41 * this.TS + 16);
    this.fade(() => this.scene.start('SunriseCliff3Scene'));
    return true;
  }
}
