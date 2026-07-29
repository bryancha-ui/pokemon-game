import Phaser from 'phaser';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { CreatureAnimator, MoveCategory } from './CreatureAnimator';
import { buildRelief, reliefMaterials } from './Extruder';
import { measureCommands } from './GraphicsRaster';
import { getModel, hasModel, primeManifest } from './GlbModels';
import { MoveFX3D } from './MoveFX3D';
import { makeBlobShadow, makeGrassTufts, makeRocks, makeTrees, toonMat, toonRamp } from './Props';
import { ThreeStage } from './ThreeStage';

// ── Battle mirror ────────────────────────────────────────────────────────────
// Turns the existing 2D battle scenes into a cinematic 3D arena without
// touching a line of battle logic. The two creature Images are lifted into
// extruded 3D meshes standing on a grassy arena; every tween the battle code
// already runs on those sprites (send-out fades, attack lunges, hit shakes,
// faints) automatically drives the 3D models, and the rig adds modern-style
// camera drift, punch-ins and shake. All battle UI stays 2D on top.

type GO = Phaser.GameObjects.GameObject & {
  x?: number; y?: number; alpha?: number; visible?: boolean;
  scaleX?: number; scaleY?: number; angle?: number;
  displayWidth?: number; displayHeight?: number; flipX?: boolean;
  tintTopLeft?: number; isTinted?: boolean; tintFill?: boolean;
};

interface Combatant {
  obj: GO & Phaser.GameObjects.Image;
  holder: THREE.Group;
  inner: THREE.Mesh;
  mats: THREE.MeshLambertMaterial[];
  shadow: THREE.Mesh;
  side: 'player' | 'enemy';
  slot: number;
  base: { x: number; y: number } | null;
  settleTimer: number;
  lastPos: { x: number; y: number };
  speed: number;
  /** world-units-per-art-pixel, normalized at adoption from the DISPLAY size. */
  scalePx: number;
  /** the sprite's scale at adoption — later tweened scales are applied as ratios. */
  adoptSX: number; adoptSY: number;
  phase: number;
  /** generated true-3D model (GLB) support */
  glbKey: string | null;
  glb: THREE.Group | null;
  targetH: number;
  /** battle motion driver (clip playback or procedural) */
  anim: CreatureAnimator | null;
  fainted: boolean;
  /** texture signature — rebuilt when the game swaps the sprite's texture
   *  (async PokeAPI art arriving, party switches). */
  texSig: string;
}

const ANCHORS = {
  player: [new THREE.Vector3(-1.85, 0, 1.15), new THREE.Vector3(-3.2, 0, 1.9)],
  enemy:  [new THREE.Vector3(2.0, 0, -2.4), new THREE.Vector3(3.4, 0, -3.2)],
};

export class BattleMirror {
  readonly scene: Phaser.Scene;
  private stage: ThreeStage;
  private rig: CameraRig;
  private root: THREE.Group;
  private combatants = new Map<GO, Combatant>();
  private hiddenBackdrops = new Set<GO>();
  private time = 0;
  private built = false;
  private onAdded: (obj: Phaser.GameObjects.GameObject) => void;
  private fx: MoveFX3D;
  private pendingBursts: { at: THREE.Vector3; color: number; eff: number; t: number }[] = [];
  private onMoveFx: (d: { attacker: GO; target: GO; color: number; category: string; effectiveness: number }) => void;

  constructor(scene: Phaser.Scene, stage: ThreeStage, rig: CameraRig) {
    this.scene = scene;
    this.stage = stage;
    this.rig = rig;
    this.root = stage.resetWorld();
    primeManifest();                 // generated GLB models, if the game ships any
    this.buildArena();
    stage.setEnvironment('battle');
    rig.setMode('battle');
    this.fx = new MoveFX3D(this.root);
    this.onMoveFx = (d) => this.handleMoveFx(d);
    scene.events.on('pk3d-movefx', this.onMoveFx);
    this.onAdded = (obj) => this.consider(obj as GO);
    scene.events.on('addedtoscene', this.onAdded);
    for (const obj of scene.children.list) this.consider(obj as GO);
    this.built = true;
  }

  destroy(): void {
    this.scene.events.off('addedtoscene', this.onAdded);
    this.scene.events.off('pk3d-movefx', this.onMoveFx);
    this.combatants.clear();
    this.hiddenBackdrops.clear();
  }

