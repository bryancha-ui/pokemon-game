import Phaser from 'phaser';
import { vanishesAfterDefeat } from '../data/Villains';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, drawRiderBody, playerDesign } from '../data/CharacterSprite';
import { hasBike, BIKE_SPEED } from '../data/Bike';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { maybeLaunchEvolution } from '../systems/EvolutionSystem';
import { EncounterEntry, pickEncounter, randomLevel } from '../data/CustomPokemon';

// ── Rangrim Range (낭림산맥) ──────────────────────────────────────────────────────
// The great mountain spine between Sinuiju and Samjiyon — Hanbando's Mt. Coronet: a
// towering rock massif you climb through switchback trails and pitch-dark cave halls,
// past a plunging waterfall, a boulder-choked cavern, and, deep in its heart, an
// ancient altar older than the region itself. Snow thickens toward the Baekdu side.

const T = { GROUND: 0, PATH: 1, ROCK: 2, CAVE: 3, BOULDER: 4, LEDGE: 5, SNOW: 6, TALLGRASS: 7, STREAM: 8 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 24, ROWS = 52;
const COLORS: Record<Tile, number> = {
  [T.GROUND]: 0x6b6455, [T.PATH]: 0xc2b592, [T.ROCK]: 0x4f4940, [T.CAVE]: 0x2c2a34,
  [T.BOULDER]: 0x6f665a, [T.LEDGE]: 0x8a7a58, [T.SNOW]: 0xe8eef2, [T.TALLGRASS]: 0x3f7a35, [T.STREAM]: 0x66b0e0,
};
const SOLID = new Set<Tile>([T.ROCK, T.BOULDER, T.STREAM, T.LEDGE]);   // LEDGE solid except when dropping down
const ENCOUNTER = new Set<Tile>([T.TALLGRASS, T.CAVE]);   // wild Pokémon in the grass AND the dark caves

// Wild rock / fighting / steel / cave & ice (near the snow) dwellers — a late, high route.
const RG_ENCOUNTERS: EncounterEntry[] = [
  { id: 42,  weight: 15, minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 120 }, // Golbat (cave)
  { id: 75,  weight: 12, minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 120 }, // Graveler
  { id: 67,  weight: 12, minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 90  }, // Machoke
  { id: 436, weight: 11, minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 90  }, // Bronzor
  { id: 35,  weight: 10, minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 120 }, // Clefairy (the mountain's moon-folk)
  { id: 308, weight: 9,  minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 90  }, // Medicham
  { id: 476, weight: 8,  minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 90  }, // Probopass
  { id: 461, weight: 9,  minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 90  }, // Weavile (snow side)
  { id: 362, weight: 7,  minLevel: 73, maxLevel: 75, isCustom: false, catchRate: 90  }, // Glalie (snow side)
  { id: 359, weight: 5,  minLevel: 74, maxLevel: 76, isCustom: false, catchRate: 60  }, // Absol (rare omen)
];

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GROUND) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  fill(0, ROWS, 10, 14, T.PATH);        // central switchback trail
  fill(0, ROWS, 0, 3, T.ROCK);          // west massif wall
  fill(0, ROWS, 21, COLS, T.ROCK);      // east massif wall

  // Two great cave halls the trail bores through (dark interior, wild Pokémon).
  fill(33, 41, 3, 21, T.CAVE); fill(33, 41, 10, 14, T.CAVE);
  fill(18, 26, 3, 21, T.CAVE);
  // boulders choking the caverns (leave the central trail open)
  for (const [r, c] of [[35,6],[36,7],[38,16],[39,17],[20,7],[22,16],[23,6],[24,17],[37,5],[21,18]] as [number,number][]) m[r][c] = T.BOULDER;

  // A waterfall plunging off the west cliff into a pool (rows 12-17), with a plank on the trail.
  fill(11, 18, 3, 4, T.STREAM);
  fill(17, 19, 3, 10, T.STREAM);
  fill(17, 19, 10, 14, T.PATH);         // the trail bridges the meltwater stream

  // One-way stone ledges — optional drops on the side, shortcuts you can't climb back up.
  for (const c of [15, 16, 17]) m[29][c] = T.LEDGE;
  for (const c of [6, 7, 8]) m[45][c] = T.LEDGE;

  // Snowfields thickening toward the Baekdu (north) side.
  fill(1, 9, 3, 10, T.SNOW); fill(1, 7, 14, 21, T.SNOW); fill(9, 12, 15, 20, T.SNOW);
  // Jagged rock spires jutting from the slopes.
  for (const [r, c] of [[6,17],[13,6],[28,7],[31,16],[43,17],[48,6],[15,17]] as [number,number][]) m[r][c] = T.ROCK;
  // Tall-grass ledges on the outdoor stretches.
  fill(10, 15, 4, 9, T.TALLGRASS); fill(27, 32, 4, 9, T.TALLGRASS); fill(42, 47, 14, 20, T.TALLGRASS); fill(3, 8, 15, 20, T.TALLGRASS);
  return m;
}

