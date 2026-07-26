// Dolmoe City Pokémon Center — reuses PokemonCenterScene, exits to DolmoeCityScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class DolmoePCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'DolmoePCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('DolmoeCityScene'));
  }
}
