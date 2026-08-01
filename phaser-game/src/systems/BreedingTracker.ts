import Phaser from 'phaser';
import { t } from './i18n';
import { BreedingSystem } from './BreedingSystem';

/**
 * Scene plugin that turns actual overworld movement into nursery steps. Every
 * map already exposes its player coordinates as `px`/`py`; tracking those here
 * keeps breeding and hatching consistent across routes, towns and interiors.
 */
export class BreedingTrackerPlugin extends Phaser.Plugins.ScenePlugin {
  private lastX?: number;
  private lastY?: number;
  private distance = 0;

  constructor(scene: Phaser.Scene, pluginManager: Phaser.Plugins.PluginManager, pluginKey: string) {
    super(scene, pluginManager, pluginKey);
  }

  boot(): void {
    this.systems!.events.on('update', this.track, this);
    this.systems!.events.once('shutdown', this.cleanup, this);
    this.systems!.events.once('destroy', this.cleanup, this);
  }

  private track(): void {
    const scene = this.scene as Phaser.Scene & { px?: number; py?: number };
    const x = scene.px, y = scene.py;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      this.lastX = this.lastY = undefined;
      return;
    }
    if (this.lastX === undefined || this.lastY === undefined) {
      this.lastX = x; this.lastY = y;
      return;
    }
    const moved = Math.hypot(x! - this.lastX, y! - this.lastY);
    this.lastX = x; this.lastY = y;
    // Ignore scene spawns, warps and scripted teleports; ordinary running and
    // cycling stay far below this per-frame threshold.
    if (moved < 0.05 || moved > 64 || !BreedingSystem.hasStepWork(scene.registry)) return;
    this.distance += moved;
    if (this.distance < 32) return;
    const steps = Math.floor(this.distance / 32);
    this.distance -= steps * 32;
    const result = BreedingSystem.advanceSteps(scene.registry, steps);
    if (result.eggBecameReady) this.toast(t('The nursery found an Egg!', '키우미집에서 알이 발견되었습니다!'), '🥚');
    if (result.hatched) {
      const where = result.hatched.destination === 'party'
        ? t('joined your party!', '동료가 되었습니다!')
        : t('was sent to the PC Box.', 'PC 보관함으로 전송되었습니다.');
      this.toast(`${result.hatched.child.name} ${where}`, '✨');
    }
  }

  private toast(message: string, icon: string): void {
    const scene = this.scene;
    if (!scene?.add || !scene.cameras?.main) return;
    const w = scene.scale.width;
    const bg = scene.add.rectangle(w / 2, 78, 620, 64, 0x182338, 0.96)
      .setStrokeStyle(2, 0xffe28a).setScrollFactor(0).setDepth(999998);
    const text = scene.add.text(w / 2, 78, `${icon}  ${message}`, {
      fontSize: '20px', color: '#ffffff', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(999999);
    scene.tweens.add({ targets: [bg, text], alpha: 0, y: 58, delay: 3200, duration: 500,
      onComplete: () => { bg.destroy(); text.destroy(); } });
  }

  private cleanup(): void {
    this.systems!.events.off('update', this.track, this);
    this.lastX = this.lastY = undefined;
    this.distance = 0;
  }
}
