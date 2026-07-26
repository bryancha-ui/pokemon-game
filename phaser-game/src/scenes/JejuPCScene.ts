// Jeju Port Pokémon Center — reuses PokemonCenterScene, exits to JejuPortScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class JejuPCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'JejuPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => {
      const returnScene = this.registry.get('pcReturnScene') as string | undefined ?? 'JejuCityScene';
      const returnX = this.registry.get('pcReturnX') as number | undefined ?? 10 * 32 + 16;
      const returnY = this.registry.get('pcReturnY') as number | undefined ?? 8 * 32 + 16;
      this.registry.set('jejuCityReturnX', returnX);
      this.registry.set('jejuCityReturnY', returnY);
      this.scene.start(returnScene);
    });
  }
}
