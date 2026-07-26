import Phaser from 'phaser';
import { playBgm } from '../systems/Music';
import { vanishesAfterDefeat } from '../data/Villains';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { maybeLaunchEvolution } from '../systems/EvolutionSystem';
import { EncounterEntry, pickEncounter, randomLevel } from '../data/CustomPokemon';

// ── Dolmoe Mine ──────────────────────────────────────────────────────────────
// The quarry tunnels bore up through the mountain from Dolmoe City toward the
// snowline. A mine-cart ride skips a shaft, a collapsed tunnel forces a detour,
// and rock/ground/steel Pokémon (with the first ice near the top) roam the dark.

const T = { FLOOR: 0, WALL: 1, ORE: 2, RUBBLE: 3, RAIL: 4, CART: 5 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 20, ROWS = 44;
const COLORS: Record<Tile, number> = {
  [T.FLOOR]: 0x4a4038, [T.WALL]: 0x2a2420, [T.ORE]: 0x5a5262, [T.RUBBLE]: 0x3a322a, [T.RAIL]: 0x5a4a38, [T.CART]: 0x6a5a44,
};
const SOLID = new Set<Tile>([T.WALL, T.ORE, T.RUBBLE]);
const ENCOUNTER = new Set<Tile>([T.FLOOR]);

const MINE_ENCOUNTERS: EncounterEntry[] = [
  { id: 'crystbeetle',  weight: 16, minLevel: 43, maxLevel: 46, isCustom: true,  catchRate: 180 }, // Bug/Rock
  { id: 'groundzoome',  weight: 14, minLevel: 43, maxLevel: 46, isCustom: true,  catchRate: 190 }, // Ground/Ghost
  { id: 'nosepassx',    weight: 12, minLevel: 43, maxLevel: 45, isCustom: true,  catchRate: 190 }, // Rock/Psychic
  { id: 95,  weight: 12, minLevel: 43, maxLevel: 46, isCustom: false, catchRate: 200 }, // Onix
  { id: 74,  weight: 12, minLevel: 43, maxLevel: 45, isCustom: false, catchRate: 220 }, // Geodude
  { id: 305, weight: 10, minLevel: 44, maxLevel: 46, isCustom: false, catchRate: 150 }, // Lairon (Steel/Rock)
  { id: 'babymammoth', weight: 8, minLevel: 45, maxLevel: 46, isCustom: true, catchRate: 200 }, // Ice — near the snowline top
];

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.WALL) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  // Carve the main galleries (floor) — an open mine with rock pillars.
  fill(1, ROWS - 1, 2, COLS - 2, T.FLOOR);
  // Rock pillars / ore veins
  for (const [r, c] of [[6,5],[6,13],[12,8],[12,11],[28,5],[28,14],[36,7],[36,12]] as [number,number][]) m[r][c] = T.ORE;
  for (const [r, c] of [[9,4],[16,15],[25,4],[33,15],[40,5],[8,15]] as [number,number][]) m[r][c] = T.ORE;

  // ── Collapsed tunnel (row 20-21): rubble seals the centre; detour west (cols 2-4). ──
  fill(20, 22, 5, COLS - 2, T.RUBBLE);
  fill(20, 22, 2, 5, T.FLOOR);   // the open west detour
  fill(16, 22, 2, 4, T.FLOOR);   // a short west gallery leading into the detour

  // ── Mine-cart rail (a shaft ride): rails climb from row 34 up to row 24. ──
  for (let r = 24; r <= 34; r++) m[r][10] = T.RAIL;
  m[34][10] = T.CART;   // board here (south end of the rail)

  // Entrance (south) & exit (north) corridors — carved through to the very edges
  // so the north/south exit triggers are actually reachable (the border is wall).
  fill(ROWS - 4, ROWS, 9, 11, T.FLOOR);
  fill(0, 4, 9, 11, T.FLOOR);
  return m;
}

interface MineTrainer {
  key: string; name: string; label: string; col: number; row: number; color: number;
  line: string; pokemon: string; expPool: number;
}

