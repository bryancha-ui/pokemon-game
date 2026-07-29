import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { SaveManager } from '../utils/SaveManager';
import { playBgm } from '../systems/Music';

const TILE = 32, COLS = 20, ROWS = 16;
const T = { FLOOR: 0, PATH: 1, ALTAR: 2, PILLAR: 3, MAT: 4, CANDLE: 5, WALL: 6 } as const;
type Tile = typeof T[keyof typeof T];
const COLORS: Record<Tile, number> = {
  [T.FLOOR]: 0x6a4a3a, [T.PATH]: 0x8a6a4a, [T.ALTAR]: 0xc0402a, [T.PILLAR]: 0x8a2a1a,
  [T.MAT]: 0xc09a4a, [T.CANDLE]: 0x3a2a2a, [T.WALL]: 0x3a2620,
};
const SOLID = new Set<Tile>([T.ALTAR, T.PILLAR, T.CANDLE, T.WALL]);

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.FLOOR) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) if (r>=0&&r<ROWS&&c>=0&&c<COLS) m[r][c] = t;
  };

  // Grand altar at the far end (top)
  fill(2, 4, 7, 13, T.ALTAR);

  // Candle braziers flanking the altar
  m[4][6] = T.CANDLE; m[4][13] = T.CANDLE;

  // Vermilion pillars lining the hall
  for (const r of [6, 9, 12]) { m[r][4] = T.PILLAR; m[r][15] = T.PILLAR; }

  // Prayer mats before the altar
  fill(6, 8, 8, 12, T.MAT);
  fill(10, 12, 8, 12, T.MAT);

  // Central approach path
  fill(0, ROWS, 9, 11, T.PATH);

  // Walls (bottom-center left open as the exit)
  fill(0, ROWS, 0, 2, T.WALL);
  fill(0, ROWS, 18, COLS, T.WALL);
  fill(0, 1, 0, COLS, T.WALL);
  fill(ROWS - 1, ROWS, 0, 9, T.WALL);
  fill(ROWS - 1, ROWS, 11, COLS, T.WALL);

  return m;
}

export class SanbangsanShrineScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private px = 10 * TILE + 16;
  private py = 13 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private readonly SPEED = 120; private readonly RUN = 250;

  constructor() { super('SanbangsanShrineScene'); }

  create() {
    this.map = buildMap();
    this.drawMap();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.cameras.main.fadeIn(400);
    playBgm(this, 'title');

    SaveManager.save(this.registry, this.px, this.py, 'SanbangsanShrineScene');
  }

  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      const x = c * TILE, y = r * TILE;
      g.fillStyle(COLORS[t], 1); g.fillRect(x, y, TILE, TILE);

      if (t === T.FLOOR) { g.fillStyle(0x000000, 0.08); g.fillRect(x, y + TILE - 1, TILE, 1); g.fillRect(x + TILE - 1, y, 1, TILE); }
      if (t === T.PATH) { g.fillStyle(0x9a7a5a, 0.5); g.fillRect(x + 4, y + 6, TILE - 8, 4); }
      if (t === T.ALTAR) {
        g.fillStyle(0x9a2a1a, 1); g.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
        g.fillStyle(0xffd24a, 0.9); g.fillRect(x + 6, y + 6, TILE - 12, 6);
        g.fillStyle(0xffe89a, 0.7); g.fillCircle(x + 16, y + 20, 4);
      }
      if (t === T.PILLAR) {
        g.fillStyle(0x9a2a1a, 1); g.fillRect(x + 8, y, 16, TILE);
        g.fillStyle(0xffcf5a, 0.5); g.fillRect(x + 10, y, 3, TILE);
        g.fillStyle(0x2a7a4a, 0.8); g.fillRect(x + 8, y + 2, 16, 3);
      }
      if (t === T.MAT) {
        g.fillStyle(0xb08a3a, 1); g.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
        g.fillStyle(0x8a6a2a, 0.7); g.fillRect(x + 5, y + 5, TILE - 10, TILE - 10);
      }
      if (t === T.CANDLE) {
        g.fillStyle(0x2a1a12, 1); g.fillRect(x + 10, y + 10, 12, 16);
        g.fillStyle(0xffb020, 1); g.fillCircle(x + 16, y + 8, 5);
        g.fillStyle(0xffe89a, 0.9); g.fillCircle(x + 16, y + 7, 2.5);
      }
      if (t === T.WALL) {
        g.fillStyle(0x2a1a14, 1); g.fillRect(x, y, TILE, TILE);
        g.fillStyle(0x4a352a, 1); g.fillRect(x + 2, y + 2, TILE - 4, 12);
        g.fillStyle(0x4a352a, 1); g.fillRect(x + 2, y + 18, TILE - 4, 12);
      }
    }

    const key = '__sanbangsanShrineMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(COLS * TILE / 2, 0.8 * TILE, tr('⛩️ 산방산 Shrine'), {
      fontSize: '13px', color: '#ffcf6a', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(COLS * TILE / 2, (ROWS - 0.8) * TILE, tr('⬇ Return to Jeju City'), {
      fontSize: '10px', color: '#ffddaa', backgroundColor: '#00000088', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(5);
  }

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
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  update(_: number, delta: number) {
    if (this.cutsceneActive) return;
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
      if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else this.walkFrame = 0;
    this.drawChar();
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

  private checkExit() {
    if (this.py > (ROWS - 1) * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        const returnScene = this.registry.get('interiorReturnScene') as string;
        const returnX = this.registry.get('interiorReturnX') as number;
        const returnY = this.registry.get('interiorReturnY') as number;
        this.registry.set('jejuCityReturnX', returnX);
        this.registry.set('jejuCityReturnY', returnY);
        this.scene.start(returnScene);
      });
    }
  }
}
