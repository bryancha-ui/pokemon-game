// Forest City Pokémon Center — reuses PokemonCenterScene, exits to ForestCityScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class ForestPCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'ForestPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('ForestCityScene'));
  }
}
