import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { mapaeCount } from '../data/Mapae';

// ── 평성 관문 (Pyeongseong Checkpoint) ────────────────────────────────────────────
// The capital's outer gate on the road up from Wonsan. Royal wardens inspect every
// traveller's 마패 (the eight inspectorate tablets). Only a bearer of the seven
// regional 마패 is passed north into Pyeongseong; the eighth is earned from Supreme Gwang.
// South returns to Wonsan.

const T = { SNOW: 0, ROCK: 1, WALL: 2, GATE: 3, PAVE: 4 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 16, ROWS = 22;
const COLORS: Record<Tile, number> = {
  [T.SNOW]: 0xd8dce6, [T.ROCK]: 0x3a3640, [T.WALL]: 0x4a4a52, [T.GATE]: 0x2a2a30, [T.PAVE]: 0xb9b0c4,
};
const SOLID = new Set<Tile>([T.ROCK, T.WALL]);
const REQUIRED_MAPAE = 7;   // the seven regional 마패 (the eighth is earned from Supreme Gwang in Pyeongseong)

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.SNOW) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  fill(0, ROWS, 0, 2, T.ROCK); fill(0, ROWS, COLS - 2, COLS, T.ROCK);   // side cliffs
  fill(0, 3, 0, COLS, T.WALL);                                          // north rampart
  fill(0, 3, 7, 9, T.GATE);                                            // the gate to Pyeongseong
  fill(3, ROWS, 6, 10, T.PAVE);                                        // paved avenue up to the gate
  return m;
}

