// Jeju Port Pokémon Center — reuses PokemonCenterScene, exits to JejuPortScene.
import { PokemonCenterScene } from './interior/PokemonCenterScene';

export class JejuPCScene extends PokemonCenterScene {
  constructor() {
    super();
    (this as unknown as { sys: { settings: { key: string } } }).sys.settings.key = 'JejuPCScene';
  }
  protected override exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => {
      // This shared island center has two valid entrances. Never trust a stale
      // pcReturnScene from a mainland/waterfall center.
      const requestedScene = this.registry.get('pcReturnScene') as string | undefined;
      const returnScene = requestedScene === 'JejuPortScene' ? 'JejuPortScene' : 'JejuCityScene';
      const returnX = this.registry.get('pcReturnX') as number | undefined ?? 10 * 32 + 16;
      const returnY = this.registry.get('pcReturnY') as number | undefined ?? 12 * 32 + 16;
      const prefix = returnScene === 'JejuPortScene' ? 'jejuPort' : 'jejuCity';
      this.registry.set(`${prefix}ReturnX`, returnX);
      this.registry.set(`${prefix}ReturnY`, returnY);
      this.scene.start(returnScene);
    });
  }
}
