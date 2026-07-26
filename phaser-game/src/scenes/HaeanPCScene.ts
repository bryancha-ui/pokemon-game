// Haean City Pokémon Center — reuses PokemonCenterScene, exits to HaeanCityScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class HaeanPCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'HaeanPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('HaeanCityScene'));
  }
}
