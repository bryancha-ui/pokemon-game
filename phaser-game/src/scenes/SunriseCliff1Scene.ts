import { CliffClimbScene, CliffTrainer, CLIFF_ENCOUNTERS } from './CliffClimbScene';
import { EncounterEntry } from '../data/CustomPokemon';

/** Sunrise Cliffs — Field 1: the Lower Trail (from the city up to the mid ascent). */
export class SunriseCliff1Scene extends CliffClimbScene {
  protected sceneKey = 'SunriseCliff1Scene';
  protected title = '⛰️ Sunrise Cliffs — Lower Trail (1/3)';
  protected returnKey = 'sunCliff1Return';
  protected encounters: EncounterEntry[] = CLIFF_ENCOUNTERS;
  protected trainers: CliffTrainer[] = [
    {
      key: 'cliff-hiker', name: 'Hiker Baekho', col: 6, row: 30, color: 0x886644, label: 'Hiker',
      line: "Twenty years I've climbed these cliffs. The black-coats blew past me like the place was theirs.",
      pokemon: JSON.stringify([{ id: 0, level: 48, custom: 'prowlrock' }, { id: 0, level: 49, custom: 'mushvenom' }]),
      expPool: 1300,
    },
  ];

  constructor() { super('SunriseCliff1Scene'); }

  protected exitSouth() {
    this.registry.set('sunriseCityReturnX', 15 * this.TS); this.registry.set('sunriseCityReturnY', 3 * this.TS);
    this.fade(() => this.scene.start('SunriseCityScene'));
  }
  protected exitNorth() {
    this.registry.set('sunCliff2ReturnX', 12 * this.TS + 16); this.registry.set('sunCliff2ReturnY', 41 * this.TS + 16);
    this.fade(() => this.scene.start('SunriseCliff2Scene'));
    return true;
  }
}
