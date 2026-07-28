import Phaser from 'phaser';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';

// ── 노스단 아지트 (Team North Headquarters) ─────────────────────────────────────────
// A grim four-storey tower that 노스단 has thrown up at the front of Samjiyon's mountain
// road, declaring the plateau their new base. Each floor is a warren of warp-pad tricks
// and grunts blocking the stairs; climb all four and defeat the 노스단 간부 at the very top
// to break their hold — only then will 어사대장 Seolwon grant her exam.

const T = { WALL: 0, FLOOR: 1, WARP: 2, STAIRS: 3 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 13, ROWS = 13;
const SOLID = new Set<Tile>([T.WALL]);
const BOSS_KEY = 'nosdan-samjiyon-boss';   // a normal-scale trainer battle (no 우두머리 aura / HP buff)

interface Foe { key: string; name: string; label: string; col: number; row: number; line: string; pokemon: string; expPool: number; boss?: boolean; }
interface Warp { col: number; row: number; toCol: number; toRow: number; }
interface FloorDef { corridorCol: number; walls: [number, number, number, number][]; warps: Warp[]; foes: Foe[]; }

const FLOORS: FloorDef[] = [
  // ── 1F ── one true warp (west) lifts you to the stair corridor; the east pad loops back.
  {
    corridorCol: 3,
    walls: [[8, 12, 6, 7]],
    warps: [
      { col: 2, row: 9, toCol: 3, toRow: 5 },     // correct
      { col: 10, row: 9, toCol: 8, toRow: 11 },   // trap → back toward the entrance (a floor tile, not a wall)
    ],
    foes: [
      { key: 'nosdan-ajit-1a', name: '노스단 Grunt', col: 3, row: 3, label: '노스단',
        line: "Far as you climb, runt. 노스단 owns this tower now — and soon all of Samjiyon!",
        pokemon: JSON.stringify([{ id: 461, level: 72 }, { id: 553, level: 72 }]), expPool: 2400 },
    ],
  },
  // ── 2F ── the centre pad is the way up; both side pads dump you back down.
  {
    corridorCol: 9,
    walls: [[8, 11, 4, 5], [8, 11, 8, 9]],
    warps: [
      { col: 2, row: 9, toCol: 6, toRow: 11 },    // trap
      { col: 6, row: 8, toCol: 9, toRow: 5 },     // correct
      { col: 10, row: 9, toCol: 2, toRow: 11 },   // trap
    ],
    foes: [
      { key: 'nosdan-ajit-2a', name: '노스단 Grunt', col: 5, row: 10, label: '노스단',
        line: "You slipped past the first floor? The warps here'll spin your head — but I'll stop you first!",
        pokemon: JSON.stringify([{ id: 430, level: 72 }, { id: 302, level: 73 }]), expPool: 2500 },
      { key: 'nosdan-ajit-2b', name: '노스단 Grunt', col: 9, row: 3, label: '노스단',
        line: "Nobody reaches the stairs. Those are the 간부's orders. Back down with you!",
        pokemon: JSON.stringify([{ id: 227, level: 73 }, { id: 452, level: 73 }]), expPool: 2500 },
    ],
  },
  // ── 3F ── a split wall funnels you through a warp; two grunts hold the choke.
  {
    corridorCol: 6,
    walls: [[8, 9, 2, 6], [8, 9, 7, 11]],
    warps: [
      { col: 2, row: 10, toCol: 6, toRow: 11 },   // trap
      { col: 6, row: 9, toCol: 6, toRow: 5 },      // correct (reached through the gap)
      { col: 10, row: 10, toCol: 6, toRow: 11 },   // trap
    ],
    foes: [
      { key: 'nosdan-ajit-3a', name: '노스단 Grunt', col: 6, row: 9, label: '노스단',
        line: "The gap's mine to guard. Beat me or wander these warps till you starve!",
        pokemon: JSON.stringify([{ id: 454, level: 73 }, { id: 560, level: 73 }]), expPool: 2600 },
      { key: 'nosdan-ajit-3b', name: '노스단 Grunt', col: 6, row: 3, label: '노스단',
        line: "One floor from the 간부. You'll go no further — 노스단 rises here!",
        pokemon: JSON.stringify([{ id: 625, level: 73 }, { id: 614, level: 74 }]), expPool: 2600 },
    ],
  },
  // ── 4F ── the top. One last grunt, then the 노스단 간부 blocking the stairs to the roof.
  {
    corridorCol: 6,
    walls: [[8, 11, 3, 4], [8, 11, 9, 10]],
    warps: [
      { col: 3, row: 9, toCol: 6, toRow: 11 },     // trap
      { col: 9, row: 9, toCol: 6, toRow: 5 },      // correct
    ],
    foes: [
      { key: 'nosdan-ajit-4a', name: '노스단 Grunt', col: 6, row: 8, label: '노스단',
        line: "The 간부 is just above. Over my body — that's the only way up!",
        pokemon: JSON.stringify([{ id: 584, level: 74 }, { id: 615, level: 74 }]), expPool: 2700 },
      { key: BOSS_KEY, name: 'Sovereign Clemont', col: 6, row: 3, label: 'Sovereign', boss: true,
        line: "So the 어사대's little champion crawls to the top. I am Clemont — Sovereign of 노스단. We will take Samjiyon, the peak, and everything beyond it. You end HERE.",
        pokemon: JSON.stringify([{ id: 461, level: 75 }, { id: 473, level: 75 }, { id: 452, level: 76 }, { id: 625, level: 76 }, { id: 614, level: 77 }]), expPool: 4800 },
    ],
  },
];

export class NosdanHideoutScene extends Phaser.Scene {
  private map!: Tile[][];
  private def!: FloorDef;
  private floor = 1;
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private px = 7 * TILE + 16;
  private py = 11 * TILE + 16;   // bottom-centre entrance — a floor tile on all 4 floors
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false;
  private warpCooldown = 0;
  private stairGuard = false;

  constructor() { super('NosdanHideoutScene'); }

  create() {
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0; this.warpCooldown = 0; this.stairGuard = false;
    playBgm(this, 'headquarternorth');
    this.input.keyboard?.resetKeys();

    this.floor = (this.registry.get('hideoutFloor') as number) ?? 1;
    this.def = FLOORS[this.floor - 1];
    this.map = this.buildGrid(this.def);

    // Restore position after a battle; otherwise start at the floor's entrance.
    const rx = this.registry.get('nosdanReturnX') as number | undefined;
    const ry = this.registry.get('nosdanReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    else { this.px = 7 * TILE + 16; this.py = 11 * TILE + 16; }
    this.registry.remove('nosdanReturnX'); this.registry.remove('nosdanReturnY');
    this.ensureOnFloor();   // never strand the player inside a wall (each floor differs)

    this.spawnGuard = true;
    this.time.delayedCall(400, () => { this.spawnGuard = false; });

    this.drawMap();
    this.drawFoes();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(300);
    SaveManager.save(this.registry, this.px, this.py, 'NosdanHideoutScene');

    // Returning victorious from the 간부 at the top → the hold is broken.
    if (this.floor === 4 && this.registry.get(`trainerDefeated_${BOSS_KEY}`)) this.victory();
  }

  /** If the spawn/return point landed on a solid tile, spiral outward to the nearest floor tile. */
  private ensureOnFloor() {
    if (!this.collides(this.px, this.py)) return;
    for (let radius = 1; radius <= COLS; radius++) {
      for (let dr = -radius; dr <= radius; dr++) for (let dc = -radius; dc <= radius; dc++) {
        const col = Math.floor(this.px / TILE) + dc, row = Math.floor(this.py / TILE) + dr;
        if (col < 1 || col >= COLS - 1 || row < 1 || row >= ROWS - 1) continue;
        const x = col * TILE + 16, y = row * TILE + 16;
        if (!this.collides(x, y)) { this.px = x; this.py = y; return; }
      }
    }
  }

  private buildGrid(def: FloorDef): Tile[][] {
    const g: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.FLOOR) as Tile[]);
    const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
      for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) g[r][c] = t;
    };
    fill(0, 1, 0, COLS, T.WALL); fill(ROWS - 1, ROWS, 0, COLS, T.WALL);     // top/bottom border
    fill(0, ROWS, 0, 1, T.WALL); fill(0, ROWS, COLS - 1, COLS, T.WALL);     // side border
    fill(6, 7, 1, COLS - 1, T.WALL);                                        // divider between lower room & upper corridor
    fill(1, 6, 1, COLS - 1, T.WALL);                                        // upper is solid…
    for (let r = 2; r <= 5; r++) g[r][def.corridorCol] = T.FLOOR;           // …except the stair corridor
    g[1][def.corridorCol] = T.STAIRS;
    for (const [r1, r2, c1, c2] of def.walls) fill(r1, r2, c1, c2, T.WALL); // lower-room maze walls
    for (const w of def.warps) g[w.row][w.col] = T.WARP;
    return g;
  }

  // ── Draw ──────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c]; const x = c * TILE, y = r * TILE;
      if (t === T.WALL) { g.fillStyle(0x1c1c26, 1); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x2a2a3a, 1); g.fillRect(x + 2, y + 2, TILE - 4, TILE - 6); g.fillStyle(0x3a1a2a, 1); g.fillRect(x + 6, y + 6, 4, 4); }
      else { g.fillStyle(0x3c3c48, 1); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x33333e, 1); g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2); g.lineStyle(1, 0x2a2a34, 0.8); g.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8); }
      if (t === T.WARP) { g.fillStyle(0x7a2ecc, 0.85); g.fillCircle(x + 16, y + 16, 11); g.fillStyle(0xc98cff, 0.9); g.fillCircle(x + 16, y + 16, 6); g.fillStyle(0xffffff, 0.7); g.fillCircle(x + 16, y + 16, 2.5); }
      if (t === T.STAIRS) { g.fillStyle(0xffd24a, 1); g.fillRect(x + 4, y + 4, TILE - 8, TILE - 8); g.fillStyle(0x8a6a10, 1); for (let i = 0; i < 3; i++) g.fillRect(x + 6, y + 8 + i * 6, TILE - 12, 3); }
    }
    const key = `__nosdanMap${this.floor}__`;
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    // stairs marker
    this.add.text(this.def.corridorCol * TILE + 16, 1 * TILE + 16, this.floor < 4 ? '▲' : '★', {
      fontSize: '12px', color: '#1a1a1a', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
  }

  private drawFoes() {
    for (const f of this.def.foes) {
      if (this.registry.get(`trainerDefeated_${f.key}`)) continue;   // beaten 노스단 clear out
      const g = this.add.graphics().setDepth(8);
      const s = f.boss ? 1.35 : 1;
      g.setPosition(f.col * TILE + 16, f.row * TILE + 16); g.setScale(s);
      g.fillStyle(0x000000, 0.25); g.fillEllipse(0, 13, 16, 5);
      g.fillStyle(0x24242e); g.fillRect(-7, -8, 14, 11); g.fillRect(-11, -7, 5, 8); g.fillRect(6, -7, 5, 8);
      g.fillStyle(0x0e0e16); g.fillRect(-6, 3, 5, 9); g.fillRect(1, 3, 5, 9);
      g.fillStyle(0xffcc99); g.fillRect(-6, -22, 12, 12);
      g.fillStyle(f.boss ? 0x7a1030 : 0x141420); g.fillRect(-6, -22, 12, 5);
      g.fillStyle(0x000000); g.fillRect(-3, -16, 2, 2); g.fillRect(1, -16, 2, 2);
      this.add.text(f.col * TILE + 16, f.row * TILE - (f.boss ? 22 : 16), f.label, {
        fontSize: f.boss ? '10px' : '8px', color: f.boss ? '#ff6a8a' : '#fff', fontStyle: f.boss ? 'bold' : 'normal',
        backgroundColor: '#00000099', padding: { x: 2, y: 1 },
      }).setOrigin(0.5).setDepth(9);
    }
  }

  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.drawChar(); }
  private drawChar() { drawTrainerBody(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry)); this.playerG.setPosition(this.px, this.py); }
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(2);
    this.cameras.main.startFollow(this.playerG, true, 0.12, 0.12);
  }
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { up: this.input.keyboard!.addKey('W'), down: this.input.keyboard!.addKey('S'), left: this.input.keyboard!.addKey('A'), right: this.input.keyboard!.addKey('D') };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 380, 30, 0x000000, 0.65).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, `🏢 노스단 아지트 — ${this.floor}F / 4F`, {
      fontSize: '13px', color: '#ff8aa0', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, 'WASD: move  (warp pads teleport you)  SPACE: talk  M: menu', {
      fontSize: '10px', color: '#ccc', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

  // ── Update ──────────────────────────────────────────────────────────────
  update(_: number, delta: number) {
    if (this.cutsceneActive) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
      return;
    }
    if (this.warpCooldown > 0) this.warpCooldown -= delta;
    const dt = delta / 1000; let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx =  1; this.facing = 3; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy =  1; this.facing = 0; }
    const moving = dx !== 0 || dy !== 0;
    if (moving) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = this.px + (dx / len) * 120 * dt, ny = this.py + (dy / len) * 120 * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      if (!this.collides(this.px, ny)) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > 170) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else this.walkFrame = 0;
    this.drawChar();
    this.checkFoes();
    this.checkWarp();
    this.checkStairs();
  }
  private collides(x: number, y: number): boolean {
    const hw = 6;
    return [[x - hw, y - 4], [x + hw, y - 4], [x - hw, y + 8], [x + hw, y + 8]].some(([cx, cy]) => {
      const col = Math.floor(cx / TILE), row = Math.floor(cy / TILE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      return SOLID.has(this.map[row][col]);
    });
  }

  private checkFoes() {
    for (const f of this.def.foes) {
      if (this.registry.get(`trainerDefeated_${f.key}`)) continue;
      if (Math.hypot(this.px - (f.col * TILE + 16), this.py - (f.row * TILE + 16)) < TILE * 1.4) {
        this.cutsceneActive = true;
        this.registry.set('trainerName', f.name);
        this.registry.set('trainerKey', f.key);
        this.registry.set('trainerPokemon', f.pokemon);
        this.registry.set('trainerExpPool', f.expPool);
        this.registry.set('trainerReturnScene', 'NosdanHideoutScene');
        this.registry.set('hideoutFloor', this.floor);
        this.registry.set('nosdanReturnX', this.px); this.registry.set('nosdanReturnY', this.py);
        this.dialog.show([f.line, `${f.name}: 배틀이다!`], () => {
          this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return;
      }
    }
  }

  private checkWarp() {
    if (this.warpCooldown > 0) return;
    const col = Math.floor(this.px / TILE), row = Math.floor(this.py / TILE);
    if (this.map[row]?.[col] !== T.WARP) return;
    const w = this.def.warps.find(w => w.col === col && w.row === row);
    if (!w) return;
    this.warpCooldown = 600;
    this.cameras.main.flash(220, 120, 40, 200);
    this.px = w.toCol * TILE + 16; this.py = w.toRow * TILE + 16;
    this.drawChar();
  }

  private checkStairs() {
    if (this.spawnGuard || this.stairGuard) return;
    const col = Math.floor(this.px / TILE), row = Math.floor(this.py / TILE);
    if (this.map[row]?.[col] !== T.STAIRS) return;
    this.stairGuard = true;
    if (this.floor < 4) {
      this.registry.set('hideoutFloor', this.floor + 1);
      this.registry.remove('nosdanReturnX'); this.registry.remove('nosdanReturnY');
      this.cameras.main.fadeOut(300, 0, 0, 0, () => this.scene.restart());
    } else {
      this.victory();
    }
  }

  private victory() {
    this.cutsceneActive = true;
    this.registry.remove('hideoutFloor');
    this.registry.remove('nosdanReturnX'); this.registry.remove('nosdanReturnY');
    this.dialog.show([
      'Sovereign Clemont: ...Impossible. The whole tower, floor by floor...',
      'The 노스단 flag is torn down. Their grip on Samjiyon is broken, and the grunts flee down the mountain road.',
      '어사대장 Seolwon now awaits your challenge at the 어사대 Hall.',
    ], () => {
      this.registry.set('SamjiyonCitySceneReturnX', 39 * 32 + 16);
      this.registry.set('SamjiyonCitySceneReturnY', 14 * 32 + 16);
      this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('SamjiyonCityScene'));
    });
  }
}
