import Phaser from 'phaser';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';

// ── POST-GAME I — Pyeongseong, the Northern Capital ──────────────────────────────
// A stern, conservative, GRAND capital: wide ceremonial avenues, colossal grey-granite
// towers, a great obelisk and a bronze statue, formal banners on the building faces.
// An old and proud city that prizes order and decorum — uniformed City Wardens keep a
// formal, dignified watch over the plaza. The Grand Avenue leads north to the League.

const T = { GROUND: 0, PAVE: 1, WALL: 2, MONU: 3, BANNER: 4 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 24, ROWS = 30;

const COLORS: Record<Tile, number> = {
  [T.GROUND]: 0x33353c, [T.PAVE]: 0x3d4048, [T.WALL]: 0x1a1c22, [T.MONU]: 0x2a2c34, [T.BANNER]: 0x1e2a44,
};
const SOLID = new Set<Tile>([T.WALL, T.MONU, T.BANNER]);

const GATE = { col: 11, row: 1 };   // road out to the Northern League (two tiles wide 11-12)

// City Wardens standing formal watch across the plaza.
const AGENTS = [
  { col: 6,  row: 20 }, { col: 17, row: 20 }, { col: 5, row: 12 }, { col: 18, row: 12 }, { col: 11, row: 15 },
];

export class PyeongyangCityScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private enterPrompt!: Phaser.GameObjects.Text;
  private agentGs: { g: Phaser.GameObjects.Graphics; x: number; y: number }[] = [];
  private px = 11.5 * TILE;
  private py = 27 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false;
  private readonly SPEED = 130;

  constructor() { super('PyeongyangCityScene'); }

  create() {

    playBgm(this, 'cheongun');
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    this.agentGs = [];
    this.input.keyboard?.resetKeys();
    this.spawnGuard = true;
    this.time.delayedCall(700, () => { this.spawnGuard = false; });

    this.px = 11.5 * TILE; this.py = 27 * TILE + 16;
    const rx = this.registry.get('pyeongyangReturnX') as number | undefined;
    const ry = this.registry.get('pyeongyangReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('pyeongyangReturnX'); this.registry.remove('pyeongyangReturnY');

    this.map = buildMap();
    this.drawMap();
    this.drawMonuments();
    this.drawAgents();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'PyeongyangCityScene');

    if (!this.registry.get('pyeongyangSeen')) {
      this.registry.set('pyeongyangSeen', true);
      this.time.delayedCall(600, () => this.playArrival());
    }
  }

  private playArrival() {
    this.cutsceneActive = true;
    this.dialog.show([
      'You enter Pyeongseong, the northern capital — a vast, disciplined city of grey-granite towers and broad ceremonial avenues under a cold, clear sky. A great bronze figure presides over the central plaza.',
      'Uniformed City Wardens stand at their posts, still and formal, and incline their heads as you pass.',
      'City Warden Cheol: Southern Champion. You are expected. This is an old and proud capital — here, everything keeps its order, and guests keep their decorum.',
      'Warden Cheol: The Northern League stands at the far end of the Grand Avenue, to the north. Carry yourself with dignity, and the city will show you its respect in kind.',
      '(The Wardens return to their posts at the edges of the plaza — watchful, but courteous.)',
    ], () => { this.cutsceneActive = false; });
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (t === T.PAVE)   { g.fillStyle(0x44474f, 0.5); g.fillRect(c*TILE+1, r*TILE+1, TILE-2, TILE-2); }
      if (t === T.GROUND) { g.fillStyle(0x2b2d34, 0.5); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4); }
      if (t === T.WALL)   { g.fillStyle(0x24262e); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4); g.fillStyle(0x0e0f14); g.fillRect(c*TILE+6, r*TILE+5, 5, 7); g.fillRect(c*TILE+21, r*TILE+18, 5, 7); }
      if (t === T.BANNER) { g.fillStyle(0x24304a); g.fillRect(c*TILE+8, r*TILE, TILE-16, TILE); g.fillStyle(0xb8a24a); g.fillRect(c*TILE+8, r*TILE, TILE-16, 3); g.fillRect(c*TILE+14, r*TILE, 4, TILE); }  // navy banner with a gold vertical band
    }
    const key = '__pyeongyangMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(11.5 * TILE, 0.5 * TILE, '↑ Grand Avenue → Northern League', {
      fontSize: '9px', color: '#ffe88a', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(5);
  }

  /** The great stone obelisk, the bronze statue, and city labels. */
  private drawMonuments() {
    // Central obelisk — a tall grey-granite monument crowned with a gold finial.
    const sx = 7 * TILE + 16, sBase = 12 * TILE;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x50535c); g.fillTriangle(sx - 14, sBase, sx + 14, sBase, sx, sBase - 150);
    g.fillStyle(0x3c3f47); g.fillRect(sx - 16, sBase, 32, 14);
    g.fillStyle(0xd8b44a); g.fillTriangle(sx - 6, sBase - 150, sx + 6, sBase - 150, sx, sBase - 172);   // gold finial
    this.add.text(sx, sBase + 22, 'The Grand Obelisk', { fontSize: '8px', color: '#fff', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);

    // Bronze statue on the central plaza.
    const tx = 16 * TILE + 16, tBase = 13 * TILE;
    const s = this.add.graphics().setDepth(3);
    s.fillStyle(0x3a3d45); s.fillRect(tx - 18, tBase, 36, 18);              // plinth
    s.fillStyle(0x9a7b3a);                                                   // bronze figure
    s.fillRect(tx - 8, tBase - 40, 16, 42); s.fillRect(tx - 20, tBase - 30, 12, 6); s.fillRect(tx + 8, tBase - 34, 14, 6);
    s.fillCircle(tx, tBase - 46, 8);
    this.add.text(tx, tBase + 26, 'The Great Statue', { fontSize: '8px', color: '#fff', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);

    this.add.text(11.5 * TILE, 5.4 * TILE, '평성 · PYEONGSEONG', {
      fontSize: '12px', color: '#ffe88a', backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(5);
  }

  // ── City Wardens ────────────────────────────────────────────────────────────
  private drawAgents() {
    for (const a of AGENTS) {
      const g = this.add.graphics().setDepth(8);
      this.agentGs.push({ g, x: a.col * TILE + 16, y: a.row * TILE + 16 });
    }
    this.updateAgents();
  }

  private updateAgents() {
    for (const a of this.agentGs) {
      const g = a.g; g.clear();
      g.setPosition(a.x, a.y);
      g.fillStyle(0x000000, 0.25); g.fillEllipse(0, 12, 15, 5);
      g.fillStyle(0x24304a); g.fillRect(-7, -8, 14, 13);           // formal navy warden coat
      g.fillStyle(0xb8a24a); g.fillRect(-7, -8, 14, 2);            // gold shoulder trim
      g.fillStyle(0xb8a24a); g.fillRect(-1, -8, 2, 13);            // gold sash
      g.fillStyle(0xffcc99); g.fillRect(-6, -20, 12, 11);          // face
      g.fillStyle(0x1a1a22); g.fillRect(-7, -22, 14, 6);           // peaked ceremonial cap
      g.fillStyle(0xb8a24a); g.fillRect(-7, -17, 14, 1);           // cap band
      g.fillStyle(0x000000); g.fillRect(-4, -15, 2, 2); g.fillRect(2, -15, 2, 2);   // eyes
    }
  }

  // ── Player / camera / input ──────────────────────────────────────────────
  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.drawChar(); }
  private drawChar() {
    drawTrainerBody(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry));
    this.playerG.setPosition(this.px, this.py);
  }
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.startFollow(this.playerG, true, 0.1, 0.1);
  }
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { up: this.input.keyboard!.addKey('W'), down: this.input.keyboard!.addKey('S'), left: this.input.keyboard!.addKey('A'), right: this.input.keyboard!.addKey('D') };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
    // DEV: preview the 어사대 circuit template (Kaesong). Temporary until the circuit is wired.
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.K).on('down', () => {
      if (this.cutsceneActive) return;
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('KaesongCityScene'));
    });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 460, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, '🏙 Pyeongseong — the Northern Capital', {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.enterPrompt = this.add.text(this.scale.width / 2, this.scale.height - 40, '', {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    this.add.text(this.scale.width / 2, this.scale.height - 8, 'WASD: move  SPACE: interact  M: menu', {
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
    if (moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = this.px + (dx / len) * this.SPEED * dt, ny = this.py + (dy / len) * this.SPEED * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      if (!this.collides(this.px, ny)) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > 170) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else this.walkFrame = 0;
    this.drawChar();
    this.updateAgents();       // watchers track the player
    this.checkGate();
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

  private checkGate() {
    const gx = (GATE.col + 0.5) * TILE, gy = GATE.row * TILE + 16;
    if (Math.hypot(this.px - gx, this.py - gy) > TILE * 1.8) { this.enterPrompt.setVisible(false); return; }
    this.enterPrompt.setText('SPACE — Grand Avenue → Northern League').setVisible(true);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.enterPrompt.setVisible(false);
      this.cutsceneActive = true;
      this.dialog.show([
        'Gate Warden: ...Southern Champion. You are cleared to the League grounds. The Grand Avenue is yours.',
        'Gate Warden: Win or lose up there, you return by this same road. Carry yourself well — the capital is watching, and it remembers.',
      ], () => {
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('NorthernPlazaScene'));
      });
    }
  }

  private checkExit() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (this.py > (ROWS - 1) * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('capitalReturnX', 24 * 32 + 16);
        this.registry.set('capitalReturnY', 31 * 32 + 16);
        this.scene.start('CapitolCityScene');
      });
    }
  }
}

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GROUND) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  // Border walls.
  for (let c = 0; c < COLS; c++) { m[0][c] = T.WALL; m[ROWS - 1][c] = T.WALL; }
  for (let r = 0; r < ROWS; r++) { m[r][0] = T.WALL; m[r][COLS - 1] = T.WALL; }
  // Grand Avenue running north–south, opening at the north gate + south station.
  fill(1, ROWS - 1, 10, 14, T.PAVE);
  fill(0, 1, GATE.col, GATE.col + 2, T.PAVE);            // north gate opening
  fill(ROWS - 1, ROWS, 11, 13, T.PAVE);                  // south rail opening
  // Central ceremonial plaza (wider) around the monuments.
  fill(9, 16, 4, 20, T.PAVE);
  // Monumental building blocks flanking the avenue.
  fill(4, 8, 3, 8, T.WALL);   fill(4, 8, 16, 21, T.WALL);
  fill(18, 24, 3, 8, T.WALL); fill(18, 24, 16, 21, T.WALL);
  // Formal navy-and-gold banners on the building faces along the avenue.
  for (const r of [5, 6, 20, 21]) { m[r][8] = T.BANNER; m[r][15] = T.BANNER; }
  // Solid bases under the spire (col 7) and statue (col 16).
  m[11][7] = T.MONU; m[12][16] = T.MONU;
  return m;
}
