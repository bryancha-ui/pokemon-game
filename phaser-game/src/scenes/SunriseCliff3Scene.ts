import Phaser from 'phaser';
import { CliffClimbScene, CliffTrainer, CLIFF_ENCOUNTERS } from './CliffClimbScene';
import { EncounterEntry } from '../data/CustomPokemon';

/**
 * Sunrise Cliffs — Field 3: the Summit. Commander Ryeo (a visible character)
 * waits at the seventh seal. Reaching her triggers the convergence:
 * Ryeo's 5-Pokémon battle → Chaeyeon shatters the array → Director Suri →
 * the seventh tablet.
 */
export class SunriseCliff3Scene extends CliffClimbScene {
  protected sceneKey = 'SunriseCliff3Scene';
  protected title = '🌅 Sunrise Cliffs — The Summit (3/3)';
  protected returnKey = 'sunCliff3Return';
  protected encounters: EncounterEntry[] = CLIFF_ENCOUNTERS;
  protected trainers: CliffTrainer[] = [];   // the only fights here are the convergence

  constructor() { super('SunriseCliff3Scene'); }

  protected exitSouth() {
    this.registry.set('sunCliff2ReturnX', 11 * this.TS + 16); this.registry.set('sunCliff2ReturnY', 2 * this.TS + 16);
    this.fade(() => this.scene.start('SunriseCliff2Scene'));
  }
  protected exitNorth() { return false; }   // the summit — nowhere higher

  // The 노스단 convergence (Commander Ryeo + Director Suri) that used to play out at the
  // summit has been removed — the top of the cliffs is now just a quiet scenic overlook.
  protected drawExtras() { /* no summit characters */ }
  protected checkSpecial(): boolean { return false; }
}
