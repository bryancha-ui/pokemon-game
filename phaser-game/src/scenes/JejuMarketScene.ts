import Phaser from 'phaser';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { SaveManager } from '../utils/SaveManager';
import { playBgm } from '../systems/Music';

const TILE = 32, COLS = 20, ROWS = 16;
const T = { GRASS: 0, PATH: 1, STALL: 2, WALL: 3 } as const;
type Tile = typeof T[keyof typeof T];
const COLORS: Record<Tile, number> = {
  [T.GRASS]: 0x8a7a6a, [T.PATH]: 0x9a8a7a, [T.STALL]: 0xc09a5a, [T.WALL]: 0x5a5a5a,
};
const SOLID = new Set<Tile>([T.STALL, T.WALL]);

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) if (r>=0&&r<ROWS&&c>=0&&c<COLS) m[r][c] = t;
  };

  // Market vendor stalls
  fill(2, 4, 2, 5, T.STALL);    // left row
  fill(2, 4, 6, 9, T.STALL);
  fill(2, 4, 11, 14, T.STALL);
  fill(2, 4, 15, 18, T.STALL);

  fill(7, 9, 2, 5, T.STALL);     // middle row
  fill(7, 9, 6, 9, T.STALL);
  fill(7, 9, 11, 14, T.STALL);
  fill(7, 9, 15, 18, T.STALL);

  fill(12, 14, 3, 6, T.STALL);   // right row
  fill(12, 14, 8, 11, T.STALL);
  fill(12, 14, 14, 17, T.STALL);

  // Main pathways through market
  fill(0, ROWS, 9, 11, T.PATH);
  fill(5, 7, 0, COLS, T.PATH);

  // Walls
  fill(0, ROWS, 0, 1, T.WALL);
  fill(0, ROWS, 19, COLS, T.WALL);
  fill(0, 1, 0, COLS, T.WALL);
  fill(ROWS - 1, ROWS, 0, COLS, T.WALL);

  return m;
}

export class JejuMarketScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private px = 10 * TILE + 16;
  private py = 3 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private readonly SPEED = 120; private readonly RUN = 250;

  constructor() { super('JejuMarketScene'); }

  create() {
    this.map = buildMap();
    this.drawMap();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.cameras.main.fadeIn(400);
    playBgm(this, 'waterfall'); // Vibrant market atmosphere

    SaveManager.save(this.registry, this.px, this.py, 'JejuMarketScene');
  }

  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);

      if (t === T.STALL) {
        g.fillStyle(0xaa7a3a); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4);
        g.fillStyle(0xffdd99, 0.5); g.fillRect(c*TILE+4, r*TILE+4, TILE-8, 6); // awning
        g.fillStyle(0xff9944, 0.4); g.fillCircle(c*TILE+8, r*TILE+14, 3);  // produce
        g.fillStyle(0xffcc66, 0.4); g.fillCircle(c*TILE+TILE-8, r*TILE+14, 3);
      }
      if (t === T.WALL) { g.fillStyle(0x4a4a4a); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6); }
    }

    const key = '__jejuMarketMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(COLS * TILE / 2, 0.8 * TILE, '🏪 Jeju Traditional Market', {
      fontSize: '13px', color: '#ffcc88', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(COLS * TILE / 2, (ROWS - 0.8) * TILE, '⬇ Return to Jeju City', {
      fontSize: '10px', color: '#aaffff', backgroundColor: '#00000088', padding: { x: 4, y: 2 },
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
    if (this.py > (ROWS - 2) * TILE) {
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
