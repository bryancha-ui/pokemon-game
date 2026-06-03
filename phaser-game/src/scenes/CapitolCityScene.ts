import Phaser from 'phaser';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';

// ── City tile types ────────────────────────────────────────────────────────────
const C = {
  ROAD:      0, SIDEWALK:  1, BUILDING:  2, TOWER:    3,
  WATER:     4, PARK:      5, PALACE:    6, WALL:     7,
  TREE:      8, PLAZA:     9, BRIDGE:    10, GRASS:   11,
} as const;
type CTile = typeof C[keyof typeof C];

const TILE  = 32;
const CCOLS = 48;
const CROWS = 72;

const CITY_COLORS: Record<CTile, number> = {
  [C.ROAD]:     0x5a5a5a,
  [C.SIDEWALK]: 0x9a9a8a,
  [C.BUILDING]: 0x7a8a9a,
  [C.TOWER]:    0x4a5a6a,
  [C.WATER]:    0x3399dd,
  [C.PARK]:     0x44aa44,
  [C.PALACE]:   0xd4a870,
  [C.WALL]:     0xa07040,
  [C.TREE]:     0x228822,
  [C.PLAZA]:    0xccbbaa,
  [C.BRIDGE]:   0x8a7060,
  [C.GRASS]:    0x55aa44,
};
const SOLID_C: Set<CTile> = new Set([C.BUILDING, C.TOWER, C.WATER, C.WALL]);

