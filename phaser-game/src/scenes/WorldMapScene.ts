import Phaser from 'phaser';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';

// ── Tile types ────────────────────────────────────────────────────────────────
const T = {
  GRASS:    0,
  TREE:     1,
  ROAD_H:   2,
  ROAD_V:   3,
  ROAD_X:   4,
  WATER:    5,
  BUILDING: 6,
  ROOF:     7,
  MOUNTAIN: 8,
  FLOWER:   9,
  SAND:     10,
  BRIDGE:   11,
  SIGN:     12,
  PARK:     13,
} as const;

type Tile = typeof T[keyof typeof T];

const TILE = 32;   // px per tile
const COLS = 64;
const ROWS = 64;

// ── Waterfall City tile map ───────────────────────────────────────────────────
// prettier-ignore
function buildMap(): Tile[][] {
  const G = T.GRASS, TR = T.TREE, RH = T.ROAD_H, RV = T.ROAD_V,
        RX = T.ROAD_X, W = T.WATER, B = T.BUILDING, RF = T.ROOF,
        M = T.MOUNTAIN, FL = T.FLOWER, S = T.SAND, BR = T.BRIDGE,
        PK = T.PARK;

  // Fill with grass
  const map: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(G) as Tile[]);

  // ── Mountain range (north) rows 0-8 ──────────────────────────────────────
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < COLS; c++) {
      const d = Math.abs(c - 32) / 32;
      map[r][c] = (r < 6 - Math.floor(d * 3)) ? M : TR;
    }
  }

  // ── Waterfall river: col 14-16, rows 6-28 ────────────────────────────────
  for (let r = 6; r < 28; r++) {
    map[r][14] = S; map[r][15] = W; map[r][16] = S;
    if (r > 8) { map[r][13] = S; map[r][17] = S; }
  }
  // River bends east rows 28-34
  for (let r = 28; r < 35; r++) {
    map[r][15] = W; map[r][14] = S; map[r][16] = S;
    for (let c = 16; c < 16 + (r - 28) * 2; c++) {
      map[r][c] = c % 2 === 0 ? S : W;
    }
  }
  // River continues east rows 33-50, col 28-34
  for (let r = 33; r < 50; r++) {
    for (let c = 28; c < 35; c++) {
      map[r][c] = c === 29 || c === 31 || c === 33 ? W : S;
    }
  }

  // ── Bridge over river at row 22 ───────────────────────────────────────────
  map[22][14] = BR; map[22][15] = BR; map[22][16] = BR;

  // ── Forest belt: cols 0-8, rows 8-40 ─────────────────────────────────────
  for (let r = 8; r < 40; r++) {
    for (let c = 0; c < 9; c++) {
      map[r][c] = (r + c) % 3 === 0 ? FL : TR;
    }
  }

  // ── Main road (horizontal): row 24, full width ───────────────────────────
  for (let c = 0; c < COLS; c++) map[24][c] = RH;
  // Main road (vertical): col 22
  for (let r = 0; r < ROWS; r++) map[r][22] = RV;
  // Intersection
  map[24][22] = RX;

  // ── Side streets ─────────────────────────────────────────────────────────
  for (let c = 9; c < COLS; c++) map[18][c] = RH;
  for (let c = 9; c < COLS; c++) map[30][c] = RH;
  for (let r = 9;  r < ROWS; r++) map[r][30] = RV;
  for (let r = 9;  r < ROWS; r++) map[r][38] = RV;
  for (let r = 9;  r < ROWS; r++) map[r][46] = RV;
  map[18][22] = RX; map[18][30] = RX; map[18][38] = RX; map[18][46] = RX;
  map[24][30] = RX; map[24][38] = RX; map[24][46] = RX;
  map[30][22] = RX; map[30][30] = RX; map[30][38] = RX; map[30][46] = RX;

  // ── Residential blocks: fill blocks between roads with buildings ──────────
  function fillBlock(r1: number, c1: number, r2: number, c2: number) {
    for (let r = r1; r <= r2; r++) {
      for (let c = c1; c <= c2; c++) {
        if (map[r][c] === G) {
          const isBuilding = (r === r1 || r === r2 || c === c1 || c === c2);
          map[r][c] = isBuilding ? B : RF;
        }
      }
    }
  }

  // Block between rows 19-23, cols 23-29
  fillBlock(19, 23, 23, 29);
  fillBlock(19, 31, 23, 37);
  fillBlock(19, 39, 23, 45);
  fillBlock(19, 47, 23, 55);
  fillBlock(25, 23, 29, 29);
  fillBlock(25, 31, 29, 37);
  fillBlock(25, 39, 29, 45);
  fillBlock(25, 47, 29, 55);
  // Upper residential (rows 9-17)
  fillBlock(9,  23, 17, 29);
  fillBlock(9,  31, 17, 37);
  fillBlock(9,  39, 17, 45);
  fillBlock(9,  47, 17, 55);

  // ── Park area: rows 31-45, cols 9-20 ──────────────────────────────────────
  for (let r = 31; r < 46; r++) {
    for (let c = 9; c < 21; c++) {
      if (map[r][c] === G) {
        map[r][c] = (r + c) % 5 === 0 ? FL : (r + c) % 7 === 0 ? TR : PK;
      }
    }
  }

  // ── Town square / plaza: rows 31-37, cols 23-29 ────────────────────────────
  for (let r = 31; r < 38; r++) {
    for (let c = 23; c < 30; c++) {
      if (map[r][c] === G) map[r][c] = PK;
    }
  }
  // Town hall building center of plaza
  for (let r = 32; r < 36; r++) {
    for (let c = 24; c < 29; c++) {
      map[r][c] = r === 32 || r === 35 || c === 24 || c === 28 ? B : RF;
    }
  }

  // ── Southern grass/meadow rows 46-63 ─────────────────────────────────────
  for (let r = 50; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      map[r][c] = (r + c) % 6 === 0 ? FL : (r + c) % 9 === 0 ? TR : G;
    }
  }

  // ── Eastern mountains: cols 56-63 ────────────────────────────────────────
  for (let r = 0; r < 40; r++) {
    for (let c = 56; c < COLS; c++) {
      map[r][c] = r < 20 ? M : TR;
    }
  }

  // Stamp roads back over anything that got overwritten
  for (let c = 0; c < COLS; c++) { map[24][c] = RH; map[18][c] = RH; map[30][c] = RH; }
  for (let r = 0; r < ROWS; r++) { map[r][22] = RV; map[r][30] = RV; map[r][38] = RV; map[r][46] = RV; }
  [18, 24, 30].forEach(r => [22, 30, 38, 46].forEach(c => { map[r][c] = RX; }));
  map[22][14] = BR; map[22][15] = BR; map[22][16] = BR;

  return map;
}

