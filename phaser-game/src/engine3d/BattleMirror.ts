import Phaser from 'phaser';
import * as THREE from 'three';
import { CameraRig } from './CameraRig';
import { buildPlayerModel, buildPortraitCharacterModel, PlayerModel } from './CharacterModel';
import { CreatureAnimator, MoveCategory } from './CreatureAnimator';
import { buildFlatCard, buildRelief, reliefMaterials } from './Extruder';
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
  mats: THREE.MeshBasicMaterial[];
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
  baseSX: number | null; baseSY: number | null;
  lastSX: number; scaleStill: number;
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
  // Slot 1 stays beside slot 0: intro portraits hand the spot to the Pokémon,
  // so both must occupy the same stage position.
  player: [new THREE.Vector3(-1.85, 0, 1.15), new THREE.Vector3(-2.1, 0, 1.3)],
  enemy:  [new THREE.Vector3(2.0, 0, -2.4), new THREE.Vector3(2.25, 0, -2.6)],
};

// A battle trainer (e.g. the rival) walks in from the back of the arena toward
// the player during the intro, then retires as its Pokémon is sent out.
const TRAINER_START = new THREE.Vector3(3.4, 0, -4.7);
const TRAINER_END   = new THREE.Vector3(1.1, 0, -1.0);

interface TrainerWalker {
  obj: GO;                 // the 2D intro portrait whose alpha drives the walk
  model: PlayerModel;
  group: THREE.Group;
  t: number;               // walk-in progress 0..1
  phase: number;           // leg-swing phase
  seen: boolean;           // portrait has been visible at least once
}

interface ScreenTargetRequest {
  target: GO;
  x: number;
  y: number;
  /** Fraction of the combatant's height to target (0 = feet, 1 = top). */
  heightRatio?: number;
}