function buildCityMap(): CTile[][] {
  const R = C.ROAD, SW = C.SIDEWALK, B = C.BUILDING, T = C.TOWER,
        W = C.WATER, PK = C.PARK, PA = C.PALACE, WL = C.WALL,
        TR = C.TREE, PL = C.PLAZA, BR = C.BRIDGE, G = C.GRASS;

  const map: CTile[][] = Array.from({ length: CROWS }, () =>
    Array(CCOLS).fill(SW) as CTile[],
  );

  const fill = (r1: number, c1: number, r2: number, c2: number, t: CTile) => {
    for (let r = r1; r < r2; r++)
      for (let c = c1; c < c2; c++)
        if (r >= 0 && r < CROWS && c >= 0 && c < CCOLS) map[r][c] = t;
  };

  // ── Outer boundary trees ──────────────────────────────────────────────────
  fill(0, 0, CROWS, 2, TR); fill(0, CCOLS - 2, CROWS, CCOLS, TR);
  fill(0, 0, 2, CCOLS, TR); fill(CROWS - 2, 0, CROWS, CCOLS, TR);

  // ── Main N-S boulevard (cols 22-25) ──────────────────────────────────────
  fill(0, 22, CROWS, 26, R);

  // ── E-W cross roads ────────────────────────────────────────────────────────
  fill(16, 2, 18, CCOLS - 2, R);   // gym approach road
  fill(34, 2, 36, CCOLS - 2, R);   // central road
  fill(51, 2, 53, CCOLS - 2, R);   // southern road

  // ── GYM district (rows 2-14) ─────────────────────────────────────────────
  fill(2, 2, 14, CCOLS - 2, PL);  // gym plaza
  fill(3, 14, 15, 34, B);          // GYM building
  // Gym entrance gap
  for (let c = 22; c < 26; c++) map[14][c] = PL;  // door tiles

  // Gym battle floor marker
  for (let c = 18; c < 30; c++) map[5][c] = PL;
  for (let c = 18; c < 30; c++) map[6][c] = PL;

  // ── Tower district (rows 18-33) ──────────────────────────────────────────
  fill(18, 2, 33, CCOLS - 2, SW);
  fill(19, 31, 33, 44, T);          // Capitol Tower

  // Tower entrance gap
  for (let c = 36; c < 40; c++) map[32][c] = SW;

  // ── Ancient Palace (rows 18-30, cols 3-21) ───────────────────────────────
  fill(18, 3, 31, 21, WL);           // outer palace wall
  fill(19, 4, 30, 20, PA);           // palace grounds
  for (let c = 11; c < 13; c++) map[30][c] = SW;  // palace gate

  // ── Han River (rows 36-43) ───────────────────────────────────────────────
  fill(36, 2, 43, CCOLS - 2, W);
  // Bridges
  fill(36, 21, 43, 27, BR);     // main bridge

  // ── Commercial district (rows 43-53) ─────────────────────────────────────
  fill(43, 2, 53, CCOLS - 2, SW);
  // Pokémon Center block
  fill(44, 3, 52, 13, B);
  for (let c = 7; c < 9; c++) map[51][c] = SW;   // PC door

  // Shops row (east side)
  fill(44, 27, 52, 44, B);
  for (let c = 35; c < 37; c++) map[51][c] = SW;  // shop door

  // Market row (west)
  fill(44, 15, 52, 21, B);
  for (let c = 17; c < 19; c++) map[51][c] = SW;  // market door

  // ── Central plaza (rows 53-58) ────────────────────────────────────────────
  fill(53, 2, 58, CCOLS - 2, PL);
  // Fountain (center)
  fill(54, 22, 57, 26, W);
  map[55][23] = W; map[55][24] = W;

  // Benches & trees in plaza
  [[54,5],[54,10],[54,36],[54,41],[56,5],[56,10],[56,36],[56,41]].forEach(
    ([r, c]) => { map[r][c] = TR; }
  );

  // ── South residential (rows 58-68) ───────────────────────────────────────
  fill(58, 2, 68, CCOLS - 2, SW);
  // Apartment blocks
  [[59,3,67,8],[59,10,67,15],[59,28,67,34],[59,36,67,42]].forEach(
    ([r1,c1,r2,c2]) => fill(r1,c1,r2,c2,B)
  );
  // Parks
  fill(59, 17, 68, 26, PK);
  fill(59, 44, 68, CCOLS - 2, PK);
  // Park trees
  [[60,18],[60,22],[63,19],[63,23],[65,20]].forEach(([r,c]) => { map[r][c] = TR; });

  // ── Entry boulevard (rows 68-70) ─────────────────────────────────────────
  fill(68, 2, 70, CCOLS - 2, R);

  // ── Entry arch markers ────────────────────────────────────────────────────
  fill(69, 2, CROWS - 2, CCOLS - 2, SW);
  for (let c = 22; c < 26; c++) map[70][c] = R;

  // Stamp roads back on top
  for (let r = 0; r < CROWS; r++) {
    for (let c = 22; c <= 25; c++) map[r][c] = R;
  }
  fill(16, 2, 18, CCOLS - 2, R);
  fill(34, 2, 36, CCOLS - 2, R);
  fill(51, 2, 53, CCOLS - 2, R);
  fill(68, 2, 70, CCOLS - 2, R);

  void G; void T;
  return map;
}

// ── Special locations ─────────────────────────────────────────────────────────
interface CityLocation {
  label: string;
  scene: string;
  doorRow: number; doorCol: number;
  x: number; y: number; w: number; h: number;
  roofColor: number; wallColor: number;
}

const LOCATIONS: CityLocation[] = [
  { label: "Pokémon Center",   scene: 'CapitolPCScene',
    doorRow: 51, doorCol: 7,
    x: 3, y: 44, w: 10, h: 8, roofColor: 0xcc2244, wallColor: 0xffffff },
  { label: "Capitol Tower",    scene: 'CapitolTowerScene',
    doorRow: 32, doorCol: 37,
    x: 31, y: 19, w: 13, h: 14, roofColor: 0x1144cc, wallColor: 0x445566 },
  { label: "Ancient Palace",   scene: 'CapitolPalaceScene',
    doorRow: 30, doorCol: 11,
    x: 3, y: 18, w: 18, h: 13, roofColor: 0x8a4a1a, wallColor: 0xd4a870 },
  { label: "Central Market",   scene: 'CapitolMarketScene',
    doorRow: 51, doorCol: 17,
    x: 15, y: 44, w: 6, h: 8, roofColor: 0xee8833, wallColor: 0xffcc88 },
  { label: "Capitol GYM",      scene: 'CapitolGymScene',
    doorRow: 14, doorCol: 23,
    x: 14, y: 3, w: 20, h: 12, roofColor: 0x222266, wallColor: 0x334477 },
];