// ── Tile colors ───────────────────────────────────────────────────────────────
const TILE_COLOR: Record<Tile, number> = {
  [T.GRASS]:    0x6abf4b,
  [T.TREE]:     0x2d7a2d,
  [T.ROAD_H]:   0x888888,
  [T.ROAD_V]:   0x888888,
  [T.ROAD_X]:   0x999999,
  [T.WATER]:    0x3399ff,
  [T.BUILDING]: 0xd4a96a,
  [T.ROOF]:     0xc0392b,
  [T.MOUNTAIN]: 0x8a7a6a,
  [T.FLOWER]:   0xf9d44a,
  [T.SAND]:     0xe8d8a0,
  [T.BRIDGE]:   0xa07840,
  [T.SIGN]:     0xffffff,
  [T.PARK]:     0x90d060,
};

const SOLID: Set<Tile> = new Set([T.TREE, T.BUILDING, T.ROOF, T.MOUNTAIN, T.WATER]);

// ── Special buildings ─────────────────────────────────────────────────────────
interface BuildingDef {
  id: string; label: string; scene: string;
  col: number; row: number; w: number; h: number;
  doorCol: number; doorRow: number;
  wallColor: number; roofColor: number; accentColor: number;
}
const BUILDINGS: BuildingDef[] = [
  { id: 'home',   label: "Your Home",        scene: 'PlayerHomeScene',
    col: 10, row: 32, w: 4, h: 4, doorCol: 11, doorRow: 36,
    wallColor: 0xf5deb3, roofColor: 0xcc4444, accentColor: 0xeecc88 },
  { id: 'pokecenter', label: 'Pokémon Center', scene: 'PokemonCenterScene',
    col: 23, row: 10, w: 6, h: 7, doorCol: 25, doorRow: 17,
    wallColor: 0xffffff, roofColor: 0xcc2244, accentColor: 0xaaccff },
  { id: 'rival',  label: "Minhyuk's House",  scene: 'RivalHomeScene',
    col: 16, row: 32, w: 4, h: 4, doorCol: 17, doorRow: 36,
    wallColor: 0xb0c4de, roofColor: 0x334466, accentColor: 0x8899bb },
  { id: 'lab',    label: "Prof. Kim's Lab",  scene: 'StarterSelectScene',
    col: 31, row: 10, w: 6, h: 7, doorCol: 33, doorRow: 17,
    wallColor: 0xeeeeff, roofColor: 0x2255aa, accentColor: 0xaaddff },
];