export class PyeongseongCheckpointScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private px = 7.5 * TILE;
  private py = 20 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false; private spawnPx = 0; private spawnPy = 0;
  private readonly SPEED = 120; private readonly RUN = 250;

  constructor() { super('PyeongseongCheckpointScene'); }

  private get cleared() { return mapaeCount(this.registry) >= REQUIRED_MAPAE; }

  create() {
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    playBgm(this, 'baekducheck');
    this.input.keyboard?.resetKeys();
    const rx = this.registry.get('pyeongseongCheckpointReturnX') as number | undefined;
    const ry = this.registry.get('pyeongseongCheckpointReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    else { this.px = 7.5 * TILE; this.py = 20 * TILE + 16; }
    this.registry.remove('pyeongseongCheckpointReturnX'); this.registry.remove('pyeongseongCheckpointReturnY');

    this.spawnPx = this.px; this.spawnPy = this.py;
    this.spawnGuard = true;
    this.time.delayedCall(500, () => { this.spawnGuard = false; });

    this.map = buildMap();
    this.drawMap();
    this.drawWardens();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'PyeongseongCheckpointScene');
  }

  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c]; const x = c * TILE, y = r * TILE;
      g.fillStyle(COLORS[t], 1); g.fillRect(x, y, TILE, TILE);
      if (t === T.SNOW) { g.fillStyle(0xffffff, 0.6); g.fillCircle(x + 9, y + 12, 3); g.fillCircle(x + 22, y + 22, 2); }
      if (t === T.ROCK) { g.fillStyle(0x2a2630); g.fillRect(x + 4, y + 5, 8, 7); g.fillRect(x + 18, y + 18, 9, 8); }
      if (t === T.WALL) { g.fillStyle(0x33333a); g.fillRect(x, y + 2, TILE, 2); g.fillRect(x, y + 18, TILE, 2); g.fillStyle(0x5a5a64); g.fillRect(x + 3, y + 5, 6, 10); }
      if (t === T.GATE) { g.fillStyle(0x1a1a1f); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x8a7a3a); for (let i = 0; i < 3; i++) g.fillRect(x + 4 + i * 9, y + 2, 3, TILE - 4); }
      if (t === T.PAVE) { g.fillStyle(0xa89ab8, 0.6); g.fillRect(x + 5, y + 10, 5, 3); g.fillRect(x + 18, y + 20, 5, 3); }
    }
    const key = '__pyeongCheckMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(7.5 * TILE, 0.6 * TILE, tr('↑ 평성 (Pyeongseong)'), { fontSize: '10px', color: '#ffe9c0', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
    this.add.text(7.5 * TILE, (ROWS - 0.6) * TILE, tr('↓ 원산 (Wonsan)'), { fontSize: '10px', color: '#fff', backgroundColor: '#3a5a8a99', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
  }

  private drawWardens() {
    for (const [col, row] of [[6, 4], [9, 4]] as [number, number][]) {
      const g = this.add.graphics().setDepth(8);
      g.setPosition(col * TILE + 16, row * TILE + 16);
      g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 16, 5);
      g.fillStyle(0x2a2440); g.fillRect(-7, -8, 14, 12); g.fillStyle(0xffd24a); g.fillRect(-7, -8, 14, 2);
      g.fillStyle(0x1a1a2e); g.fillRect(-6, 4, 5, 8); g.fillRect(1, 4, 5, 8);
      g.fillStyle(0xffcc99); g.fillRect(-6, -20, 12, 11);
      g.fillStyle(0x141422); g.fillRect(-6, -21, 12, 5);
      g.fillStyle(0x000000); g.fillRect(-3, -15, 2, 2); g.fillRect(1, -15, 2, 2);
    }
    this.add.text(7.5 * TILE, 3.1 * TILE, tr('royal wardens'), { fontSize: '8px', color: '#ffe9c0', backgroundColor: '#00000099', padding: { x: 2, y: 1 } }).setOrigin(0.5).setDepth(9);
  }

  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.drawChar(); }
  private drawChar() {
    drawTrainerBody(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry));
    this.playerG.setPosition(this.px, this.py);
  }
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(1.7);
    this.cameras.main.startFollow(this.playerG, true, 0.1, 0.1);
  }
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { up: this.input.keyboard!.addKey('W'), down: this.input.keyboard!.addKey('S'), left: this.input.keyboard!.addKey('A'), right: this.input.keyboard!.addKey('D') };
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 400, 30, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, tr('🛡 평성 관문 (Pyeongseong Checkpoint)'), { fontSize: '13px', color: '#ffe9c0', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, tr('WASD: move  SHIFT: run  M: menu'), {
      fontSize: '10px', color: '#ccc', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

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
      if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else this.walkFrame = 0;
    this.drawChar();
    this.checkGate();
    this.checkExit();
  }
  private collides(x: number, y: number): boolean {
    const hw = 6;
    return [[x - hw, y - 4], [x + hw, y - 4], [x - hw, y + 8], [x + hw, y + 8]].some(([cx, cy]) => {
      const col = Math.floor(cx / TILE), row = Math.floor(cy / TILE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      return SOLID.has(this.map[row][col]);
    });
  }

  /** The wardens inspect your 마패 as you approach the gate. */
  private checkGate() {
    if (this.py > 6 * TILE) return;   // only near the gate up top
    if (this.cleared) {
      if (!this.registry.get('pyeongseongWardensSaluted')) {
        this.registry.set('pyeongseongWardensSaluted', true);
        this.cutsceneActive = true;
        this.dialog.show([
          `Royal Warden: ...Seven 마패. The regional inspectorate is satisfied, Champion.`,
          'Royal Warden: The gate to Pyeongseong is open to you. Seek Supreme Gwang in the capital — he holds the final test.',
        ], () => { this.cutsceneActive = false; });
      }
      return;   // gate is open; walking north through it triggers checkExit → Pyeongseong
    }
    // Not enough 마패 — turn the player back.
    this.cutsceneActive = true;
    const n = mapaeCount(this.registry);
    this.dialog.show([
      `Royal Warden: Halt. None pass into Pyeongseong without the inspectorate's 마패.`,
      `Royal Warden: You bear ${n} of the ${REQUIRED_MAPAE} regional tablets. Complete the circuit and return.`,
    ], () => {
      this.py = 8 * TILE + 16;   // push clear of the gate so the warning doesn't re-fire
      this.cutsceneActive = false;
    });
  }

  private checkExit() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (Math.hypot(this.px - this.spawnPx, this.py - this.spawnPy) < 1.4 * TILE) return;
    // North through the open gate → Pyeongseong (only reachable once the wardens clear you).
    if (this.cleared && this.py < 1 * TILE && this.px > 6 * TILE && this.px < 10 * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('pyeongyangReturnX', 15.5 * 32);
        this.registry.set('pyeongyangReturnY', 33 * 32 + 16);
        this.scene.start('PyeongyangCityScene');
      });
      return;
    }
    // South → back down to Wonsan.
    if (this.py > (ROWS - 1) * TILE && this.px > 5 * TILE && this.px < 11 * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('WonsanCitySceneReturnX', 38 * 32 + 16);
        this.registry.set('WonsanCitySceneReturnY', 8 * 32 + 16);
        this.scene.start('WonsanCityScene');
      });
    }
  }
}
