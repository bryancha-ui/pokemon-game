import Phaser from 'phaser';
import { BattleMirror } from './BattleMirror';
import { CameraRig } from './CameraRig';
import { primeManifest } from './GlbModels';
import { OverworldMirror } from './OverworldMirror';
import { primeProps } from './PropModels';
import { ThreeStage } from './ThreeStage';

// ── engine3d bootstrap ───────────────────────────────────────────────────────
// Drop-in 3D rendering layer. The Phaser game keeps running every byte of its
// logic, dialogue, events and music untouched; this module watches whichever
// scene is active and renders a 3D twin of it underneath the (now transparent)
// Phaser canvas, which continues to draw all UI on top.
//
//   • Overworld / interior scenes (anything that camera-follows the player)
//     get painted 3D terrain, extruded characters and a third-person camera.
//   • Battle scenes get a cinematic arena with 3D creatures and a drifting
//     battle camera.
//   • Menu / Pokédex / title screens intentionally stay crisp 2D.
//
//   F3 toggles 2D ↔ 3D at any time (saved to localStorage).

const STORE_KEY = 'pk3d.enabled';

type AnyMirror = OverworldMirror | BattleMirror;

class Engine3D {
  private game: Phaser.Game;
  private stage: ThreeStage | null = null;
  private rig: CameraRig | null = null;
  private mirror: AnyMirror | null = null;
  private mirrorScene: Phaser.Scene | null = null;
  private enabled: boolean;
  private failed = false;
  private camPatched = new WeakSet<Phaser.Cameras.Scene2D.Camera>();

  constructor(game: Phaser.Game) {
    this.game = game;
    this.enabled = (localStorage.getItem(STORE_KEY) ?? '1') === '1';
    // Load the generated-asset registries up front so the first scene already
    // knows which creature models and city props exist.
    primeManifest();
    primeProps();

    window.addEventListener('keydown', (e) => {
      if (e.code === 'F3') { e.preventDefault(); this.toggle(); }
    });

    game.events.on(Phaser.Core.Events.POST_STEP, (_t: number, dms: number) => this.step(dms / 1000));
    // Watch every scene's shutdown to drop its mirror.
    for (const sc of game.scene.scenes) {
      sc.events.on(Phaser.Scenes.Events.SHUTDOWN, () => this.onSceneDown(sc));
      sc.events.on(Phaser.Scenes.Events.DESTROY, () => this.onSceneDown(sc));
    }
  }

  toggle(): void {
    this.enabled = !this.enabled;
    localStorage.setItem(STORE_KEY, this.enabled ? '1' : '0');
    if (!this.enabled) {
      this.mirror?.restore2D();
      if (this.mirrorScene) this.setCamTransparent(this.mirrorScene, false);
      this.stage?.setVisible(false);
    } else {
      this.mirror?.apply3D();
      if (this.mirrorScene) this.setCamTransparent(this.mirrorScene, true);
      if (this.mirror) this.stage?.setVisible(true);
    }
  }

  private ensureStage(): boolean {
    if (this.failed) return false;
    if (this.stage) return true;
    try {
      this.stage = new ThreeStage(this.game);
      this.rig = new CameraRig(this.stage.camera);
      return true;
    } catch (err) {
      console.warn('[engine3d] WebGL unavailable, staying 2D:', err);
      this.failed = true;
      return false;
    }
  }

  /** Pick the scene that should drive 3D: battle first, else any scene with a
   *  detectable player (camera-follow overworld or static-camera interior). */
  private pickScene(): { scene: Phaser.Scene; kind: 'battle' | 'overworld' } | null {
    const active = this.game.scene.getScenes(true);
    // A scene can opt out of 3D entirely (e.g. the multi-floor department store,
    // whose flat interior + elevator UI must stay pure 2D) by setting disable3D.
    const opted = (sc: Phaser.Scene) => !!(sc as unknown as { disable3D?: boolean }).disable3D;
    for (let i = active.length - 1; i >= 0; i--) {
      const sc = active[i];
      if (opted(sc)) continue;
      if (/Battle/i.test(sc.scene.key)) return { scene: sc, kind: 'battle' };
    }
    for (let i = active.length - 1; i >= 0; i--) {
      const sc = active[i];
      if (opted(sc)) continue;
      if (sc.cameras?.main && OverworldMirror.findPlayer(sc)) return { scene: sc, kind: 'overworld' };
    }
    return null;
  }

  private onSceneDown(sc: Phaser.Scene): void {
    if (this.mirrorScene === sc) {
      this.mirror?.destroy();
      this.mirror = null;
      this.mirrorScene = null;
      this.stage?.setVisible(false);
    }
  }

  private setCamTransparent(scene: Phaser.Scene, on: boolean): void {
    const cam = scene.cameras?.main as (Phaser.Cameras.Scene2D.Camera & { transparent: boolean }) | undefined;
    if (cam) cam.transparent = on;
  }

  private step(dt: number): void {
    if (!this.enabled || this.failed) return;
    const pick = this.pickScene();

    if (!pick) {
      // The mirrored scene may only be PAUSED (evolution overlay, menu, move
      // learning launched over a battle) — it left the active list but still
      // renders. Keep the 3D view up and frozen underneath the overlay;
      // destroying it here is what snapped gym battles back to 2D mid-fight.
      const held = this.mirrorScene;
      if (this.mirror && this.stage && held && (held.scene.isPaused() || held.scene.isVisible())) {
        this.stage.setVisible(true);
        this.mirror.update(Math.min(dt, 0.1));   // idle animations keep breathing
        this.stage.render();
        return;
      }
      // Truly no 3D-able scene (title, menus…): hide the 3D canvas, full 2D.
      if (this.mirror) { this.mirror.destroy(); this.mirror = null; this.mirrorScene = null; }
      this.stage?.setVisible(false);
      return;
    }

    if (!this.ensureStage()) return;
    const stage = this.stage!;
    stage.attachDom();

    if (this.mirrorScene !== pick.scene) {
      this.mirror?.destroy();
      this.mirrorScene = pick.scene;
      this.mirror = pick.kind === 'battle'
        ? new BattleMirror(pick.scene, stage, this.rig!)
        : new OverworldMirror(pick.scene, stage, this.rig!);
    }

    // Overworld mirrors only "arm" once the camera-follow exists.
    if (this.mirror instanceof OverworldMirror && !this.mirror.tryBuild()) {
      stage.setVisible(false);
      return;
    }

    this.setCamTransparent(pick.scene, true);
    stage.setVisible(true);
    this.mirror!.update(Math.min(dt, 0.1));
    stage.render();
  }
}

export function bootstrap3D(game: Phaser.Game): void {
  const start = () => {
    try {
      const eng = new Engine3D(game);
      (window as unknown as { __pk3d?: Engine3D }).__pk3d = eng;
    } catch (err) {
      console.warn('[engine3d] failed to start, game remains 2D:', err);
    }
  };
  if (game.isBooted) start();
  else game.events.once(Phaser.Core.Events.READY, start);
}