export class WorldMapScene extends Phaser.Scene {
  private playerSprite!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private map!: Tile[][];
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private locationText!: Phaser.GameObjects.Text;
  private miniMapGraphics!: Phaser.GameObjects.Graphics;
  private enterPrompt!: Phaser.GameObjects.Text;
  private shoesText!: Phaser.GameObjects.Text;
  private cutsceneDialog!: DialogBox;
  private shiftKey!: Phaser.Input.Keyboard.Key;

  private readonly BASE_SPEED = 120;
  private readonly RUN_SPEED  = 260;
  private readonly PW = 14;
  private readonly PH = 18;

  private px = 22 * TILE + TILE / 2;
  private py = 24 * TILE + TILE / 2;
  private facing = 0;
  private walkFrame = 0;
  private walkTimer = 0;
  private isMoving = false;
  private cutsceneActive = false;
  private saveToast!: Phaser.GameObjects.Text;

  constructor() { super('WorldMapScene'); }

  create() {
    // Reset all per-session state
    this.cutsceneActive = false;
    this.isMoving       = false;
    this.walkFrame      = 0;
    this.walkTimer      = 0;

    // Clear any key states left over from previous scenes (e.g. StarterSelectScene)
    this.input.keyboard?.resetKeys();

    // Restore spawn position
    const rx = this.registry.get('returnX') as number | undefined;
    const ry = this.registry.get('returnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('returnX'); this.registry.remove('returnY');

    this.map = buildMap();

    // Safety: if spawn lands inside a solid tile, nudge south to the next road
    const spawnRow = Math.floor(this.py / TILE);
    const spawnCol = Math.floor(this.px / TILE);
    if (spawnRow < ROWS && spawnCol < COLS && SOLID.has(this.map[spawnRow][spawnCol])) {
      // Walk down until we find a non-solid row in this column
      let safeRow = spawnRow;
      while (safeRow < ROWS && SOLID.has(this.map[safeRow][spawnCol])) safeRow++;
      this.py = safeRow * TILE + TILE / 2;
    }

    this.drawMap();
    this.drawBuildings();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.addLabels();
  }

  // ── Map rendering ─────────────────────────────────────────────────────────
  private drawMap() {
    // Bake to a static texture (one draw call/frame instead of thousands)
    const g = this.make.graphics({ x: 0, y: 0 });
    this.mapGraphics = g as unknown as Phaser.GameObjects.Graphics; // keep ref for helper methods

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.map[r][c];
        g.fillStyle(TILE_COLOR[tile], 1);
        g.fillRect(c * TILE, r * TILE, TILE, TILE);
        if (tile === T.TREE)    this.drawTree(c * TILE + TILE / 2, r * TILE + TILE / 2);
        if (tile === T.MOUNTAIN) this.drawMountain(c * TILE, r * TILE);
        if (tile === T.ROAD_H || tile === T.ROAD_V) this.drawRoadLine(c * TILE, r * TILE, tile);
        if (tile === T.WATER)   this.drawWaterShimmer(c * TILE, r * TILE, c, r);
      }
    }

