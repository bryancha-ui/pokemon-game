// Geumgang City Pokémon Center — reuses PokemonCenterScene, exits to GeumgangCityScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class GeumgangPCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'GeumgangPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('GeumgangCityScene'));
  }
}
