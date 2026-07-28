import Phaser from 'phaser';

// ── Global "Pokémon-like" graphics layer ─────────────────────────────────────
// A scene plugin (booted for every scene) that lays a soft vignette + a warm,
// vivid colour-grade over the frame so the whole game reads more polished and
// storybook-like — no new art assets. Implemented as camera-fixed overlays (not
// shaders) so it works on every renderer. Scenes opt out with `this.noPokemonFx`.

const VIGNETTE_KEY = '__pkfx_vignette';
const DEPTH = 100000;

function ensureVignette(scene: Phaser.Scene): void {
  if (scene.textures.exists(VIGNETTE_KEY)) return;
  const size = 512;
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.30, size / 2, size / 2, size * 0.62);
  g.addColorStop(0, 'rgba(10,6,20,0)');
  g.addColorStop(1, 'rgba(10,6,20,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  scene.textures.addCanvas(VIGNETTE_KEY, c);
}

export class PokemonFxPlugin extends Phaser.Plugins.ScenePlugin {
  constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager, pluginKey: string) {
    super(scene, pluginManager, pluginKey);
  }

  boot(): void {
    this.systems!.events.on('create', this.apply, this);
    this.systems!.events.once('shutdown', this.cleanup, this);
    this.systems!.events.once('destroy', this.cleanup, this);
  }

  private apply(): void {
    const scene = this.scene as Phaser.Scene & { noPokemonFx?: boolean };
    if (!scene || scene.noPokemonFx) return;
    const cam = scene.cameras?.main;
    if (!cam) return;
    // A full-screen overlay can't cleanly cover a zoomed camera, so only grade the
    // standard (zoom = 1) scenes — that's the overwhelming majority of the game.
    if ((cam.zoom || 1) !== 1) return;

    ensureVignette(scene);
    const W = scene.scale.width, H = scene.scale.height;

    // Warm, slightly vivid grade (soft-light keeps it subtle, never muddy).
    scene.add.rectangle(W / 2, H / 2, W, H, 0xffd9a0)
      .setScrollFactor(0).setDepth(DEPTH).setBlendMode(Phaser.BlendModes.SOFT_LIGHT).setAlpha(0.10);

    // Gentle vignette framing the scene.
    scene.add.image(W / 2, H / 2, VIGNETTE_KEY)
      .setScrollFactor(0).setDepth(DEPTH + 1).setDisplaySize(W, H);
  }

  private cleanup(): void {
    this.systems!.events.off('create', this.apply, this);
  }
}
