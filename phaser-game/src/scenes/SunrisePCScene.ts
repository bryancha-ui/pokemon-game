// Sunrise City Pokémon Center — reuses PokemonCenterScene, exits to SunriseCityScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class SunrisePCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'SunrisePCScene';
  }
  protected override exitToWorld() {
    // Explicit safe spawn on the boulevard by the PC door (guards against stale coords).
    this.registry.set('sunriseCityReturnX', 5 * 32 + 16);
    this.registry.set('sunriseCityReturnY', 13 * 32 + 16);
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('SunriseCityScene'));
  }
}
