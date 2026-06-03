// Capitol City Pokémon Center — reuses the PokemonCenterScene interior
// but exits back to CapitolCityScene instead of WorldMapScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class CapitolPCScene extends PokemonCenterScene {
  constructor() {
    super();
    // Override key
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'CapitolPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('CapitolCityScene'));
  }
}
