import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { SaveManager } from '../utils/SaveManager';
import { playBgm } from '../systems/Music';

const TILE = 32, COLS = 20, ROWS = 16;
const T = { GRASS: 0, PATH: 1, BOOKSHELF: 2, DESK: 3, WALL: 4 } as const;
type Tile = typeof T[keyof typeof T];
const COLORS: Record<Tile, number> = {
  [T.GRASS]: 0x7a6a6a, [T.PATH]: 0x8a7a6a, [T.BOOKSHELF]: 0x6a4a2a, [T.DESK]: 0x8a6a4a, [T.WALL]: 0x5a5a5a,
};
const SOLID = new Set<Tile>([T.BOOKSHELF, T.DESK, T.WALL]);

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.GRASS) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) if (r>=0&&r<ROWS&&c>=0&&c<COLS) m[r][c] = t;
  };

  // Bookshelves (tall storage along walls)
  fill(2, 6, 2, 4, T.BOOKSHELF);
  fill(2, 6, 16, 18, T.BOOKSHELF);
  fill(10, 14, 2, 4, T.BOOKSHELF);
  fill(10, 14, 16, 18, T.BOOKSHELF);

  // Reading desks scattered
  fill(3, 5, 7, 9, T.DESK);
  fill(3, 5, 11, 13, T.DESK);
  fill(11, 13, 7, 9, T.DESK);

  // Main pathway
  fill(0, ROWS, 9, 11, T.PATH);

  // Walls
  fill(0, ROWS, 0, 1, T.WALL);
  fill(0, ROWS, 19, COLS, T.WALL);
  fill(0, 1, 0, COLS, T.WALL);
  fill(ROWS - 1, ROWS, 0, COLS, T.WALL);

  return m;
}

export class JejuLibraryScene extends Phaser.Scene {
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

  constructor() { super('JejuLibraryScene'); }

  create() {
    this.map = buildMap();
    this.drawMap();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.cameras.main.fadeIn(400);
    playBgm(this, 'title'); // Quiet, scholarly atmosphere

    SaveManager.save(this.registry, this.px, this.py, 'JejuLibraryScene');
  }

  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);

      if (t === T.BOOKSHELF) {
        g.fillStyle(0x5a3a1a); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4);
        for (let i = 0; i < 3; i++) {
          g.fillStyle(0xffcc88, 0.4); g.fillRect(c*TILE+4, r*TILE+4+i*8, TILE-8, 6);
        }
      }
      if (t === T.DESK) {
        g.fillStyle(0x7a5a3a); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6);
        g.fillStyle(0xffdd99, 0.3); g.fillRect(c*TILE+5, r*TILE+5, TILE-10, TILE-10);
      }
      if (t === T.WALL) { g.fillStyle(0x4a4a4a); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6); }
    }

    const key = '__jejuLibraryMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE);
    g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(COLS * TILE / 2, 0.8 * TILE, '📖 Jeju Library', {
      fontSize: '13px', color: '#ddaa88', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(COLS * TILE / 2, (ROWS - 0.8) * TILE, tr('⬇ Return to Jeju City'), {
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
