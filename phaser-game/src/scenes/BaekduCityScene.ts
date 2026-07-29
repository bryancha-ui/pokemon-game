import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, drawRiderBody, playerDesign } from '../data/CharacterSprite';
import { hasBike, BIKE_SPEED } from '../data/Bike';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { maybeLaunchEvolution } from '../systems/EvolutionSystem';
import { PartySystem } from '../systems/PartySystem';

// ── Tiles ───────────────────────────────────────────────────────────────────
const T = { SNOW: 0, PATH: 1, BUILDING: 2, PINE: 3, LANTERN: 4, LAKE: 5, ROCK: 6, STEAM: 7 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 30, ROWS = 26;
const COLORS: Record<Tile, number> = {
  [T.SNOW]: 0xe6edf4, [T.PATH]: 0xc2b9a8, [T.BUILDING]: 0xddd2c0, [T.PINE]: 0x1f4d36,
  [T.LANTERN]: 0x9a7a4a, [T.LAKE]: 0x2f6fbf, [T.ROCK]: 0x6f6558, [T.STEAM]: 0xdfe8ee,
};
const SOLID = new Set<Tile>([T.BUILDING, T.PINE, T.LANTERN, T.LAKE, T.ROCK]);

interface Building { label: string; scene: string; x: number; y: number; w: number; h: number; doorCol: number; doorRow: number; roof: number; }
const BUILDINGS: Building[] = [
  { label: 'Center & Rescue Station', scene: 'BaekduPCScene', x: 3, y: 7, w: 6, h: 5, doorCol: 5, doorRow: 11, roof: 0xcc2244 },
  { label: 'Summit Dojo (정상 도장)',  scene: 'BaekduGymScene', x: 21, y: 6, w: 6, h: 6, doorCol: 23, doorRow: 11, roof: 0x4a3a8a },
  { label: 'Mountain Gear Shop',      scene: '__SHOP__',      x: 12, y: 18, w: 5, h: 4, doorCol: 14, doorRow: 21, roof: 0x2a6a9a },
];

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.SNOW) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) if (r>=0&&r<ROWS&&c>=0&&c<COLS) m[r][c] = t;
  };
  // Main paths
  fill(0, ROWS, 13, 17, T.PATH);
  fill(11, 15, 2, COLS - 2, T.PATH);
  // Buildings
  for (const b of BUILDINGS) {
    fill(b.y, b.y + b.h, b.x, b.x + b.w, T.BUILDING);
    m[b.doorRow][b.doorCol] = T.PATH;
  }
  // Cheonji — the volcanic crater lake (top-right open water, ringed by rock)
  fill(1, 6, 9, 21, T.LAKE);
  for (let c = 8; c <= 21; c++) { if (m[6]?.[c] === T.SNOW) m[6][c] = T.ROCK; }
  m[1][8] = T.ROCK; m[1][21] = T.ROCK;
  // Hot-spring steam patch (inn area, lower-left)
  fill(18, 22, 4, 9, T.STEAM);
  // Snowy pines + stone lanterns
  for (const [r,c] of [[8,11],[8,18],[16,5],[16,24],[22,11],[22,18],[7,2]] as [number,number][]) m[r][c] = T.PINE;
  m[10][11] = T.LANTERN; m[10][18] = T.LANTERN;
  return m;
}

