// Seorae Town Pokémon Center — the standard Center interior with nurse and PC.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class SeoraePCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'SeoraePCScene';
  }

  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('SeoraeTownScene'));
  }
}
