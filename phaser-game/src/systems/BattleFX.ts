import Phaser from 'phaser';
import { MoveData } from '../battle/Pokemon';
import { TYPE_COLORS } from '../data/StarterData';

/**
 * Play a quick attack animation for `move`, from the attacker sprite toward the
 * target sprite, then call `onImpact` at the moment of contact. Type-coloured:
 *   • physical → the attacker lunges into the target
 *   • special  → a coloured projectile flies to the target
 * On impact the target flashes its type colour, jitters, sprays coloured shards,
 * the camera gives a small shake, and a hit sound plays (a brighter "sting" when
 * the move is super-effective). `effectiveness` is the type multiplier from
 * takeDamage (0 = no effect, >1 = super effective).
 */
export function playMoveFX(
  scene: Phaser.Scene,
  attacker: Phaser.GameObjects.Image,
  target: Phaser.GameObjects.Image,
  move: MoveData,
  effectiveness: number,
  onImpact: () => void,
): void {
  const color = (TYPE_COLORS as Record<string, number>)[move.type] ?? 0xffffff;
  // Visual-layer hook only: lets the 3D renderer mirror this move as a 3D
  // effect (projectile / impact burst). No game behavior depends on it.
  scene.events.emit('pk3d-movefx', {
    attacker, target, color,
    category: move.category, moveType: move.type, moveName: move.name,
    power: move.power ?? 0, effectiveness,
  });
  const ax = attacker.x, ay = attacker.y;
  const tx = target.x, ty = target.y;

  const impact = () => {
    flashTarget(scene, target, color);
    scene.cameras.main.shake(150, 0.006);
    playHitSfx(scene, effectiveness);
    onImpact();
  };

  if (move.category === 'physical') {
    scene.tweens.add({
      targets: attacker,
      x: ax + (tx - ax) * 0.3,
      y: ay + (ty - ay) * 0.3,
      duration: 120, yoyo: true, ease: 'Quad.easeOut',
      onYoyo: impact,
      onComplete: () => attacker.setPosition(ax, ay),
    });
  } else {
    const orb  = scene.add.circle(ax, ay, 11, color, 0.95).setDepth(9);
    const glow = scene.add.circle(ax, ay, 20, color, 0.30).setDepth(9);
    scene.tweens.add({
      targets: [orb, glow], x: tx, y: ty, duration: 240, ease: 'Sine.easeIn',
      onComplete: () => { orb.destroy(); glow.destroy(); impact(); },
    });
  }
}

function flashTarget(scene: Phaser.Scene, target: Phaser.GameObjects.Image, color: number): void {
  target.setTint(color);
  scene.time.delayedCall(100, () => target.clearTint());
  const ox = target.x;
  scene.tweens.add({
    targets: target, x: ox - 7, duration: 45, yoyo: true, repeat: 3,
    onComplete: () => target.setX(ox),
  });
  for (let i = 0; i < 12; i++) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 18 + Math.random() * 34;
    const p = scene.add.circle(ox, target.y, Math.random() < 0.35 ? 4 : 2, color, 0.9).setDepth(11);
    scene.tweens.add({
      targets: p,
      x: ox + Math.cos(ang) * dist,
      y: target.y + Math.sin(ang) * dist,
      alpha: 0, duration: 280 + Math.random() * 220,
      onComplete: () => p.destroy(),
    });
  }
}

/**
 * Synthesised hit sound (no audio asset needed). A filtered noise "thud" when a
 * damaging move lands, plus a bright rising two-tone "sting" when it's super
 * effective. Uses Phaser's already-unlocked WebAudio context.
 */
export function playHitSfx(scene: Phaser.Scene, effectiveness: number): void {
  if (effectiveness === 0) return;                       // "no effect" → no hit sound
  if (scene.game.registry.get('bgmMuted')) return;
  const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
  const ac = mgr && mgr.context;
  if (!ac) return;                                       // non-WebAudio (e.g. HTML5) — skip
  if (ac.state === 'suspended') { try { ac.resume(); } catch { /* ignore */ } }
  const now = ac.currentTime;
  const superEff = effectiveness > 1;

  // Impact "thud" — a short decaying noise burst through a low-pass filter.
  const dur = superEff ? 0.16 : 0.11;
  const buf = ac.createBuffer(1, Math.max(1, Math.floor(ac.sampleRate * dur)), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const t = i / data.length;
    data[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
  }
  const noise = ac.createBufferSource(); noise.buffer = buf;
  const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
  lp.frequency.value = superEff ? 3600 : 1400;
  const g = ac.createGain(); g.gain.value = superEff ? 0.32 : 0.26;
  noise.connect(lp); lp.connect(g); g.connect(ac.destination);
  noise.start(now); noise.stop(now + dur);

  // Super effective → a bright rising two-note sting on top.
  if (superEff) {
    [880, 1320].forEach((freq, k) => {
      const t0 = now + k * 0.05;
      const osc = ac.createOscillator(); osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t0);
      const og = ac.createGain();
      og.gain.setValueAtTime(0.0001, t0);
      og.gain.exponentialRampToValueAtTime(0.16, t0 + 0.012);
      og.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
      osc.connect(og); og.connect(ac.destination);
      osc.start(t0); osc.stop(t0 + 0.16);
    });
  }
}
