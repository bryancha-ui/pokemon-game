import Phaser from 'phaser';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { SaveManager } from '../utils/SaveManager';
import { playBgm } from '../systems/Music';

const TILE = 32, COLS = 20, ROWS = 16;
const T = { GRASS: 0, PATH: 1, COUNTER: 2, TABLE: 3, WALL: 4 } as const;
type Tile = typeof T[keyof typeof T];
const COLORS: Record<Tile, number> = {
  [T.GRASS]: 0x6a5a4a, [T.PATH]: 0x8a7a6a, [T.COUNTER]: 0x8a5a3a, [T.TABLE]: 0xa07a5a, [T.WALL]: 0x5a4a3a,
};
const SOLID = new Set<Tile>([T.COUNTER, T.TABLE, T.WALL]);

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) if (r>=0&&r<ROWS&&c>=0&&c<COLS) m[r][c] = t;
  };

  // Bar counter (top right)
  fill(2, 6, 14, 19, T.COUNTER);

  // Tables scattered around
  fill(3, 5, 2, 4, T.TABLE);
  fill(3, 5, 6, 8, T.TABLE);
  fill(8, 10, 3, 5, T.TABLE);
  fill(8, 10, 10, 12, T.TABLE);
  fill(12, 14, 2, 4, T.TABLE);
  fill(12, 14, 15, 17, T.TABLE);

  // Wooden floor path
  fill(0, ROWS, 10, 11, T.PATH);

  // Walls
  fill(0, ROWS, 0, 1, T.WALL);
  fill(0, ROWS, 19, COLS, T.WALL);
  fill(0, 1, 0, COLS, T.WALL);
  fill(ROWS - 1, ROWS, 0, COLS, T.WALL);

  return m;
}

export class HarborTavernScene extends Phaser.Scene {
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

  constructor() { super('HarborTavernScene'); }

  create() {
    this.map = buildMap();
    this.drawMap();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.cameras.main.fadeIn(400);
    playBgm(this, 'waterfall'); // Tavern ambiance

    SaveManager.save(this.registry, this.px, this.py, 'HarborTavernScene');
  }

  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);

      if (t === T.COUNTER) {
        g.fillStyle(0x6a4a2a); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4);
        g.fillStyle(0xffbb88, 0.3); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, 6);
      }
      if (t === T.TABLE) {
        g.fillStyle(0x8a6a4a); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6);
        g.fillStyle(0x5a5a5a, 0.5); g.fillCircle(c*TILE+TILE/2, r*TILE+TILE/2, 3);
      }
      if (t === T.WALL) { g.fillStyle(0x4a3a2a); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6); }
    }

    const key = '__harborTavernMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(COLS * TILE / 2, 0.8 * TILE, '🍺 Harbor Tavern', {
      fontSize: '13px', color: '#ffbb88', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
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