export class BattleMirror {
  readonly scene: Phaser.Scene;
  private stage: ThreeStage;
  private rig: CameraRig;
  private root: THREE.Group;
  private combatants = new Map<GO, Combatant>();
  private trainers: TrainerWalker[] = [];
  private hiddenBackdrops = new Set<GO>();
  // Phaser adds factory-created objects to the display list before the caller's
  // fluent setup runs. Defer classification until the next frame so Graphics
  // have their draw commands and Images have final no3d tags/sizing.
  private pendingObjects = new Set<GO>();
  private active3D = true;
  private time = 0;
  private built = false;
  private onAdded: (obj: Phaser.GameObjects.GameObject) => void;
  private fx: MoveFX3D;
  private pendingBursts: { at: THREE.Vector3; color: number; eff: number; t: number }[] = [];
  private onMoveFx: (d: { attacker: GO; target: GO; color: number; category: string; effectiveness: number }) => void;
  private onScreenTarget: (d: ScreenTargetRequest) => void;

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
    this.onScreenTarget = (d) => this.projectCombatantToScreen(d);
    scene.events.on('pk3d-movefx', this.onMoveFx);
    scene.events.on('pk3d-screen-target', this.onScreenTarget);
    this.onAdded = (obj) => this.pendingObjects.add(obj as GO);
    scene.events.on('addedtoscene', this.onAdded);
    for (const obj of scene.children.list) this.consider(obj as GO);
    this.built = true;
  }

  destroy(): void {
    this.scene.events.off('addedtoscene', this.onAdded);
    this.scene.events.off('pk3d-movefx', this.onMoveFx);
    this.scene.events.off('pk3d-screen-target', this.onScreenTarget);
    this.combatants.clear();
    for (const w of this.trainers) this.root.remove(w.group);
    this.trainers.length = 0;
    this.hiddenBackdrops.clear();
    this.pendingObjects.clear();
  }

  /** Return the live Phaser-screen position of a point on a 3D combatant. */
  private projectCombatantToScreen(d: ScreenTargetRequest): void {
    if (!this.active3D) return;        // F3 2D mode keeps the sprite fallback
    const cb = this.combatants.get(d.target);
    if (!cb) return;                  // 2D mode / unmirrored object keeps fallback

    const p = cb.holder.position.clone();
    const heightRatio = Math.min(1, Math.max(0, d.heightRatio ?? 0.52));
    p.y += cb.targetH * heightRatio;  // aim at the torso, not above the head

    const camera = this.stage.camera;
    camera.updateMatrixWorld();
    p.project(camera);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y) || p.z < -1 || p.z > 1) return;

    d.x = (p.x + 1) * 0.5 * this.scene.scale.width;
    d.y = (1 - p.y) * 0.5 * this.scene.scale.height;
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
      // Custom battle scenes can identify their backdrop explicitly. This is
      // authoritative and avoids relying on command-buffer measurement for
      // complex art such as Jin's gradient-filled night skyline.
      if (obj.getData('pk3dBackdrop')) {
        this.hiddenBackdrops.add(obj);
        this.scene.cameras.main.ignore(obj);
        return;
      }
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
    // A scene can promote a battle trainer to a walking 3D character (the rival
    // striding in toward the player) by tagging its intro portrait with
    // `battleTrainer: 'boy' | 'girl'`. Spawn the 3D walker and keep the flat 2D
    // portrait off the render layer while it plays.
    const trainerDesign = (im as Phaser.GameObjects.Image).getData?.('battleTrainer') as ('boy' | 'girl' | undefined);
    if (trainerDesign) { this.spawnTrainer(im, trainerDesign); return; }
    // Northern League master portraits are upright 3D reliefs at the opponent
    // Pokémon's exact arena anchor. Their alpha crossfade hands that same spot
    // cleanly to the Pokémon instead of leaving a sprite in the screen corner.
    const trainerAtEnemy = !!(im as Phaser.GameObjects.Image).getData?.('battleTrainerEnemyAnchor');
    // Battle UI images that aren't combatants (trainer/leader portraits) opt out
    // of the 3D arena so they don't stand on the stage as a stray relief.
    if (!trainerAtEnemy && (im as Phaser.GameObjects.Image).getData?.('no3d')) return;
    const dw = im.displayWidth ?? 0, dh = im.displayHeight ?? 0;
    const W = this.scene.scale.width, H = this.scene.scale.height;

    // Fullscreen art = backdrop → hide (the 3D arena replaces it).
    if (dw >= W * 0.85 && dh >= H * 0.85) {
      this.hiddenBackdrops.add(im);
      this.scene.cameras.main.ignore(im);
      return;
    }
    if (dw < 70 || dh < 70) return;                     // icons stay 2D
    // Explicit opt-out: scenes can tag any object to stay in the 2D layer.
    if ((im as unknown as { getData?: (k: string) => unknown }).getData?.('no3d')) return;

    const src = this.frameCanvas(im);
    // Creatures WITHOUT a generated 3D model render as a near-flat relief — a 2D
    // sprite standing upright on the 3D stage at its arena anchor. Creatures
    // that DO have a model use the relief only until the GLB streams in.
    // If pixels can't be read at all (CORS-tainted source), fall back to a
    // flat textured card so a battler is NEVER invisible.
    const has3D = hasModel(im.texture.key);
    const relief = (src && buildRelief(
      `img:${im.texture.key}:${im.frame?.name ?? 0}${has3D ? '' : ':flat'}`,
      src,
      has3D ? undefined : 1,
    )) ?? buildFlatCard(
      `flat:img:${im.texture.key}:${im.frame?.name ?? 0}`,
      im.texture.getSourceImage() as HTMLImageElement,
    );
    if (!relief) return;

    // Battle layout puts the ENEMY zone in the upper screen area and the
    // player's in the lower-left — classify by both axes so intro portraits
    // (drawn upper-middle at the enemy spot) never land on the player side.
    const side: 'player' | 'enemy' = trainerAtEnemy ? 'enemy'
      : ((im.y ?? 0) < H * 0.32 || (im.x ?? 0) > W * 0.6) ? 'enemy' : 'player';
    const slot = trainerAtEnemy ? 0
      : [...this.combatants.values()].filter(cb => cb.side === side).length % 2;

    const mats = reliefMaterials(relief.texture);
    const inner = new THREE.Mesh(relief.geometry, mats);
    inner.userData.sharedGeo = true;
    // Normalize creature height to a consistent stage presence. The bias from
    // the 2D display size is kept NARROW so a 96px pixel sprite and a 512px
    // HOME render both land near the same world height (fixes giant/small
    // battlers when art resolution varies wildly).
    const sizeBias = Math.min(1.15, Math.max(0.85, dh / 220));
    // The enemy stands ~2× farther from the camera — bigger stage height. A
    // trainer pinned to the enemy anchor is sized to a full battler height
    // (NOT the small portrait-derived size) so it stands in the same spot AND
    // scale as the Pokémon it hands the anchor to — otherwise the little
    // portrait reads as a figure floating high at the far anchor.
    const scale = (trainerAtEnemy ? 1.75 : (side === 'enemy' ? 1.45 : 1.1) * sizeBias) / relief.pxHeight;
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
      baseSX: null, baseSY: null,
      lastSX: Math.abs(im.scaleX ?? 1), scaleStill: 0,
      phase: Math.random() * Math.PI * 2,
      glbKey: !trainerAtEnemy && hasModel(im.texture.key) ? im.texture.key : null,
      glb: null,
      // Generated models read smaller than flat art at equal height (they have
      // real depth), so give them extra presence — SwSh-scale battlers.
      targetH: (side === 'enemy' ? 1.8 : 1.45) * Math.min(1.25, Math.max(0.95, dh / 220)),
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
    const has3D = hasModel(im.texture.key);
    const relief = (src && buildRelief(
      `img:${im.texture.key}:${im.frame?.name ?? 0}${has3D ? '' : ':flat'}`,
      src,
      has3D ? undefined : 1,
    )) ?? buildFlatCard(
      `flat:img:${im.texture.key}:${im.frame?.name ?? 0}`,
      im.texture.getSourceImage() as HTMLImageElement,
    );
    if (!relief) return;
    cb.inner.geometry = relief.geometry;
    cb.mats[0].map = relief.texture;
    cb.mats[0].needsUpdate = true;
    const dh = im.displayHeight ?? 0;
    const sizeBias = Math.min(1.15, Math.max(0.85, dh / 220));
    cb.scalePx = ((cb.side === 'enemy' ? 1.45 : 1.1) * sizeBias) / relief.pxHeight;
    cb.baseSX = null; cb.baseSY = null; cb.scaleStill = 0;   // re-settle on the new art
    cb.targetH = (cb.side === 'enemy' ? 1.8 : 1.45) * Math.min(1.25, Math.max(0.95, dh / 220));
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

  // ── Battle trainer walk-in (rival striding toward the player) ──
  private spawnTrainer(im: GO & Phaser.GameObjects.Image, design: 'boy' | 'girl'): void {
    if (this.trainers.some(w => w.obj === im)) return;
    const portrait = this.frameCanvas(im);
    const portraitModel = portrait
      ? buildPortraitCharacterModel(`${im.texture.key}:${im.frame?.name ?? 0}`, portrait, 1.72)
      : null;
    const model = portraitModel ?? buildPlayerModel(design);
    // The procedural fallback is authored at overworld scale; portrait models
    // are already normalized to battle-trainer height.
    if (!portraitModel) model.group.scale.setScalar(1.7);
    model.group.position.copy(TRAINER_START);
    this.root.add(model.group);
    this.trainers.push({ obj: im, model, group: model.group, t: 0, phase: 0, seen: false });
    // The flat 2D portrait stays off the render layer while the 3D walker plays;
    // its alpha tween still drives the walk-in / retirement.
    this.scene.cameras.main.ignore(im);
  }

  private updateTrainers(dt: number): void {
    for (let i = this.trainers.length - 1; i >= 0; i--) {
      const w = this.trainers[i];
      const o = w.obj;
      const alpha = o.alpha ?? 1;
      const visible = !!(o as GO).scene && o.visible !== false && alpha > 0.05;
      if (visible) w.seen = true;
      // Once it has appeared, the portrait fading out (Pokémon send-out) or the
      // scene tearing it down retires the walker.
      if (w.seen && (!(o as GO).scene || alpha < 0.06)) {
        this.root.remove(w.group);
        this.trainers.splice(i, 1);
        continue;
      }
      if (visible) w.t = Math.min(1, w.t + dt / 1.5);
      const e = 1 - Math.pow(1 - w.t, 3);       // easeOutCubic
      w.group.position.x = THREE.MathUtils.lerp(TRAINER_START.x, TRAINER_END.x, e);
      w.group.position.z = THREE.MathUtils.lerp(TRAINER_START.z, TRAINER_END.z, e);
      const moving = visible && w.t < 1;
      if (moving) w.phase += dt * 9;
      w.model.setWalk(w.phase, moving, dt);     // sets group.position.y (bob)
      w.model.face(TRAINER_END.x - TRAINER_START.x, TRAINER_END.z - TRAINER_START.z, dt);
    }
  }

  // ── Frame sync ──
  update(dt: number): void {
    if (!this.built) return;
    // Objects emitted through addedtoscene are only constructors at that point.
    // Jin's async scene exposed this race: its new Graphics had an empty command
    // buffer here, then the fullscreen 2D backdrop was drawn after we had already
    // rejected it. Classify the completed objects one frame later instead.
    if (this.pendingObjects.size) {
      const ready = [...this.pendingObjects];
      this.pendingObjects.clear();
      for (const obj of ready) {
        if (obj.scene) this.consider(obj);
      }
    }
    this.time += dt;
    this.fx.update(dt);
    this.updateTrainers(dt);
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
      // Scale baseline is captured only when the sprite is SETTLED (still +
      // fully visible), so send-out/switch scale tweens read as relative
      // animation instead of poisoning the battler's size (giant/invisible).
      const curSX = Math.abs(o.scaleX ?? 1);
      if (Math.abs(curSX - cb.lastSX) < 1e-4 && (o.alpha ?? 1) > 0.85 && o.visible !== false) {
        cb.scaleStill += dt;
        if (cb.scaleStill > 0.25 && cb.baseSX === null && curSX > 1e-4) {
          cb.baseSX = curSX;
          cb.baseSY = Math.abs(o.scaleY ?? 1) || curSX;
        }
      } else {
        cb.scaleStill = 0;
      }
      cb.lastSX = curSX;
      const relX = cb.baseSX ? Math.min(3, Math.max(0.2, curSX / cb.baseSX)) : 1;
      const relY = cb.baseSY ? Math.min(3, Math.max(0.2, Math.abs(o.scaleY ?? 1) / cb.baseSY)) : 1;
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
        // Phaser's hit flash is a multiply tint — identical semantics here.
        if (tint.isTinted && tint.tintTopLeft !== undefined) m.color.set(tint.tintTopLeft);
        else m.color.set(0xffffff);
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
    this.active3D = false;
    const cam = this.scene.cameras.main as Phaser.Cameras.Scene2D.Camera & { id: number };
    const unhide = (o: GO) => { (o as unknown as { cameraFilter: number }).cameraFilter &= ~cam.id; };
    for (const cb of this.combatants.values()) unhide(cb.obj);
    for (const b of this.hiddenBackdrops) unhide(b);
  }

  apply3D(): void {
    this.active3D = true;
    for (const cb of this.combatants.values()) this.scene.cameras.main.ignore(cb.obj);
    for (const b of this.hiddenBackdrops) this.scene.cameras.main.ignore(b);
  }
}