  /** Mirror a 2D move as a 3D effect: special = orb projectile with an arc,
   *  physical = impact burst timed to the (already-mirrored) lunge. */
  private handleMoveFx(d: {
    attacker: GO; target: GO; color: number; category: string;
    moveType?: string; moveName?: string; power?: number; effectiveness: number;
  }): void {
    const atk = this.combatants.get(d.attacker);
    const tgt = this.combatants.get(d.target);
    if (!atk || !tgt) return;
    const from = atk.holder.position.clone(); from.y += 1.0;
    const to = tgt.holder.position.clone(); to.y += 0.9;
    const dir = tgt.holder.position.clone().sub(atk.holder.position);
    const category = (d.category === 'special' || d.category === 'status' ? d.category : 'physical') as MoveCategory;
    // Stronger moves swing harder; PokeAPI power tops out around 120.
    const powerScale = 0.7 + Math.min(1.2, (d.power ?? 60) / 100) * 0.6;

    // The 3D model acts out the move; static models get a procedural routine,
    // rigged models play their own attack clip.
    atk.anim?.attack(category, dir, powerScale, () => {
      tgt.anim?.hit(d.effectiveness > 1 ? 1.3 : 1);
      this.rig.focusOn(tgt.holder.position, 0.7);
      this.rig.addShake(d.effectiveness > 1 ? 0.7 : 0.45);
    });

    if (category === 'special') {
      this.fx.fireProjectile(from, to, d.color, d.effectiveness, () => {
        if (!atk.anim) {                      // relief battlers: FX drives the beat
          tgt.anim?.hit(1);
          this.rig.focusOn(tgt.holder.position, 0.8);
          this.rig.addShake(d.effectiveness > 1 ? 0.7 : 0.45);
        }
      });
    } else if (category === 'physical') {
      this.pendingBursts.push({ at: to.clone(), color: d.color, eff: d.effectiveness, t: 0.28 });
      if (!atk.anim) this.rig.focusOn(tgt.holder.position, 0.6);
    } else {
      // Status move: a coloured aura pulse on the user, no projectile.
      this.fx.burst(atk.holder.position.clone(), d.color, 0.8);
    }
  }