// ── Scene ─────────────────────────────────────────────────────────────────────
export class CapitolCityScene extends Phaser.Scene {
  private map!: CTile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private interactKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private enterPrompt!: Phaser.GameObjects.Text;
  private locationText!: Phaser.GameObjects.Text;

  private px = 24 * TILE + 16;
  private py = 69 * TILE + 16;   // start near south entrance
  private facing = 0; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private readonly SPEED = 120;
  private readonly RUN_SPEED = 260;

  constructor() { super('CapitolCityScene'); }

  preload() {
    if (!this.textures.exists('corrpanda'))
      this.load.image('corrpanda', '/assets/corrpanda.png');
  }

  create() {
    this.cutsceneActive = false;
    this.walkFrame = 0; this.walkTimer = 0;
    this.input.keyboard?.resetKeys();

    // Restore position
    const rx = this.registry.get('capitalReturnX') as number | undefined;
    const ry = this.registry.get('capitalReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('capitalReturnX'); this.registry.remove('capitalReturnY');

    this.map = buildCityMap();
    this.drawCity();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.addCityLabels();

    this.cameras.main.fadeIn(500);
    SaveManager.save(this.registry, this.px, this.py, 'CapitolCityScene');

    // Arrival message (first time only)
    if (!this.registry.get('visitedCapitol')) {
      this.registry.set('visitedCapitol', true);
      this.time.delayedCall(800, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'You have arrived at Capitol City!',
          'This vast capital holds the heart of the nation.',
          'Explore the city, visit the Capitol Tower,\nand challenge the Capitol Gym!',
          'The Gym Leader Jin awaits at the northern gym.\nPrepare well — her shadow Pokémon are powerful.',
        ], () => { this.cutsceneActive = false; });
      });
    }
  }

  // ── Map drawing ───────────────────────────────────────────────────────────

  private drawCity() {
    const g = this.make.graphics({ x: 0, y: 0 });

    for (let r = 0; r < CROWS; r++) {
      for (let c = 0; c < CCOLS; c++) {
        const tile = this.map[r][c];
        g.fillStyle(CITY_COLORS[tile], 1);
        g.fillRect(c * TILE, r * TILE, TILE, TILE);

        // Details
        if (tile === C.TREE) this.drawTree(g, c * TILE + 16, r * TILE + 16);
        if (tile === C.WATER) this.drawWater(g, c * TILE, r * TILE, c, r);
        if (tile === C.ROAD)  this.drawRoadMarkings(g, c * TILE, r * TILE, c, r);
        if (tile === C.BUILDING) this.drawBuilding(g, c * TILE, r * TILE);
        if (tile === C.TOWER) this.drawSkyscraper(g, c * TILE, r * TILE);
      }
    }

    const texKey = '__capitalMap__';
    if (this.textures.exists(texKey)) this.textures.remove(texKey);
    g.generateTexture(texKey, CCOLS * TILE, CROWS * TILE);
    g.destroy();
    this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);

    // Building overlays with roofs and signs
    this.drawBuildings();
  }

  private drawTree(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x1a5c1a); g.fillTriangle(x, y - 12, x - 9, y + 6, x + 9, y + 6);
    g.fillStyle(0x4a3020); g.fillRect(x - 3, y + 6, 6, 6);
  }
  private drawWater(g: Phaser.GameObjects.Graphics, x: number, y: number, c: number, r: number) {
    g.fillStyle(0x55aaee, 0.6);
    const o = (c + r) % 3;
    g.fillRect(x + o * 6, y + 8, 12, 3); g.fillRect(x + o * 4 + 2, y + 18, 10, 3);
  }
  private drawRoadMarkings(g: Phaser.GameObjects.Graphics, x: number, y: number, c: number, _r: number) {
    if (c % 4 === 0) { g.fillStyle(0xffff88, 0.5); g.fillRect(x + 14, y, 4, TILE); }
  }
  private drawBuilding(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    // Windows
    g.fillStyle(0xaabbcc, 0.4);
    for (let wy = 4; wy < TILE - 4; wy += 10)
      for (let wx = 4; wx < TILE - 4; wx += 9)
        g.fillRect(x + wx, y + wy, 6, 7);
  }
  private drawSkyscraper(g: Phaser.GameObjects.Graphics, x: number, y: number) {
    g.fillStyle(0x778899, 0.3);
    for (let wy = 2; wy < TILE - 2; wy += 8)
      for (let wx = 2; wx < TILE - 2; wx += 8)
        g.fillRect(x + wx, y + wy, 5, 5);
    g.fillStyle(0x99ccff, 0.2); g.fillRect(x, y, TILE, 4);
  }

  private drawBuildings() {
    const g = this.add.graphics().setDepth(2);
    for (const loc of LOCATIONS) {
      const x = loc.x * TILE, y = loc.y * TILE;
      const w = loc.w * TILE, h = loc.h * TILE;
      g.fillStyle(loc.wallColor); g.fillRect(x, y, w, h);
      g.lineStyle(2, 0x222222); g.strokeRect(x, y, w, h);
      // Roof
      g.fillStyle(loc.roofColor);
      g.fillTriangle(x - 4, y, x + w / 2, y - TILE * 1.5, x + w + 4, y);
      // Windows
      g.fillStyle(0x88ccff, 0.7);
      for (let wx = 6; wx < w - 6; wx += 18)
        for (let wy = 10; wy < h - 10; wy += 18)
          g.fillRect(x + wx, y + wy, 12, 14);
      // Door
      const dx = loc.doorCol * TILE;
      const dy = (loc.y + loc.h - 1) * TILE;
      g.fillStyle(0x8b4513); g.fillRect(dx + 4, dy, TILE - 8, TILE);
      g.fillStyle(0xddaa44); g.fillCircle(dx + TILE - 10, dy + TILE / 2, 3);

      // Label
      this.add.text((loc.x + loc.w / 2) * TILE, (loc.y - 1.8) * TILE, loc.label, {
        fontSize: '9px', color: '#fff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
      }).setOrigin(0.5, 1).setDepth(3);
    }
  }

  private addCityLabels() {
    const lbl = (text: string, col: number, row: number, size = 8) =>
      this.add.text(col * TILE, row * TILE, text, {
        fontSize: `${size}px`, color: '#222', backgroundColor: '#ffffff88', padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(4);

    lbl('Capitol City\n수도시', 24, 72 - 3, 10);
    lbl('Han River', 24, 39);
    lbl('Central Plaza', 24, 55);
    lbl('Residential District', 38, 62);
  }

  // ── Player ────────────────────────────────────────────────────────────────
  private createPlayer() {
    this.playerG = this.add.graphics().setDepth(20);
    this.drawChar();
  }
  private drawChar() {
    const g = this.playerG; g.clear();
    const f = this.walkFrame, flip = this.facing === 2;
    g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 18, 6);
    const lx = flip ? 3 : -8, rx = flip ? -8 : 3;
    const ly = f === 0 ? 9 : 6, ry = f === 0 ? 6 : 9;
    g.fillStyle(0x222222); g.fillRect(lx, ly, 6, 5); g.fillRect(rx, ry, 6, 5);
    g.fillStyle(0x1a1a6e); g.fillRect(lx + 1, ly - 7, 4, 8); g.fillRect(rx + 1, ry - 7, 4, 8);
    g.fillStyle(0xcc2222); g.fillRect(-8, -8, 16, 11);
    g.fillStyle(0xcc2222); g.fillRect(-12, -7, 5, 9); g.fillRect(7, -7, 5, 9);
    g.fillStyle(0xffffff); g.fillRect(-2, -8, 4, 4);
    g.fillStyle(0xffcc99); g.fillRect(-7, -22, 14, 12);
    g.fillStyle(0x1a1008); g.fillRect(-7, -22, 14, 5);
    g.fillStyle(0x000000); g.fillRect(-4, -16, 2, 2); g.fillRect(2, -16, 2, 2);
    g.setPosition(this.px, this.py);
  }

  private setupCamera() {
    this.cameras.main.setBounds(0, 0, CCOLS * TILE, CROWS * TILE);
    this.cameras.main.setZoom(1.5);
    this.cameras.main.startFollow(this.playerG, true, 0.08, 0.08);
  }

  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.shiftKey    = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.on('keydown-M', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
    this.input.keyboard!.on('keydown-B', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }

  private createUI() {
    this.dialog = new DialogBox(this, 1280, 720);
    this.add.rectangle(640, 22, 420, 34, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.locationText = this.add.text(640, 22, '🏙 Capitol City', {
      fontSize: '15px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.enterPrompt = this.add.text(640, 690, '', {
      fontSize: '14px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false);
    this.add.text(640, 710, 'WASD: move  SPACE: enter  M: menu  SHIFT: run', {
      fontSize: '10px', color: '#ccc', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

  // ── Update ────────────────────────────────────────────────────────────────
  update(_: number, delta: number) {
    if (this.cutsceneActive) {
      if (this.dialog.isInChoice()) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up))    this.dialog.navigateChoice(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down))  this.dialog.navigateChoice(1);
        if (Phaser.Input.Keyboard.JustDown(this.interactKey))   this.dialog.confirmChoice();
      } else if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this.dialog.advance();
      }
      return;
    }

    const dt = delta / 1000;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx =  1; this.facing = 3; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy =  1; this.facing = 0; }

    const moving = dx !== 0 || dy !== 0;
    const running = moving && !!this.registry.get('hasRunningShoes') && this.shiftKey.isDown;
    const speed   = running ? this.RUN_SPEED : this.SPEED;

    if (moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = this.px + (dx / len) * speed * dt;
      const ny = this.py + (dy / len) * speed * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      if (!this.collides(this.px, ny)) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else { this.walkFrame = 0; }

    this.drawChar();
    this.checkBuildings();
    this.checkSouthExit();
    this.locationText.setText(`🏙 Capitol City${this.py < 20 * TILE ? ' — Gym District' : this.py < 40 * TILE ? ' — Tower Quarter' : this.py < 55 * TILE ? ' — Commercial' : ''}`);
  }

  private collides(x: number, y: number): boolean {
    const hw = 6;
    const pts = [[x - hw, y - 4], [x + hw, y - 4], [x - hw, y + 8], [x + hw, y + 8]];
    return pts.some(([cx, cy]) => {
      const col = Math.floor(cx / TILE), row = Math.floor(cy / TILE);
      if (col < 0 || col >= CCOLS || row < 0 || row >= CROWS) return true;
      return SOLID_C.has(this.map[row][col]);
    });
  }

  private checkBuildings() {
    let near: CityLocation | null = null;
    for (const loc of LOCATIONS) {
      const dx2 = this.px - (loc.doorCol * TILE + TILE / 2);
      const dy2 = this.py - (loc.doorRow * TILE + TILE / 2);
      if (Math.sqrt(dx2 * dx2 + dy2 * dy2) < TILE * 1.4) { near = loc; break; }
    }
    if (near) {
      this.enterPrompt.setText(`SPACE — Enter ${near.label}`).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        const loc = near;
        this.registry.set('capitalReturnX', loc.doorCol * TILE + TILE / 2);
        this.registry.set('capitalReturnY', (loc.doorRow + 1) * TILE + TILE / 2);
        this.cutsceneActive = true;
        this.cameras.main.fadeOut(400, 0, 0, 0, () => {
          this.scene.start(loc.scene);
        });
      }
    } else {
      this.enterPrompt.setVisible(false);
    }
  }

  private checkSouthExit() {
    if (this.py > (CROWS - 2) * TILE && !this.cutsceneActive) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('routeReturnX', 13 * 32 + 16);
        this.registry.set('routeReturnY', 76 * 32 + 16);
        this.scene.start('RouteScene');
      });
    }
  }
}
