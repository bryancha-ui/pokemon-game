import { CliffClimbScene, CliffTrainer, CLIFF_ENCOUNTERS } from './CliffClimbScene';
import { EncounterEntry } from '../data/CustomPokemon';

/** Sunrise Cliffs — Field 2: the Mid Ascent (guarded by 노스단's rearguard). */
export class SunriseCliff2Scene extends CliffClimbScene {
  protected sceneKey = 'SunriseCliff2Scene';
  protected title = '⛰️ Sunrise Cliffs — Mid Ascent (2/3)';
  protected returnKey = 'sunCliff2Return';
  protected encounters: EncounterEntry[] = CLIFF_ENCOUNTERS;
  protected trainers: CliffTrainer[] = [
    {
      key: 'cliff-suri-1', name: '노스단 Rearguard', col: 6, row: 28, color: 0x161616, label: '노스단',
      line: "노스단 Operative: The Commander said to hold this ledge. You won't pass.",
      pokemon: JSON.stringify([{ id: 229, level: 53 }, { id: 319, level: 54 }]),  // Houndoom, Sharpedo
      expPool: 1500,
    },
    {
      key: 'cliff-suri-2', name: '노스단 Rearguard', col: 16, row: 14, color: 0x161616, label: '노스단',
      line: "노스단 Operative: Climb past me and you climb to your doom.",
      pokemon: JSON.stringify([{ id: 461, level: 54 }, { id: 0, level: 55, custom: 'martbadger' }]),  // Weavile, Martbadger
      expPool: 1600,
    },
  ];

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