    const texKey = '__worldMapBaked__';
    if (this.textures.exists(texKey)) this.textures.remove(texKey);
    g.generateTexture(texKey, COLS * TILE, ROWS * TILE);
    g.destroy();
    this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);
  }

  private drawTree(x: number, y: number) {
    this.mapGraphics.fillStyle(0x1a5c1a, 1);
    this.mapGraphics.fillTriangle(x, y - 12, x - 9, y + 6, x + 9, y + 6);
    this.mapGraphics.fillStyle(0x4a3020, 1);
    this.mapGraphics.fillRect(x - 3, y + 6, 6, 6);
  }

  private drawMountain(x: number, y: number) {
    this.mapGraphics.fillStyle(0x6a6060, 1);
    this.mapGraphics.fillTriangle(x + TILE / 2, y + 2, x + 2, y + TILE - 2, x + TILE - 2, y + TILE - 2);
    this.mapGraphics.fillStyle(0xffffff, 0.7);
    this.mapGraphics.fillTriangle(x + TILE / 2, y + 2, x + TILE / 2 - 5, y + 10, x + TILE / 2 + 5, y + 10);
  }

  private drawRoadLine(x: number, y: number, tile: Tile) {
    this.mapGraphics.fillStyle(0xeeee55, 1);
    if (tile === T.ROAD_H) this.mapGraphics.fillRect(x, y + TILE / 2 - 1, TILE, 2);
    else this.mapGraphics.fillRect(x + TILE / 2 - 1, y, 2, TILE);
  }

  private drawWaterShimmer(x: number, y: number, c: number, r: number) {
    this.mapGraphics.fillStyle(0x66bbff, 0.5);
    const offset = (c + r) % 3;
    this.mapGraphics.fillRect(x + offset * 6, y + 4, 10, 3);
    this.mapGraphics.fillRect(x + offset * 4 + 4, y + 14, 8, 3);
    this.mapGraphics.fillRect(x + offset * 5 + 2, y + 22, 12, 3);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  private createPlayer() {
    this.playerSprite = this.add.graphics();
    this.playerSprite.setDepth(20);
    this.drawCharacter();
  }

  private drawCharacter() {
    const g = this.playerSprite;
    g.clear();

    const f = this.walkFrame;           // 0 or 1 — alternating step
    const flip = this.facing === 2;     // mirror when facing left

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(0, 13, 18, 6);

    // Shoes
    g.fillStyle(0x222222, 1);
    const lx = flip ? 3 : -8;
    const rx = flip ? -8 : 3;
    const ly = f === 0 ? 9 : 6;
    const ry = f === 0 ? 6 : 9;
    g.fillRect(lx, ly, 6, 5);
    g.fillRect(rx, ry, 6, 5);

    // Legs (dark blue trousers)
    g.fillStyle(0x1a1a6e, 1);
    g.fillRect(lx + 1, ly - 7, 4, 8);
    g.fillRect(rx + 1, ry - 7, 4, 8);

    // Body (red jacket — Korean school uniform style)
    g.fillStyle(0xcc2222, 1);
    g.fillRect(-8, -8, 16, 14);

    // White shirt collar
    g.fillStyle(0xffffff, 1);
    g.fillRect(-2, -8, 4, 5);

    // Arms
    g.fillStyle(0xcc2222, 1);
    g.fillRect(-12, -7, 5, 9);
    g.fillRect(7,   -7, 5, 9);

    // Hands
    g.fillStyle(0xffcc99, 1);
    g.fillRect(-12, 2, 5, 4);
    g.fillRect(7,   2, 5, 4);

    // Neck
    g.fillStyle(0xffcc99, 1);
    g.fillRect(-3, -12, 6, 5);

    // Head
    g.fillStyle(0xffcc99, 1);
    g.fillRect(-7, -24, 14, 13);

    // Hair (dark)
    g.fillStyle(0x1a1008, 1);
    g.fillRect(-7, -24, 14, 5);
    if (this.facing === 1) {  // back — full hair
      g.fillRect(-7, -24, 14, 13);
    }

    // Eyes — only on front/side facing
    if (this.facing !== 1) {
      g.fillStyle(0x000000, 1);
      if (this.facing === 0) {          // front
        g.fillRect(-4, -17, 2, 2);
        g.fillRect(2,  -17, 2, 2);
      } else if (this.facing === 2) {   // left
        g.fillRect(-5, -17, 2, 2);
      } else {                          // right
        g.fillRect(3,  -17, 2, 2);
      }
    }

    g.setPosition(this.px, this.py);
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  private setupCamera() {
    const worldW = COLS * TILE;
    const worldH = ROWS * TILE;

    // Main world camera: follows player, zoomed in
    this.cameras.main.setBounds(0, 0, worldW, worldH);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.startFollow(this.playerSprite, true, 0.08, 0.08);

  }

  // ── Special buildings ─────────────────────────────────────────────────────
  private drawBuildings() {
    const g = this.add.graphics().setDepth(3);

    for (const b of BUILDINGS) {
      const x = b.col * TILE, y = b.row * TILE;
      const w = b.w * TILE,   h = b.h * TILE;

      // Wall
      g.fillStyle(b.wallColor, 1); g.fillRect(x, y, w, h);
      g.lineStyle(2, 0x333333, 1); g.strokeRect(x, y, w, h);

      // Roof (triangle)
      g.fillStyle(b.roofColor, 1);
      g.fillTriangle(x - 4, y, x + w / 2, y - TILE * 1.5, x + w + 4, y);

      // Windows
      g.fillStyle(b.accentColor, 1);
      g.fillRect(x + 4, y + 6, 18, 14);
      g.fillRect(x + w - 22, y + 6, 18, 14);
      g.lineStyle(1, 0xffffff, 0.8);
      g.strokeRect(x + 4, y + 6, 18, 14);
      g.strokeRect(x + w - 22, y + 6, 18, 14);
      // Window cross
      g.lineBetween(x + 13, y + 6, x + 13, y + 20);
      g.lineBetween(x + 4, y + 13, x + 22, y + 13);
      g.lineBetween(x + w - 13, y + 6, x + w - 13, y + 20);
      g.lineBetween(x + w - 22, y + 13, x + w - 4, y + 13);

      // Door
      const dx = b.doorCol * TILE, dy = (b.row + b.h - 1) * TILE;
      g.fillStyle(0x8b4513, 1); g.fillRect(dx + 4, dy, TILE - 8, TILE);
      g.fillStyle(0xddaa44, 1); g.fillCircle(dx + TILE - 10, dy + TILE / 2, 3);

      // Door step
      g.fillStyle(0xaaaaaa, 1); g.fillRect(dx, dy + TILE - 4, TILE, 8);
    }

    // Labels
    for (const b of BUILDINGS) {
      this.add.text(
        (b.col + b.w / 2) * TILE,
        (b.row - 2) * TILE,
        b.label,
        { fontSize: '9px', color: '#ffffff', backgroundColor: '#00000099', padding: { x: 4, y: 2 } }
      ).setOrigin(0.5, 1).setDepth(4);
    }

    // Enter prompt (fixed to camera)
    this.enterPrompt = this.add.text(400, 460, '', {
      fontSize: '14px', color: '#ffe44e', backgroundColor: '#00000099',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.shiftKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.input.keyboard!.on('keydown-M', () => {
      if (!this.cutsceneActive) this.scene.launch('MenuScene');
    });
    this.input.keyboard!.on('keydown-B', () => {
      if (!this.cutsceneActive) this.scene.launch('MenuScene');
    });
    this.input.keyboard!.on('keydown-F5', (e: KeyboardEvent) => {
      e.preventDefault();
      this.saveGame();
    });
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  private createUI() {
    // Location banner
    const uiBg = this.add.rectangle(400, 24, 340, 36, 0x000000, 0.6).setScrollFactor(0).setDepth(100);
    this.locationText = this.add.text(400, 24, '📍 Waterfall City', {
      fontSize: '16px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // Controls hint
    this.add.text(8, 480, 'WASD/Arrows  |  SPACE: enter  |  SHIFT: run  |  M: menu', {
      fontSize: '11px', color: '#cccccc', backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100);

    // Running shoes indicator
    this.shoesText = this.add.text(8, 456, '👟 RUNNING', {
      fontSize: '12px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(100).setVisible(false);

    // Mini-map
    this.createMiniMap();

    // Cutscene dialog (same DialogBox, lives on overworld)
    this.cutsceneDialog = new DialogBox(this, 1280, 720);

    // Save toast notification
    this.saveToast = this.add.text(400, 440, '💾  Game Saved', {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#00000099',
      padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setAlpha(0);

    // Auto-save every 60 seconds
    this.time.addEvent({
      delay: 60_000,
      loop: true,
      callback: () => this.saveGame(),
    });

    void uiBg;
  }

  private createMiniMap() {
    const MM = 3; // pixels per tile on mini-map
    const mmW = COLS * MM;
    const mmH = ROWS * MM;
    const mmX = 800 - mmW - 10;
    const mmY = 10;

    this.add.rectangle(mmX + mmW / 2, mmY + mmH / 2, mmW + 4, mmH + 4, 0x000000, 0.8)
      .setScrollFactor(0).setDepth(99);

    this.miniMapGraphics = this.add.graphics().setScrollFactor(0).setDepth(100);

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const tile = this.map[r][c];
        this.miniMapGraphics.fillStyle(TILE_COLOR[tile], 1);
        this.miniMapGraphics.fillRect(mmX + c * MM, mmY + r * MM, MM, MM);
      }
    }

    // Player dot drawn in update
    this.add.text(mmX + mmW / 2, mmY - 8, 'MAP', {
      fontSize: '9px', color: '#aaaaaa',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100);
  }

  private addLabels() {
    const label = (text: string, col: number, row: number) =>
      this.add.text(col * TILE + TILE / 2, row * TILE + TILE / 2, text, {
        fontSize: '8px', color: '#000', backgroundColor: '#ffffffaa',
        padding: { x: 2, y: 1 },
      }).setOrigin(0.5).setDepth(5);

    label('폭포시티\nWaterfall City', 36, 20);
    label('Town Hall', 26, 33);
    label('Central Park', 15, 38);
    label('Waterfall', 15, 10);
    label('Mt. Bukhan\n북한산', 45, 3);
    label('Forest Path', 4, 25);
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update(_: number, delta: number) {
    // During cutscene handle only dialog input
    if (this.cutsceneActive) {
      if (this.cutsceneDialog.isInChoice()) {
        if (Phaser.Input.Keyboard.JustDown(this.shiftKey)) this.cutsceneDialog.navigateChoice(-1);
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) this.cutsceneDialog.confirmChoice();
      } else if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.cutsceneDialog.advance();
      }
      return;
    }

    const dt = delta / 1000;
    let dx = 0, dy = 0;

    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx =  1; this.facing = 3; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy =  1; this.facing = 0; }

    this.isMoving = dx !== 0 || dy !== 0;

    const hasShoes = !!this.registry.get('hasRunningShoes');
    const running  = hasShoes && this.shiftKey.isDown && this.isMoving;
    const speed    = running ? this.RUN_SPEED : this.BASE_SPEED;
    this.shoesText.setVisible(running);

    if (this.isMoving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len; dy /= len;

      const nx = this.px + dx * speed * dt;
      const ny = this.py + dy * speed * dt;
      if (!this.collidesAt(nx, this.py)) this.px = nx;
      if (!this.collidesAt(this.px, ny)) this.py = ny;

      this.walkTimer += delta;
      if (this.walkTimer > (running ? 100 : 180)) {
        this.walkFrame = this.walkFrame === 0 ? 1 : 0;
        this.walkTimer = 0;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    this.drawCharacter();
    this.updateMiniMapDot();
    this.updateLocationText();
    this.checkBuildingDoors();
    this.checkTownExit();
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  saveGame() {
    SaveManager.save(this.registry, this.px, this.py);
    this.tweens.add({
      targets: this.saveToast,
      alpha: { from: 0, to: 1 },
      duration: 300, yoyo: true, hold: 1200,
      onComplete: () => this.saveToast.setAlpha(0),
    });
  }

  private checkBuildingDoors() {
    let near: BuildingDef | null = null;
    for (const b of BUILDINGS) {
      const doorX = b.doorCol * TILE + TILE / 2;
      const doorY = b.doorRow * TILE + TILE / 2;
      if (Math.hypot(this.px - doorX, this.py - doorY) < TILE * 1.4) {
        near = b; break;
      }
    }

    if (near) {
      this.enterPrompt.setText(`SPACE — Enter ${near.label}`).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.registry.set('returnX', near.doorCol * TILE + TILE / 2);
        this.registry.set('returnY', (near.doorRow + 1) * TILE + TILE / 2);
        SaveManager.save(this.registry, this.px, this.py);
        this.cameras.main.fadeOut(400, 0, 0, 0, () => {
          this.scene.start(near!.scene);
        });
      }
    } else {
      this.enterPrompt.setVisible(false);
    }
  }

  private collidesAt(x: number, y: number): boolean {
    const half = this.PW / 2 - 2;
    const corners = [
      [x - half, y - 4], [x + half, y - 4],
      [x - half, y + 8], [x + half, y + 8],
    ];
    return corners.some(([cx, cy]) => {
      const col = Math.floor(cx / TILE);
      const row = Math.floor(cy / TILE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      return SOLID.has(this.map[row][col]);
    });
  }

  private updateMiniMapDot() {
    const MM = 3;
    const mmX = 800 - COLS * MM - 10;
    const mmY = 10;
    // Redraw just the dot (erase old, draw new)
    this.miniMapGraphics.fillStyle(0xff0000, 1);
    this.miniMapGraphics.fillRect(
      mmX + (this.px / TILE) * MM - 2,
      mmY + (this.py / TILE) * MM - 2,
      4, 4
    );
  }

  private updateLocationText() {
    const col = Math.floor(this.px / TILE);
    const row = Math.floor(this.py / TILE);
    const tile = this.map[row]?.[col];
    let zone = 'Waterfall City';
    if (tile === T.MOUNTAIN) zone = 'Mt. Bukhan';
    else if (tile === T.TREE && row < 10) zone = 'Waterfall Trail';
    else if (tile === T.WATER) zone = 'Waterfall River';
    else if (tile === T.PARK || tile === T.FLOWER) zone = 'Central Park';
    else if (tile === T.ROAD_H || tile === T.ROAD_V || tile === T.ROAD_X) zone = 'Main Street';
    else if (tile === T.BUILDING || tile === T.ROOF) zone = 'Residential Area';
    else if (row > 46) zone = 'Route 1 → Capitol City';
    this.locationText.setText(`📍 ${zone}`);
  }

  // ── Town exit / rival cutscene ────────────────────────────────────────────
  private checkTownExit() {
    const row = Math.floor(this.py / TILE);
    const rivalDone     = !!this.registry.get('rivalBattleDone');
    const starterChosen = !!this.registry.get('starterChosen');

    // First exit attempt → rival battle
    if (!rivalDone && starterChosen && row >= 46) {
      this.triggerRivalCutscene();
      return;
    }

    // After rival battle → enter Route 1 at the south wilderness
    if (rivalDone && row >= 56 && !this.cutsceneActive) {
      this.cutsceneActive = true;  // prevent multi-frame retrigger
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.scene.start('RouteScene');
      });
    }
  }

  private triggerRivalCutscene() {
    this.cutsceneActive = true;

    // Minhyuk runs in from the right — animation only, dialog happens inside RivalBattleScene
    const minhyuk = this.add.graphics().setDepth(25);
    minhyuk.setPosition(this.px + 320, this.py);
    this.drawMinhyukSprite(minhyuk);

    this.tweens.add({
      targets: minhyuk,
      x: this.px + 64,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        // Brief pause so the player sees Minhyuk arrive, then cut to battle
        this.time.delayedCall(500, () => {
          this.cameras.main.fadeOut(400, 0, 0, 0, () => {
            this.scene.start('RivalBattleScene');
          });
        });
      },
    });
  }

  private drawMinhyukSprite(g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 18, 6);
    // Shoes
    g.fillStyle(0xffffff, 1); g.fillRect(-8, 9, 6, 5); g.fillRect(3, 6, 6, 5);
    // Legs
    g.fillStyle(0x223366, 1); g.fillRect(-7, 2, 4, 8); g.fillRect(4, -1, 4, 8);
    // Body (blue jacket)
    g.fillStyle(0x1133aa, 1); g.fillRect(-8, -8, 16, 11);
    g.fillStyle(0x1133aa, 1); g.fillRect(-12, -7, 5, 9); g.fillRect(7, -7, 5, 9);
    g.fillStyle(0xffffff, 1); g.fillRect(-2, -8, 4, 5);
    // Head
    g.fillStyle(0xffcc99, 1); g.fillRect(-7, -22, 14, 13);
    g.fillStyle(0x110022, 1); g.fillRect(-7, -22, 14, 5);
    // Eyes
    g.fillStyle(0x000000, 1); g.fillRect(-5, -16, 2, 2);
    // Name tag
    g.fillStyle(0x000000, 0.7); g.fillRoundedRect(-20, -36, 40, 12, 3);
    // (text rendered separately since Graphics can't draw text)
    this.add.text(g.x, g.y - 30, 'Minhyuk', {
      fontSize: '10px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(26);
  }
}