export class BaekduCityScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private enterPrompt!: Phaser.GameObjects.Text;

  private px = 15 * TILE; private py = 24 * TILE;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private cycling = false;
  private spawnGuard = false;
  private spawnPx = 0; private spawnPy = 0;   // exits lock until the player moves inward
  private readonly SPEED = 120; private readonly RUN = 250;

  // Loitering Team Suri operative (flavor, won't attack)
  private suriCol = 19; private suriRow = 16;

  constructor() { super('BaekduCityScene'); }

  create() {

    playBgm(this, 'baekdu');
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    this.input.keyboard?.resetKeys();
    const rx = this.registry.get('baekduCityReturnX') as number | undefined;
    const ry = this.registry.get('baekduCityReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('baekduCityReturnX'); this.registry.remove('baekduCityReturnY');

    // Lock edge exits until the player steps inward (prevents entry bounce).
    this.spawnPx = this.px; this.spawnPy = this.py;
    this.spawnGuard = true;
    this.time.delayedCall(500, () => { this.spawnGuard = false; });

    this.map = buildMap();
    this.drawMap();
    this.drawSuriOperative();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'BaekduCityScene');

    if (!this.registry.get('baekduCityVisited')) {
      this.registry.set('baekduCityVisited', true);
      this.time.delayedCall(700, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'You reach Baekdu City (백두 시티).',
          'A rugged highland city built around a brilliant blue crater lake — Cheonji, the Heaven Lake.',
          'Mountaineers in heavy coats trade gear and soak in hot springs.',
          'But here and there, figures in black coats with red thread linger... watching.',
        ], () => { this.cutsceneActive = false; });
      });
    } else {
      this.time.delayedCall(300, () => maybeLaunchEvolution(this));
    }
  }

  // ── Map ──────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (t === T.PINE) { g.fillStyle(0x163d28); g.fillTriangle(c*TILE+16, r*TILE+2, c*TILE+3, r*TILE+24, c*TILE+29, r*TILE+24); g.fillStyle(0xffffff,0.85); g.fillTriangle(c*TILE+16, r*TILE+2, c*TILE+10, r*TILE+12, c*TILE+22, r*TILE+12); g.fillStyle(0x4a3020); g.fillRect(c*TILE+13, r*TILE+24, 6, 6); }
      if (t === T.LANTERN) { g.fillStyle(0x777066); g.fillRect(c*TILE+12, r*TILE+6, 8, 20); g.fillStyle(0xffdd88); g.fillRect(c*TILE+11, r*TILE+4, 10, 8); }
      if (t === T.LAKE) { g.fillStyle(0x66aadd, 0.5); g.fillRect(c*TILE+4, r*TILE+8, 12, 3); g.fillRect(c*TILE+14, r*TILE+18, 10, 3); }
      if (t === T.ROCK) { g.fillStyle(0x5a5044); g.fillTriangle(c*TILE+16, r*TILE+6, c*TILE+4, r*TILE+28, c*TILE+28, r*TILE+28); }
      if (t === T.STEAM) { g.fillStyle(0xffffff, 0.35); g.fillCircle(c*TILE+10, r*TILE+12, 7); g.fillCircle(c*TILE+22, r*TILE+20, 6); }
    }
    const key = '__baekduCityMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    // Buildings
    const bg = this.add.graphics().setDepth(2);
    for (const b of BUILDINGS) {
      const x = b.x * TILE, y = b.y * TILE, w = b.w * TILE, h = b.h * TILE;
      bg.fillStyle(0xefe4d0); bg.fillRect(x, y, w, h); bg.lineStyle(2, 0x333); bg.strokeRect(x, y, w, h);
      bg.fillStyle(b.roof); bg.fillTriangle(x - 4, y, x + w / 2, y - TILE, x + w + 4, y);
      bg.fillStyle(0x88ccff, 0.7);
      for (let wx = 8; wx < w - 8; wx += 22) bg.fillRect(x + wx, y + 14, 14, 16);
      const dx = b.doorCol * TILE, dy = (b.y + b.h - 1) * TILE;
      bg.fillStyle(0x8b4513); bg.fillRect(dx + 4, dy, TILE - 8, TILE);
      this.add.text((b.x + b.w / 2) * TILE, (b.y - 1.2) * TILE, b.label, {
        fontSize: '9px', color: '#fff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 1).setDepth(3);
    }
    this.add.text(15 * TILE, 4 * TILE, tr('🌊 Cheonji — Heaven Lake'), {
      fontSize: '10px', color: '#fff', backgroundColor: '#1a4a8acc', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(6 * TILE, 20 * TILE, tr('♨ Hot Spring Inn'), {
      fontSize: '9px', color: '#fff', backgroundColor: '#aa5522cc', padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(15 * TILE, 25.4 * TILE, '↓ Highland Pass', {
      fontSize: '9px', color: '#444', backgroundColor: '#ffffffaa', padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text((COLS - 0.6) * TILE, 12.5 * TILE, 'Diamond Gorge →', {
      fontSize: '9px', color: '#fff', backgroundColor: '#2a6a8a99', padding: { x: 3, y: 2 },
    }).setOrigin(1, 0.5).setDepth(5);
  }

  private drawSuriOperative() {
    const g = this.add.graphics().setDepth(8);
    g.setPosition(this.suriCol * TILE + 16, this.suriRow * TILE + 16);
    g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 16, 5);
    g.fillStyle(0x161616); g.fillRect(-7, -8, 14, 12);
    g.fillStyle(0xcc2233); g.fillRect(-7, -8, 14, 2);
    g.fillStyle(0xffcc99); g.fillRect(-6, -20, 12, 11);
    g.fillStyle(0x101010); g.fillRect(-6, -21, 12, 5);
    g.fillStyle(0xcc2233); g.fillRect(-3, -15, 2, 2); g.fillRect(1, -15, 2, 2);
    this.add.text(this.suriCol * TILE + 16, this.suriRow * TILE - 10, 'Team Suri', {
      fontSize: '8px', color: '#ff6677', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(9);
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
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 340, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, '🏙️ Baekdu City (백두 시티)', {
      fontSize: '14px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.enterPrompt = this.add.text(this.scale.width / 2, this.scale.height - 34, '', {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false);
    this.add.text(this.scale.width / 2, this.scale.height - 8, tr('WASD: move  SPACE: enter/talk  M: menu'), {
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
      if (!this.collides(this.px, ny)) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else this.walkFrame = 0;
    this.drawChar();
    this.checkSuriOperative();
    this.checkBuildings();
    this.checkExit();
  }
  private collides(x: number, y: number): boolean {
    const hw = 6;
    return [[x-hw,y-4],[x+hw,y-4],[x-hw,y+8],[x+hw,y+8]].some(([cx, cy]) => {
      const col = Math.floor(cx / TILE), row = Math.floor(cy / TILE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      return SOLID.has(this.map[row][col]);
    });
  }

  private checkSuriOperative() {
    const wx = this.suriCol * TILE + 16, wy = this.suriRow * TILE + 16;
    if (Math.hypot(this.px - wx, this.py - wy) < TILE * 1.6 && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.cutsceneActive = true;
      const beaten = !!this.registry.get('baekduGymDefeated');
      this.dialog.show(beaten ? [
        "Team Suri Operative: ...So you took the Summit Seal too. The Director is watching you now.",
        "Team Suri Operative: Whatever's stirring under Cheonji — stay out of it. That's a warning, not a threat.",
      ] : [
        "Team Suri Operative: Move along, challenger. Nothing here concerns you.",
        "Team Suri Operative: ...The lake? Don't mind the lake. The lake minds itself.",
      ], () => { this.cutsceneActive = false; });
    }
  }

  private checkBuildings() {
    let near: Building | null = null;
    for (const b of BUILDINGS) {
      const dx = this.px - (b.doorCol * TILE + TILE / 2), dy = this.py - ((b.y + b.h - 1) * TILE + TILE / 2);
      if (Math.hypot(dx, dy) < TILE * 1.3) { near = b; break; }
    }
    if (near) {
      this.enterPrompt.setText(`SPACE — Enter ${near.label}`).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        const b = near;
        if (b.scene === '__SHOP__') {
          this.scene.launch('ShopScene', { parentKey: this.scene.key });
          this.scene.pause();
          return;
        }
        this.registry.set('baekduCityReturnX', b.doorCol * TILE + TILE / 2);
        this.registry.set('baekduCityReturnY', (b.y + b.h) * TILE + TILE / 2);
        this.cutsceneActive = true;
        this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start(b.scene));
      }
    } else this.enterPrompt.setVisible(false);
  }

  private checkExit() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (Math.hypot(this.px - this.spawnPx, this.py - this.spawnPy) < 1.4 * TILE) return;
    // South → Highland Pass
    if (this.py > (ROWS - 1) * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('baekduPassReturnX', 12 * 32 + 16);
        this.registry.set('baekduPassReturnY', 2 * 32);
        this.scene.start('BaekduPassScene');
      });
      return;
    }
    // East → Route 3 (Diamond Gorge → Geumgang City), once the Summit Seal is earned
    if (this.px > (COLS - 1) * TILE) {
      if (!this.registry.get('baekduGymDefeated')) {
        this.px = (COLS - 1.2) * TILE;
        if (!this.cutsceneActive) {
          this.cutsceneActive = true;
          this.dialog.show([
            'A ranger blocks the eastern trail to Diamond Gorge.',
            "Ranger: The gorge road's only open to challengers who've earned the Summit Seal. Beat our gym first!",
          ], () => { this.cutsceneActive = false; });
        }
        return;
      }
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('route3ReturnX', 12 * 32 + 16);
        this.registry.set('route3ReturnY', 57 * 32 + 16);
        this.scene.start('Route3Scene');
      });
    }
  }

  // expose for PC heal scene
  static healParty(scene: Phaser.Scene) { PartySystem.healAll(scene.registry); }
}