  // ── Arena ──
  private buildArena(): void {
    // Painted arena ground: soft radial grass gradient with two dirt battle spots.
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const ctx = c.getContext('2d')!;
    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 300);
    grad.addColorStop(0, '#7fc45e');
    grad.addColorStop(0.7, '#5ea84b');
    grad.addColorStop(1, '#4c9440');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
    // Mown stripes.
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#20401a';
      ctx.fillRect(0, i * 64, 512, 32);
    }
    ctx.globalAlpha = 1;
    const spot = (x: number, y: number) => {
      const g2 = ctx.createRadialGradient(x, y, 8, x, y, 66);
      g2.addColorStop(0, '#c9a86e');
      g2.addColorStop(0.8, '#b2925c');
      g2.addColorStop(1, 'rgba(178,146,92,0)');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x, y, 66, 0, Math.PI * 2); ctx.fill();
    };
    spot(256 - 90, 256 + 105); spot(256 + 95, 256 - 115);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(11, 40),
      new THREE.MeshToonMaterial({ map: tex, gradientMap: toonRamp() }),
    );
    ground.rotation.x = -Math.PI / 2;
    this.root.add(ground);

    const rim = new THREE.Mesh(new THREE.CylinderGeometry(11.15, 11.6, 0.9, 40, 1, true), toonMat(0x6b5a44));
    rim.position.y = -0.46;
    this.root.add(rim);

    // Scenery ring: trees, rocks and grass around the arena edge.
    const trees = makeTrees(26);
    const rocks = makeRocks(14);
    const grass = makeGrassTufts(40);
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2 + rnd(-0.1, 0.1);
      const r = rnd(8.6, 10.6);
      trees.place(Math.cos(a) * r, Math.sin(a) * r, rnd(0.9, 1.5), rnd(0, Math.PI * 2));
    }
    for (let i = 0; i < 12; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(7.4, 10.2);
      rocks.place(Math.cos(a) * r, Math.sin(a) * r, rnd(0.6, 1.2), rnd(0, Math.PI * 2));
    }
    for (let i = 0; i < 36; i++) {
      const a = rnd(0, Math.PI * 2), r = rnd(5.6, 10.4);
      grass.place(Math.cos(a) * r, Math.sin(a) * r, rnd(0.7, 1.2), rnd(0, Math.PI));
    }
    trees.finalize(); rocks.finalize(); grass.finalize();
    for (const m of [...trees.meshes, ...rocks.meshes, ...grass.meshes]) this.root.add(m);
  }

  // ── Sprite adoption ──
  private consider(obj: GO): void {
    if (this.combatants.has(obj) || this.hiddenBackdrops.has(obj)) return;

    // The painted 2D backdrop (sky/field/mountains) is one near-fullscreen
    // Graphics — hide it so the 3D arena shows. Small graphics (HP accents,
    // the thrown ball, move FX) stay 2D on top.
    if (obj instanceof Phaser.GameObjects.Graphics) {
      const buf = (obj as unknown as { commandBuffer: unknown[] }).commandBuffer;
      if (buf?.length) {
        const m = measureCommands(buf);
        if (m) {
          const W = this.scene.scale.width, H = this.scene.scale.height;
          if ((m.maxX - m.minX) >= W * 0.7 && (m.maxY - m.minY) >= H * 0.55) {
            this.hiddenBackdrops.add(obj);
            this.scene.cameras.main.ignore(obj);
          }
        }
      }
      return;
    }
    // 2D projectile orbs (circles) are replaced by the 3D move effects.
    if (obj instanceof Phaser.GameObjects.Arc) {
      this.hiddenBackdrops.add(obj);
      this.scene.cameras.main.ignore(obj);
      return;
    }
    if (!(obj instanceof Phaser.GameObjects.Image) && !(obj instanceof Phaser.GameObjects.Sprite)) return;
    const im = obj as GO & Phaser.GameObjects.Image;
    const dw = im.displayWidth ?? 0, dh = im.displayHeight ?? 0;
    const W = this.scene.scale.width, H = this.scene.scale.height;

    // Fullscreen art = backdrop → hide (the 3D arena replaces it).
    if (dw >= W * 0.85 && dh >= H * 0.85) {
      this.hiddenBackdrops.add(im);
      this.scene.cameras.main.ignore(im);
      return;
    }
    if (dw < 70 || dh < 70) return;                     // icons stay 2D

    const src = this.frameCanvas(im);
    if (!src) return;
    const relief = buildRelief(`img:${im.texture.key}:${im.frame?.name ?? 0}`, src);
    if (!relief) return;

    const side: 'player' | 'enemy' = (im.x ?? 0) < W / 2 ? 'player' : 'enemy';
    const slot = [...this.combatants.values()].filter(cb => cb.side === side).length % 2;

    const mats = reliefMaterials(relief.texture);
    const inner = new THREE.Mesh(relief.geometry, mats);
    inner.userData.sharedGeo = true;
    // Normalize creature height to a consistent stage presence. The bias from
    // the 2D display size is kept NARROW so a 96px pixel sprite and a 512px
    // HOME render both land near the same world height (fixes giant/small
    // battlers when art resolution varies wildly).
    const sizeBias = Math.min(1.15, Math.max(0.85, dh / 220));
    const scale = (2.2 * sizeBias) / relief.pxHeight;
    inner.scale.setScalar(scale);

    const holder = new THREE.Group();
    holder.add(inner);
    const shadow = makeBlobShadow(Math.min(1.5, (relief.pxWidth * scale) * 0.42));
    holder.add(shadow);

    const anchor = ANCHORS[side][slot];
    holder.position.copy(anchor);
    // Face the opponent: player mon shows its back 3/4, enemy faces camera 3/4.
    holder.rotation.y = side === 'player' ? Math.PI * 0.88 : Math.PI * 0.06;
    if (side === 'player') inner.scale.x *= -1;         // its art was flipX'd in 2D

    this.root.add(holder);
    this.combatants.set(im, {
      obj: im, holder, inner, mats, shadow, side, slot,
      base: null, settleTimer: 0,
      lastPos: { x: im.x ?? 0, y: im.y ?? 0 }, speed: 0,
      scalePx: scale,
      adoptSX: Math.abs(im.scaleX ?? 1) || 1, adoptSY: Math.abs(im.scaleY ?? 1) || 1,
      phase: Math.random() * Math.PI * 2,
      glbKey: hasModel(im.texture.key) ? im.texture.key : null,
      glb: null,
      // Generated models read smaller than flat art at equal height (they have
      // real depth), so give them extra presence — SwSh-scale battlers.
      targetH: 2.9 * Math.min(1.25, Math.max(0.95, dh / 220)),
      anim: null,
      fainted: false,
      texSig: `${im.texture.key}:${im.frame?.name ?? 0}`,
    });
    this.scene.cameras.main.ignore(im);
  }

  /** Rebuild a battler's relief + scale factors for its CURRENT texture. */
  private refreshCombatant(cb: Combatant): void {
    const im = cb.obj;
    const src = this.frameCanvas(im);
    if (!src) return;
    const relief = buildRelief(`img:${im.texture.key}:${im.frame?.name ?? 0}`, src);
    if (!relief) return;
    cb.inner.geometry = relief.geometry;
    cb.mats[0].map = relief.texture;
    cb.mats[0].needsUpdate = true;
    const dh = im.displayHeight ?? 0;
    const sizeBias = Math.min(1.15, Math.max(0.85, dh / 220));
    cb.scalePx = (2.2 * sizeBias) / relief.pxHeight;
    cb.adoptSX = Math.abs(im.scaleX ?? 1) || 1;
    cb.adoptSY = Math.abs(im.scaleY ?? 1) || 1;
    cb.targetH = 2.9 * Math.min(1.25, Math.max(0.95, dh / 220));
    // A different creature key means a different generated model (or none).
    const nk = hasModel(im.texture.key) ? im.texture.key : null;
    if (cb.glb && nk !== cb.glbKey) {
      cb.holder.remove(cb.glb);
      cb.glb = null;
      cb.anim = null;
      cb.inner.visible = true;
    }
    cb.glbKey = nk;
    cb.fainted = false;
  }

  private frameCanvas(im: Phaser.GameObjects.Image): HTMLCanvasElement | null {
    try {
      const frame = im.frame;
      const srcImg = im.texture.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      if (!srcImg || !frame) return null;
      const c = document.createElement('canvas');
      c.width = frame.cutWidth || srcImg.width;
      c.height = frame.cutHeight || srcImg.height;
      c.getContext('2d')!.drawImage(srcImg as CanvasImageSource, frame.cutX, frame.cutY, c.width, c.height, 0, 0, c.width, c.height);
      return c;
    } catch { return null; }
  }

  // ── Frame sync ──
  update(dt: number): void {
    if (!this.built) return;
    this.time += dt;
    this.fx.update(dt);
    for (let i = this.pendingBursts.length - 1; i >= 0; i--) {
      const p = this.pendingBursts[i];
      p.t -= dt;
      if (p.t <= 0) {
        this.fx.burst(p.at, p.color, p.eff);
        this.rig.addShake(p.eff > 1 ? 0.7 : 0.45);
        this.pendingBursts.splice(i, 1);
      }
    }

    const dead: GO[] = [];
    for (const cb of this.combatants.values()) {
      const o = cb.obj;
      if (!o.scene) { dead.push(o); continue; }

      // The game swaps sprite textures at runtime (async PokeAPI art arriving,
      // party switches). Rebuild this battler's mesh + scale when that happens —
      // otherwise the old geometry stretches the new image like an accordion.
      const sig = `${o.texture.key}:${o.frame?.name ?? 0}`;
      if (sig !== cb.texSig) {
        cb.texSig = sig;
        this.refreshCombatant(cb);
      }

      // The manifest loads asynchronously, so a creature adopted before it
      // arrived still resolves to its generated model once the list is in.
      if (!cb.glbKey && !cb.glb && hasModel(cb.obj.texture.key)) cb.glbKey = cb.obj.texture.key;

      // Swap in the generated true-3D model once it finishes loading.
      if (cb.glbKey && !cb.glb) {
        const loaded = getModel(cb.glbKey);
        if (loaded) {
          const model = loaded.group;
          model.rotation.y = cb.side === 'player' ? Math.PI : 0;   // face the opponent
          cb.glb = model;
          cb.inner.visible = false;
          cb.holder.add(model);
          // Any clips inside the GLB drive the model; otherwise the animator
          // moves the whole mesh procedurally.
          cb.anim = new CreatureAnimator(model, loaded.animations);
          cb.anim.setFacing(model.rotation.y);
        }
      }

      const x = o.x ?? 0, y = o.y ?? 0;
      const dx = x - cb.lastPos.x, dy = y - cb.lastPos.y;
      cb.speed = cb.speed * 0.82 + (Math.abs(dx) + Math.abs(dy)) * 0.18;
      cb.lastPos = { x, y };

      // Capture the "settled" position once the sprite is visible and still.
      const vis = (o.visible !== false) && ((o.alpha ?? 1) > 0.85);
      if (vis && Math.abs(dx) + Math.abs(dy) < 0.6) {
        cb.settleTimer += dt;
        if (cb.settleTimer > 0.25 && !cb.base) cb.base = { x, y };
      } else if (!vis) {
        cb.settleTimer = 0;
      }

      const anchor = ANCHORS[cb.side][cb.slot];
      const toward = ANCHORS[cb.side === 'player' ? 'enemy' : 'player'][0].clone().sub(anchor).normalize();

      if (cb.base && !cb.glb) {
        // Relief battlers follow the 2D tweens: horizontal delta pushes along
        // the attack axis (a lunge), vertical delta lifts or sinks.
        // (Models with an animator stay anchored and act out the move in 3D.)
        const offAxis = (x - cb.base.x) / 46 * (cb.side === 'player' ? 1 : -1);
        const lift = Math.max(-0.4, -(y - cb.base.y) / 90);
        cb.holder.position.set(
          anchor.x + toward.x * offAxis,
          Math.max(0, lift),
          anchor.z + toward.z * offAxis,
        );
        // A fast move = an attack → cinematic punch toward the actor.
        if (cb.speed > 14) {
          this.rig.focusOn(cb.holder.position, Math.min(1, cb.speed / 60));
        }
      }

      // Idle life: breathing + slight sway while standing.
      const idle = 1 + Math.sin(this.time * 2.4 + cb.phase) * 0.018;
      const relX = Math.abs(o.scaleX ?? 1) / cb.adoptSX;      // ratio vs adoption
      const relY = Math.abs(o.scaleY ?? 1) / cb.adoptSY;      // (send-out grow etc.)
      if (cb.glb) {
        // Fainting: the battle fades/drops the sprite — play the topple once.
        const down = (o.alpha ?? 1) < 0.5 || o.visible === false;
        if (down && !cb.fainted && cb.base) { cb.fainted = true; cb.anim?.faint(); }
        if (!down && cb.fainted) cb.fainted = false;
        // The animator owns this model's transform (position/rotation/scale).
        cb.anim?.update(dt, cb.targetH * ((relX + relY) / 2));
        cb.glb.visible = (o.alpha ?? 1) > 0.05;
      } else {
        const sx = relX * cb.scalePx;
        const sy = relY * cb.scalePx * idle;
        cb.inner.scale.set(cb.side === 'player' ? -sx : sx, sy, cb.scalePx);
        cb.inner.rotation.z = -((o.angle ?? 0) * Math.PI / 180);
      }

      // Opacity / tint flashes (send-out fade, hit flash, faint fade).
      const tint = o as { tintTopLeft?: number; isTinted?: boolean; tintFill?: boolean };
      for (const m of cb.mats) {
        m.opacity = o.alpha ?? 1;
        if (tint.isTinted && tint.tintTopLeft !== undefined) {
          m.color.set(tint.tintTopLeft);
          m.emissive.set(tint.tintFill ? 0xffffff : 0x000000);
          m.emissiveIntensity = tint.tintFill ? 0.85 : 0;
        } else {
          m.color.set(0xffffff);
          m.emissiveIntensity = 0;
        }
      }
      cb.holder.visible = (o.visible !== false) && ((o.alpha ?? 1) > 0.02);
      cb.shadow.visible = cb.holder.position.y < 0.5;
    }
    for (const d of dead) {
      const cb = this.combatants.get(d);
      if (cb) { this.root.remove(cb.holder); this.combatants.delete(d); }
    }

    // 2D camera shake → 3D shake (existing battle code shakes on hits).
    const cam = this.scene.cameras.main as unknown as { shakeEffect?: { isRunning?: boolean } };
    if (cam.shakeEffect?.isRunning) this.rig.addShake(0.4);

    this.rig.update(dt, null);
  }

  restore2D(): void {
    const cam = this.scene.cameras.main as Phaser.Cameras.Scene2D.Camera & { id: number };
    const unhide = (o: GO) => { (o as unknown as { cameraFilter: number }).cameraFilter &= ~cam.id; };
    for (const cb of this.combatants.values()) unhide(cb.obj);
    for (const b of this.hiddenBackdrops) unhide(b);
  }

  apply3D(): void {
    for (const cb of this.combatants.values()) this.scene.cameras.main.ignore(cb.obj);
    for (const b of this.hiddenBackdrops) this.scene.cameras.main.ignore(b);
  }
}
