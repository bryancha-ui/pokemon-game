// Pine Needle Town Pokémon Center & Gallery — reuses PokemonCenterScene,
// exits back to PineNeedleTownScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class PineNeedlePCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'PineNeedlePCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('PineNeedleTownScene'));
  }
}