interface Trainer { key: string; name: string; col: number; row: number; color: number; label: string; line: string; pokemon: string; expPool: number; }

export class RangrimMountainScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private px = 11 * TILE + 16;
  private py = 47 * TILE + 16;   // default: enter from the south (Sinuiju side)
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private cycling = false;
  private spawnGuard = false; private spawnPx = 0; private spawnPy = 0;
  private steps = 0; private nextEnc = 10;
  private readonly SPEED = 120; private readonly RUN = 250;

  private readonly TRAINERS: Trainer[] = [
    {
      key: 'rg-daljae', name: 'Hiker Daljae', col: 6, row: 44, color: 0x8a6a3a, label: 'Hiker',
      line: "Forty years I've climbed the Rangrim spine. The mountain keeps its own counsel — and so do my Pokémon!",
      pokemon: JSON.stringify([{ id: 75, level: 73 }, { id: 476, level: 74 }, { id: 76, level: 74 }]), expPool: 2600,
    },
    {
      key: 'rg-museon', name: 'Black Belt Museon', col: 14, row: 36, color: 0x6a3a2a, label: 'Black\nBelt',
      line: "In the dark of these caves you fight by sound and instinct. My fists have never needed the light. Come!",
      pokemon: JSON.stringify([{ id: 67, level: 73 }, { id: 308, level: 74 }, { id: 68, level: 75 }]), expPool: 2700,
    },
    {
      key: 'rg-hakryun', name: 'Ace Trainer Hakryun', col: 8, row: 29, color: 0x3a5a9a, label: 'Ace\nTrainer',
      line: "The higher the ridge, the fiercer the battle. Prove you belong on the roof of the north!",
      pokemon: JSON.stringify([{ id: 437, level: 74 }, { id: 461, level: 74 }, { id: 359, level: 75 }]), expPool: 2800,
    },
    {
      key: 'rg-seolla', name: 'Veteran Seolla', col: 17, row: 12, color: 0x7a3a6a, label: 'Veteran',
      line: "I've wintered on this peak more times than I can count. The cold sharpens a team — mine most of all. Battle me.",
      pokemon: JSON.stringify([{ id: 362, level: 74 }, { id: 36, level: 75 }, { id: 473, level: 75 }]), expPool: 2900,
    },
    {
      key: 'rg-hyeol', name: '노스단 Scout Hyeol', col: 11, row: 5, color: 0x24242e, label: '노스단\nScout',
      line: "So the Inspectorate's dog climbs even the Rangrim. Beyond this snow lies Samjiyon — and 노스단's road to the peak. Turn back!",
      pokemon: JSON.stringify([{ id: 430, level: 74 }, { id: 452, level: 75 }, { id: 461, level: 75 }]), expPool: 2900,
    },
  ];

  constructor() { super('RangrimMountainScene'); }

  create() {
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0; this.steps = 0;
    playBgm(this, 'baekdupass');
    this.input.keyboard?.resetKeys();
    const rx = this.registry.get('rangrimReturnX') as number | undefined;
    const ry = this.registry.get('rangrimReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('rangrimReturnX'); this.registry.remove('rangrimReturnY');

    this.spawnPx = this.px; this.spawnPy = this.py;
    this.spawnGuard = true;
    this.time.delayedCall(500, () => { this.spawnGuard = false; });

    this.map = buildMap();
    this.drawMap();
    this.drawIcons();
    this.drawTrainers();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'RangrimMountainScene');
    this.time.delayedCall(300, () => maybeLaunchEvolution(this));
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c]; const x = c * TILE, y = r * TILE;
      g.fillStyle(COLORS[t], 1); g.fillRect(x, y, TILE, TILE);
      if (t === T.GROUND) { g.fillStyle(0x585444, 0.5); g.fillRect(x + 6, y + 8, 4, 3); g.fillRect(x + 18, y + 20, 5, 3); }
      if (t === T.PATH) { g.fillStyle(0xa89a76, 0.6); g.fillRect(x + 5, y + 10, 5, 3); g.fillRect(x + 18, y + 20, 5, 3); }
      if (t === T.ROCK) { g.fillStyle(0x413c34); g.fillRect(x + 3, y + 4, 10, 10); g.fillRect(x + 16, y + 15, 11, 11); g.fillStyle(0x6a6356, 0.5); g.fillRect(x + 4, y + 5, 4, 3); }
      if (t === T.CAVE) { g.fillStyle(0x000000, 0.35); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x3a3648, 0.5); g.fillRect(x + 7, y + 9, 5, 4); g.fillRect(x + 19, y + 22, 4, 3); }
      if (t === T.BOULDER) { g.fillStyle(0x554d42); g.fillEllipse(x + 16, y + 18, 26, 22); g.fillStyle(0x7a7060, 0.6); g.fillEllipse(x + 12, y + 13, 9, 7); }
      if (t === T.LEDGE) { g.fillStyle(0x6a5c3e); g.fillRect(x, y + 20, TILE, 12); g.fillStyle(0x3a2f1a); g.fillRect(x, y + 30, TILE, 2); g.fillStyle(0xbfae82); g.fillTriangle(x + 12, y + 24, x + 20, y + 24, x + 16, y + 30); }
      if (t === T.SNOW) { g.fillStyle(0xffffff, 0.7); g.fillCircle(x + 9, y + 11, 3); g.fillCircle(x + 21, y + 22, 3); g.fillStyle(0xcdd8e0, 0.5); g.fillRect(x, y + 26, TILE, 6); }
      if (t === T.TALLGRASS) { g.fillStyle(0x2c6a22, 0.8); for (let i = 0; i < 3; i++) { g.fillRect(x + 5 + i * 8, y + 16, 2, 12); g.fillRect(x + 7 + i * 8, y + 12, 2, 16); } }
      if (t === T.STREAM) { g.fillStyle(0xbfe6ff, 0.6); g.fillRect(x + 6, y, 6, TILE); g.fillStyle(0xffffff, 0.4); g.fillRect(x + 14, y, 3, TILE); }
    }
    const key = '__rangrimMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(11.5 * TILE, 51.4 * TILE, '↓ Sinuiju', { fontSize: '10px', color: '#fff', backgroundColor: '#3a5a8a99', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
    this.add.text(11.5 * TILE, 0.7 * TILE, '↑ Samjiyon', { fontSize: '10px', color: '#fff', backgroundColor: '#3a5a8a99', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
    this.add.text(12 * TILE, 22 * TILE, '낭림산맥\n(Rangrim Range)', { fontSize: '9px', color: '#ffe9c0', align: 'center', backgroundColor: '#00000077', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(5);
    this.add.text(4.5 * TILE, 14.5 * TILE, '폭포', { fontSize: '8px', color: '#eaffff', backgroundColor: '#00000066', padding: { x: 2, y: 1 } }).setOrigin(0.5).setDepth(6);
  }

  private drawIcons() {
    // waterfall foam at the base of the cascade
    const wf = this.add.graphics().setDepth(6);
    wf.fillStyle(0xffffff, 0.5); wf.fillEllipse(3.5 * TILE, 18 * TILE, 26, 10);

    // Ancient altar deep in the lower cave hall — the mountain's mystic heart (Spear-Pillar-like).
    const ax = 15.5 * TILE, ay = 37 * TILE;
    const al = this.add.graphics().setDepth(6);
    al.fillStyle(0x1a1626, 0.6); al.fillEllipse(ax, ay + 10, 46, 14);
    al.fillStyle(0x4a4460); al.fillRect(ax - 16, ay - 6, 32, 16);
    al.fillStyle(0x6a6488); al.fillRect(ax - 10, ay - 24, 20, 20);
    al.fillStyle(0x9a8ce0, 0.9); al.fillCircle(ax, ay - 16, 6);
    this.tweens.add({ targets: al, alpha: { from: 1, to: 0.55 }, duration: 1100, yoyo: true, repeat: -1 });
    this.add.text(ax, ay - 34, '고대 제단 (Ancient Altar)', { fontSize: '8px', color: '#cabaff', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(7);

    // Cave darkness over the two great halls.
    const dark = this.add.graphics().setDepth(15);
    dark.fillStyle(0x05060c, 0.5);
    dark.fillRect(3 * TILE, 18 * TILE, 18 * TILE, 8 * TILE);
    dark.fillRect(3 * TILE, 33 * TILE, 18 * TILE, 8 * TILE);
  }

  private drawTrainers() {
    for (const tr of this.TRAINERS) {
      if (this.registry.get(`trainerDefeated_${tr.key}`) && vanishesAfterDefeat(tr.key)) continue;
      const g = this.add.graphics().setDepth(8);
      g.setPosition(tr.col * TILE + 16, tr.row * TILE + 16);
      g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 16, 5);
      g.fillStyle(tr.color); g.fillRect(-7, -8, 14, 11); g.fillRect(-11, -7, 5, 8); g.fillRect(6, -7, 5, 8);
      g.fillStyle(0x1a1a2e); g.fillRect(-6, 3, 5, 9); g.fillRect(1, 3, 5, 9);
      g.fillStyle(0xffcc99); g.fillRect(-6, -22, 12, 12);
      g.fillStyle(0x3a2410); g.fillRect(-6, -22, 12, 5);
      g.fillStyle(0x000000); g.fillRect(-3, -16, 2, 2); g.fillRect(1, -16, 2, 2);
      this.add.text(tr.col * TILE + 16, tr.row * TILE - 14, tr.label, {
        fontSize: '8px', color: '#fff', backgroundColor: '#00000088', padding: { x: 2, y: 1 }, align: 'center',
      }).setOrigin(0.5).setDepth(9);
    }
  }

  // ── Player / camera / input ──────────────────────────────────────────────
  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.drawChar(); }
  private drawChar() {
    (this.cycling ? drawRiderBody : drawTrainerBody)(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry));
    this.playerG.setPosition(this.px, this.py);
  }
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(1.6);
    this.cameras.main.startFollow(this.playerG, true, 0.1, 0.1);
  }
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { up: this.input.keyboard!.addKey('W'), down: this.input.keyboard!.addKey('S'), left: this.input.keyboard!.addKey('A'), right: this.input.keyboard!.addKey('D') };
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C).on('down', () => { if (!this.cutsceneActive && hasBike(this.registry)) { this.cycling = !this.cycling; this.drawChar(); } });
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 440, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, '⛰ 낭림산맥 (Rangrim Range)', {
      fontSize: '14px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, 'WASD: move  SHIFT: run  C: bike  SPACE: talk  M: menu  (ledges drop one way)', {
      fontSize: '10px', color: '#ccc', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

  // ── Update ───────────────────────────────────────────────────────────────
  update(_: number, delta: number) {
    if (this.cutsceneActive) {
      if (this.dialog.isInChoice()) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.dialog.navigateChoice(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.dialog.navigateChoice(1);
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.confirmChoice();
      } else if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
      return;
    }
    const dt = delta / 1000; let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx =  1; this.facing = 3; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy =  1; this.facing = 0; }
    const moving = dx !== 0 || dy !== 0;
    const running = moving && !!this.registry.get('hasRunningShoes') && this.shiftKey.isDown;
    const speed = this.cycling ? BIKE_SPEED : (running ? this.RUN : this.SPEED);
    if (moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = this.px + (dx / len) * speed * dt, ny = this.py + (dy / len) * speed * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      // ledges may be dropped down through, but never climbed back up
      if (!this.collides(this.px, ny) || (dy > 0 && this.ledgeBelow(this.px, ny))) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; this.steps++; this.checkEncounter(); }
    } else this.walkFrame = 0;
    this.drawChar();
    this.checkTrainers();
    this.checkExits();
  }
  private collides(x: number, y: number): boolean {
    const hw = 6;
    return [[x-hw,y-4],[x+hw,y-4],[x-hw,y+8],[x+hw,y+8]].some(([cx, cy]) => {
      const col = Math.floor(cx / TILE), row = Math.floor(cy / TILE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      return SOLID.has(this.map[row][col]);
    });
  }
  private ledgeBelow(x: number, y: number): boolean {
    const col = Math.floor(x / TILE), row = Math.floor((y + 8) / TILE);
    return this.map[row]?.[col] === T.LEDGE;
  }

  private checkEncounter() {
    const col = Math.floor(this.px / TILE), row = Math.floor(this.py / TILE);
    const t = this.map[row]?.[col];
    if (!t || !ENCOUNTER.has(t)) { this.steps = 0; return; }
    if (this.steps < this.nextEnc) return;
    if (Math.random() > 0.22) return;
    this.steps = 0; this.nextEnc = 8 + Math.floor(Math.random() * 8);
    const e = pickEncounter(RG_ENCOUNTERS);
    this.registry.set('wildId', e.id);
    this.registry.set('wildLevel', randomLevel(e));
    this.registry.set('wildCustom', e.isCustom);
    this.registry.set('wildCatchRate', e.catchRate);
    this.registry.set('wildReturnScene', 'RangrimMountainScene');
    this.registry.set('rangrimReturnX', this.px); this.registry.set('rangrimReturnY', this.py);
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('WildBattleScene'));
  }

  private checkTrainers() {
    for (const tr of this.TRAINERS) {
      if (this.registry.get(`trainerDefeated_${tr.key}`)) continue;
      const wx = tr.col * TILE + 16, wy = tr.row * TILE + 16;
      if (Math.hypot(this.px - wx, this.py - wy) < TILE * 1.5) {
        this.cutsceneActive = true;
        this.registry.set('trainerName', tr.name);
        this.registry.set('trainerKey', tr.key);
        this.registry.set('trainerPokemon', tr.pokemon);
        this.registry.set('trainerExpPool', tr.expPool);
        this.registry.set('trainerReturnScene', 'RangrimMountainScene');
        this.registry.set('rangrimReturnX', this.px); this.registry.set('rangrimReturnY', this.py);
        this.dialog.show([tr.line, `${tr.name}: Let's battle!`], () => {
          this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return;
      }
    }
  }

  private checkExits() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (Math.hypot(this.px - this.spawnPx, this.py - this.spawnPy) < 1.4 * TILE) return;
    const nearCentre = this.px > 7 * TILE && this.px < 15 * TILE;
    // South → down out of the range to Sinuiju (arrive at its north road).
    if (this.py > (ROWS - 1) * TILE && nearCentre) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('SinuijuCitySceneReturnX', 13.5 * 32); this.registry.set('SinuijuCitySceneReturnY', 2 * 32 + 16);
        this.scene.start('SinuijuCityScene');
      });
    }
    // North → over the top to Samjiyon (arrive at its south road).
    if (this.py < 1 * TILE && nearCentre) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('SamjiyonCitySceneReturnX', 13.5 * 32); this.registry.set('SamjiyonCitySceneReturnY', 17 * 32 + 16);
        this.scene.start('SamjiyonCityScene');
      });
    }
  }
}
