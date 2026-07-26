// Baekdu City Pokémon Center & Mountain Rescue Station — reuses PokemonCenterScene,
// exits back to BaekduCityScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class BaekduPCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'BaekduPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('BaekduCityScene'));
  }
}