export class DolmoeMineScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private px = 10 * TILE + 16;
  private py = (ROWS - 2) * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false;
  private spawnPx = 0; private spawnPy = 0;
  private steps = 0; private nextEnc = 10;
  private readonly SPEED = 120; private readonly RUN = 250;

  private readonly TRAINERS: MineTrainer[] = [
    { key: 'mine-gapdol', name: 'Miner Gapdol', label: 'Miner', col: 4, row: 32, color: 0x8a6a3a,
      line: "Forty years down these shafts. My Pokémon know every seam of rock. You?",
      pokemon: JSON.stringify([{ id: 0, level: 44, custom: 'crystbeetle' }, { id: 95, level: 45 }]), expPool: 1100 },
    { key: 'mine-sunny', name: 'Prospector Sunny', label: 'Pro-\nspector', col: 15, row: 27, color: 0x9a9aa8,
      line: "Steel in the vein, steel in my team. Try to dent it.",
      pokemon: JSON.stringify([{ id: 305, level: 44 }, { id: 82, level: 46 }]), expPool: 1160 },
    { key: 'mine-baru', name: 'Digger Baru', label: 'Digger', col: 3, row: 12, color: 0x7a5a3a,
      line: "You came up through the cave-in? Then you're tougher than the last three. Let's see.",
      pokemon: JSON.stringify([{ id: 0, level: 45, custom: 'groundzoome' }, { id: 51, level: 46 }]), expPool: 1200 },
  ];

  constructor() { super('DolmoeMineScene'); }

  create() {
    playBgm(this, 'dolmoemine');   // dolmoemine theme
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0; this.steps = 0;
    this.input.keyboard?.resetKeys();
    this.px = 10 * TILE + 16; this.py = (ROWS - 4) * TILE + 16;
    const rx = this.registry.get('dolmoeMineReturnX') as number | undefined;
    const ry = this.registry.get('dolmoeMineReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('dolmoeMineReturnX'); this.registry.remove('dolmoeMineReturnY');

    this.spawnPx = this.px; this.spawnPy = this.py;
    this.spawnGuard = true;
    this.time.delayedCall(500, () => { this.spawnGuard = false; });

    this.map = buildMap();
    this.drawMap();
    this.drawTrainers();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'DolmoeMineScene');

    if (!this.registry.get('dolmoeMineSeen')) {
      this.registry.set('dolmoeMineSeen', true);
      this.time.delayedCall(500, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'You step into the Dolmoe Mine — cold air, dripping stone, the clink of picks far below.',
          'A cave-in has sealed the main shaft ahead; the miners say the old cart rail still runs. Ride it up, then detour past the rubble to reach the snow.',
        ], () => { this.cutsceneActive = false; });
      });
    } else {
      this.time.delayedCall(300, () => maybeLaunchEvolution(this));
    }
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (t === T.WALL)   { g.fillStyle(0x1e1a16); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4); }
      if (t === T.ORE)    { g.fillStyle(0x8ad0ff, 0.7); g.fillRect(c*TILE+8, r*TILE+8, 6, 6); g.fillRect(c*TILE+18, r*TILE+16, 5, 5); }
      if (t === T.RUBBLE) { g.fillStyle(0x2a241c); g.fillTriangle(c*TILE+16, r*TILE+4, c*TILE+4, r*TILE+28, c*TILE+28, r*TILE+28); }
      if (t === T.RAIL)   { g.fillStyle(0x3a2e22); g.fillRect(c*TILE+8, r*TILE, 3, TILE); g.fillRect(c*TILE+21, r*TILE, 3, TILE); for (let i=0;i<3;i++) g.fillRect(c*TILE+6, r*TILE+4+i*10, 20, 3); }
      if (t === T.CART)   { g.fillStyle(0x8a6a3a); g.fillRect(c*TILE+5, r*TILE+8, 22, 16); g.fillStyle(0x3a2a18); g.fillRect(c*TILE+7, r*TILE+22, 6, 6); g.fillRect(c*TILE+19, r*TILE+22, 6, 6); }
    }
    const key = '__dolmoeMineMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(10 * TILE, (ROWS - 1.4) * TILE, '↓ Dolmoe City', {
      fontSize: '10px', color: '#fff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(10 * TILE, 0.6 * TILE, '↑ Seorae Pass', {
      fontSize: '10px', color: '#cfefff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(10 * TILE, 34.9 * TILE, '⛏ SPACE: ride the cart', {
      fontSize: '8px', color: '#ffe9a0', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(5);
  }

  private drawTrainers() {
    for (const tr of this.TRAINERS) {
      if (this.registry.get(`trainerDefeated_${tr.key}`) && vanishesAfterDefeat(tr.key)) continue;
      const g = this.add.graphics().setDepth(8);
      g.setPosition(tr.col * TILE + 16, tr.row * TILE + 16);
      g.fillStyle(0x000000, 0.25); g.fillEllipse(0, 13, 16, 5);
      g.fillStyle(tr.color); g.fillRect(-7, -8, 14, 11); g.fillRect(-11, -7, 5, 8); g.fillRect(6, -7, 5, 8);
      g.fillStyle(0x2a2a2a); g.fillRect(-6, 3, 5, 9); g.fillRect(1, 3, 5, 9);
      g.fillStyle(0xffcc99); g.fillRect(-6, -22, 12, 12);
      g.fillStyle(0xffe066); g.fillRect(-5, -23, 10, 4);   // miner's headlamp band
      g.fillStyle(0x000000); g.fillRect(-3, -16, 2, 2); g.fillRect(1, -16, 2, 2);
      this.add.text(tr.col * TILE + 16, tr.row * TILE - 12, tr.label, {
        fontSize: '8px', color: '#fff', backgroundColor: '#00000088', padding: { x: 2, y: 1 }, align: 'center',
      }).setOrigin(0.5).setDepth(9).setName(`${tr.key}__label`);
    }
  }

  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.drawChar(); }
  private drawChar() { drawTrainerBody(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry)); this.playerG.setPosition(this.px, this.py); }
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
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 360, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, '⛏ Dolmoe Mine (돌뫼 광산)', {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, 'WASD: move  SHIFT: run  SPACE: talk/ride  M: menu', {
      fontSize: '10px', color: '#ccc', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

  // ── Update ───────────────────────────────────────────────────────────────
  update(_: number, delta: number) {
    if (this.cutsceneActive) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
      return;
    }
    const dt = delta / 1000; let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx =  1; this.facing = 3; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy =  1; this.facing = 0; }
    const moving = dx !== 0 || dy !== 0;
    const running = moving && !!this.registry.get('hasRunningShoes') && this.shiftKey.isDown;
    const speed = running ? this.RUN : this.SPEED;
    if (moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = this.px + (dx / len) * speed * dt, ny = this.py + (dy / len) * speed * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      if (!this.collides(this.px, ny)) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; this.steps++; this.checkEncounter(); }
    } else this.walkFrame = 0;
    this.drawChar();
    this.checkTrainers();
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.checkCart();
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

  // ── Mine-cart ride ─────────────────────────────────────────────────────────
  private checkCart() {
    const col = Math.floor(this.px / TILE), row = Math.floor(this.py / TILE);
    if (this.map[row]?.[col] !== T.CART && !(Math.abs(row - 34) <= 1 && col === 10)) return;
    this.cutsceneActive = true;
    // Snap onto the cart, then rattle up the rail to the top (row 24).
    this.px = 10 * TILE + 16; this.py = 34 * TILE + 16; this.drawChar();
    this.cameras.main.shake(2400, 0.004);
    this.tweens.add({
      targets: this,
      py: 24 * TILE + 16,
      duration: 2400, ease: 'Sine.inOut',
      onUpdate: () => this.drawChar(),
      onComplete: () => {
        this.dialog.show(['The cart clatters to a stop at the upper gallery. The cave-in is just ahead — detour west around it.'],
          () => { this.cutsceneActive = false; });
      },
    });
  }

  private checkTrainers() {
    for (const tr of this.TRAINERS) {
      if (this.registry.get(`trainerDefeated_${tr.key}`)) continue;
      const wx = tr.col * TILE + 16, wy = tr.row * TILE + 16;
      const dx = Math.abs(this.px - wx), dy = Math.abs(this.py - wy);
      const spotted = Math.hypot(dx, dy) < TILE * 1.5
        || (dy < TILE * 0.7 && dx < TILE * 6) || (dx < TILE * 0.7 && dy < TILE * 6);
      if (spotted) {
        this.cutsceneActive = true;
        this.registry.set('trainerName', tr.name);
        this.registry.set('trainerKey', tr.key);
        this.registry.set('trainerPokemon', tr.pokemon);
        this.registry.set('trainerExpPool', tr.expPool);
        this.registry.set('trainerReturnScene', 'DolmoeMineScene');
        this.registry.set('dolmoeMineReturnX', this.px); this.registry.set('dolmoeMineReturnY', this.py);
        this.dialog.show([tr.line, `${tr.name}: Into the dark, then!`], () => {
          this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return;
      }
    }
  }

  private checkEncounter() {
    const col = Math.floor(this.px / TILE), row = Math.floor(this.py / TILE);
    const t = this.map[row]?.[col];
    if (!t || !ENCOUNTER.has(t)) { this.steps = 0; return; }
    if (this.steps < this.nextEnc) return;
    if (Math.random() > 0.16) return;
    this.steps = 0; this.nextEnc = 9 + Math.floor(Math.random() * 8);
    const e = pickEncounter(MINE_ENCOUNTERS);
    this.registry.set('wildId', e.id);
    this.registry.set('wildLevel', randomLevel(e));
    this.registry.set('wildCustom', e.isCustom);
    this.registry.set('wildCatchRate', e.catchRate);
    this.registry.set('wildReturnScene', 'DolmoeMineScene');
    this.registry.set('dolmoeMineReturnX', this.px); this.registry.set('dolmoeMineReturnY', this.py);
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('WildBattleScene'));
  }

  private checkExits() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (Math.hypot(this.px - this.spawnPx, this.py - this.spawnPy) < 1.4 * TILE) return;
    if (this.py > (ROWS - 1) * TILE) {   // south → Dolmoe City
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('dolmoeReturnX', 11 * 32 + 16); this.registry.set('dolmoeReturnY', 3 * 32);
        this.scene.start('DolmoeCityScene');
      });
    } else if (this.py < 1 * TILE) {   // north → Seorae Pass
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('seoraePassReturnX', 10 * 32 + 16); this.registry.set('seoraePassReturnY', 52 * 32);
        this.scene.start('SeoraePassScene');
      });
    }
  }
}
