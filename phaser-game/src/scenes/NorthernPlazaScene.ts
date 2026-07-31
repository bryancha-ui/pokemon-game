import Phaser from 'phaser';
import { tr, speakerName } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign, rivalDesign } from '../data/CharacterSprite';
import { markRivalPortrait } from '../data/BattlePortraits';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem } from '../systems/PartySystem';
import { mapaeCount, northernLeagueEligible } from '../data/Mapae';

// ── POST-GAME I — Northern League plaza (exterior) ───────────────────────────────
// The forecourt of the Northern League: an austere North-Korean-style communist
// palace — a colossal, symmetrical grey-granite monument with a colonnade, red
// state banners, a single gold star, and a stark signboard. The plaza holds a
// Pokémon Center, storage PC and Poké Mart. When you approach the doors, the Rival
// runs in for a send-off battle; only after beating them may you enter the hall.
// Entry requires all 8 마패s — the 7 regional ones plus the final one from Supreme Gwang.

const T = { GROUND: 0, WALL: 1, CARPET: 2, PAVE: 3 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 20, ROWS = 24;

const COLORS: Record<Tile, number> = {
  [T.GROUND]: 0x2e3038, [T.WALL]: 0x15161b, [T.CARPET]: 0x6e1216, [T.PAVE]: 0x3a3d45,
};
const SOLID = new Set<Tile>([T.WALL]);

const DOOR  = { col: 9, row: 8 };   // palace entrance (two tiles wide: col 9-10)
const NURSE = { col: 4,  row: 15 };
const MART  = { col: 16, row: 15 };
const PCBOX = { col: 16, row: 17 };

const RIVAL_CLOSER = '__rivalFinal__';
const RIVAL_TEAM = [
  { id: 0, level: 72, custom: 'corrpanda' },
  { id: 0, level: 73, custom: 'squirrel2' },
  { id: 0, level: 74, custom: 'martbadger' },
  { id: 0, level: 74, custom: 'chattyscream' },
  { id: 0, level: 74, custom: 'tokkigongju' },
  { id: 0, level: 75, custom: RIVAL_CLOSER },
];

export class NorthernPlazaScene extends Phaser.Scene {
  private map!: Tile[][];
  // Give the forecourt real 3D buildings: the grand hall gets the League model,
  // the Center/Mart kiosks reuse the Pokémon Center & mart models. Only these
  // named plots rise (their flat facades are hidden).
  public buildingPlots = [
    { x: 3,  y: 0,  w: 14, h: 8, model: 'league' },
    { x: 3,  y: 14, w: 3,  h: 3, model: 'pokecenter' },
    { x: 15, y: 14, w: 3,  h: 3, model: 'mart' },
  ];
  public onlyNamedBuildings = true;
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private enterPrompt!: Phaser.GameObjects.Text;
  private px = 10 * TILE + 16;
  private py = 20 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false;
  private rivalRunInStarted = false;
  private readonly SPEED = 130;

  constructor() { super('NorthernPlazaScene'); }

  private defeated(key: string) { return !!this.registry.get(`trainerDefeated_${key}`); }

  create() {

    playBgm(this, 'seolhwa');
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    this.rivalRunInStarted = false;
    this.input.keyboard?.resetKeys();
    this.spawnGuard = true;
    this.time.delayedCall(600, () => { this.spawnGuard = false; });

    this.px = 10 * TILE + 16; this.py = 20 * TILE + 16;
    const rx = this.registry.get('northPlazaReturnX') as number | undefined;
    const ry = this.registry.get('northPlazaReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('northPlazaReturnX'); this.registry.remove('northPlazaReturnY');

    this.map = buildMap();
    this.drawMap();
    this.drawPalace();
    this.drawKiosks();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'NorthernPlazaScene');

    if (!this.registry.get('northPlazaSeen')) {
      this.registry.set('northPlazaSeen', true);
      this.time.delayedCall(500, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'The Northern League rises before you — a colossal grey-granite palace, severe and symmetrical, banked with red banners under a single gold star. Trainers from a dozen regions cross the forecourt.',
          'Heal at the Center, stock up at the Mart, then approach the great doors when you are ready.',
        ], () => { this.cutsceneActive = false; });
      });
    }
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      g.fillStyle(COLORS[t], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (t === T.PAVE)   { g.fillStyle(0x30333b, 0.6); g.fillRect(c*TILE+1, r*TILE+1, TILE-2, TILE-2); }
      if (t === T.GROUND) { g.fillStyle(0x262830, 0.5); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4); }
      if (t === T.CARPET) { g.fillStyle(0x8a1218, 0.85); g.fillRect(c*TILE+5, r*TILE, TILE-10, TILE); }
    }
    const key = '__northPlazaMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);
  }

  /** The austere communist-palace facade drawn over the building mass (rows 0-7). */
  private drawPalace() {
    const g = this.add.graphics().setDepth(2);
    const x0 = 3 * TILE, y0 = 0, w = 14 * TILE, h = 8 * TILE;
    // Monolithic grey facade.
    g.fillStyle(0x2a2c33, 1); g.fillRect(x0, y0, w, h);
    g.fillStyle(0x33363e, 1); g.fillRect(x0 + 6, y0 + 6, w - 12, h - 12);
    // Colonnade — tall square pillars, evenly spaced, austere.
    g.fillStyle(0x20222a, 1);
    for (let i = 0; i < 7; i++) { const px = x0 + 22 + i * ((w - 44) / 6); g.fillRect(px - 6, y0 + 20, 12, h - 44); }
    // Entablature band.
    g.fillStyle(0x1a1c22, 1); g.fillRect(x0, y0 + 12, w, 8);
    // Red state banners hanging between pillars, each with a gold star.
    for (let i = 0; i < 6; i++) {
      const bx = x0 + 40 + i * ((w - 80) / 5);
      g.fillStyle(0x7c1414, 1); g.fillRect(bx - 7, y0 + 22, 14, h - 60);
    }
    // Doorway (dark opening + red carpet threshold).
    const dx = DOOR.col * TILE, dy = (DOOR.row - 1) * TILE;
    g.fillStyle(0x0a0b0f, 1); g.fillRect(dx - 4, dy - 10, TILE * 2 + 8, TILE + 10);
    g.fillStyle(0x8a1218, 1); g.fillRect(dx + 4, dy + TILE - 4, TILE * 2 - 8, 10);

    // Gold stars on the banners.
    for (let i = 0; i < 6; i++) {
      const bx = x0 + 40 + i * ((w - 80) / 5);
      this.add.text(bx, 3.4 * TILE, '★', { fontSize: '13px', color: '#ffe14a' }).setOrigin(0.5).setDepth(3);
    }
    // The great central gold star.
    this.add.text(10 * TILE, 1.5 * TILE, '★', { fontSize: '46px', color: '#ffe14a', stroke: '#7a5a00', strokeThickness: 4 }).setOrigin(0.5).setDepth(3);
    // Austere signboard above the door.
    this.add.text(10 * TILE, 7.1 * TILE, tr('북방 리그 · NORTHERN LEAGUE'), {
      fontSize: '11px', color: '#ffe88a', backgroundColor: '#000000aa', padding: { x: 6, y: 2 },
    }).setOrigin(0.5).setDepth(3);
  }

  private drawKiosks() {
    const label = (col: number, row: number, dy: number, text: string) =>
      this.add.text(col * TILE + 16, row * TILE + dy, text, {
        fontSize: '8px', color: '#fff', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
      }).setOrigin(0.5).setDepth(6);

    const nx = NURSE.col * TILE + 16, ny = NURSE.row * TILE + 16;
    const kb = this.add.graphics().setDepth(4);
    kb.fillStyle(0xe8e8ee); kb.fillRect(nx - 22, ny - 30, 44, 22);
    kb.fillStyle(0xcc2233); kb.fillTriangle(nx - 26, ny - 30, nx, ny - 44, nx + 26, ny - 30);
    kb.fillStyle(0xffffff); kb.fillRect(nx - 3, ny - 40, 6, 2); kb.fillRect(nx - 1, ny - 42, 2, 6);
    label(NURSE.col, NURSE.row, -34, '✚ Center');
    this.drawAttendant(nx, ny, 0xff7799);

    const mx = MART.col * TILE + 16, my = MART.row * TILE + 16;
    const mb = this.add.graphics().setDepth(4);
    mb.fillStyle(0xe8e8ee); mb.fillRect(mx - 22, my - 30, 44, 22);
    mb.fillStyle(0x2a6aca); mb.fillTriangle(mx - 26, my - 30, mx, my - 44, mx + 26, my - 30);
    label(MART.col, MART.row, -34, '🛒 Mart');
    this.drawAttendant(mx, my, 0x2a8a5a);

    const qx = PCBOX.col * TILE + 16, qy = PCBOX.row * TILE + 16;
    const pb = this.add.graphics().setDepth(4);
    pb.fillStyle(0x223044); pb.fillRect(qx - 12, qy - 20, 24, 20);
    pb.fillStyle(0x66ccff); pb.fillRect(qx - 8, qy - 16, 16, 10);
    label(PCBOX.col, PCBOX.row, -24, '💻 PC');
  }

  private drawAttendant(x: number, y: number, coat: number) {
    const g = this.add.graphics().setDepth(7);
    g.setPosition(x, y);
    g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 12, 14, 5);
    g.fillStyle(coat); g.fillRect(-7, -8, 14, 12);
    g.fillStyle(0xffcc99); g.fillRect(-6, -19, 12, 10);
    g.fillStyle(0x2a1c10); g.fillRect(-6, -20, 12, 5);
    g.fillStyle(0x000000); g.fillRect(-3, -14, 2, 2); g.fillRect(1, -14, 2, 2);
  }

  // ── Player / camera / input ──────────────────────────────────────────────
  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.drawChar(); }
  private drawChar() {
    drawTrainerBody(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry));
    this.playerG.setPosition(this.px, this.py);
  }
  private drawRivalSprite(g: Phaser.GameObjects.Graphics, x: number, y: number, frame: number) {
    drawTrainerBody(g, 2, frame, rivalDesign(this.registry));   // rival = opposite gender, running in facing left
    g.setPosition(x, y);
    markRivalPortrait(g, this.registry);
  }
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(1.6);
    this.cameras.main.startFollow(this.playerG, true, 0.1, 0.1);
  }
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { up: this.input.keyboard!.addKey('W'), down: this.input.keyboard!.addKey('S'), left: this.input.keyboard!.addKey('A'), right: this.input.keyboard!.addKey('D') };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 440, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, tr('🏯 Northern League — 북방 리그'), {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.enterPrompt = this.add.text(this.scale.width / 2, this.scale.height - 40, '', {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    this.add.text(this.scale.width / 2, this.scale.height - 8, tr('WASD: move  SPACE: enter / use  M: menu'), {
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
    this.checkRivalGate();
    this.checkInteractions();
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

  private doorDist() {
    const dx = (DOOR.col + 0.5) * TILE, dy = DOOR.row * TILE + 16;
    return Math.hypot(this.px - dx, this.py - dy);
  }

  // The rival runs in at the doors for the send-off battle (before rival-5 is beaten).
  private checkRivalGate() {
    if (this.cutsceneActive || this.spawnGuard || this.rivalRunInStarted) return;
    if (this.defeated('rival-5')) return;
    if (this.doorDist() < TILE * 3) this.triggerRivalRunIn();
  }

  private triggerRivalRunIn() {
    this.cutsceneActive = true;
    this.rivalRunInStarted = true;
    this.facing = 1; this.drawChar();

    const rg = this.add.graphics().setDepth(25);
    const tag = this.add.text(18 * TILE, DOOR.row * TILE + 6, speakerName('Rival'), {
      fontSize: '10px', color: '#bfe4ff', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(26);
    const startX = 18 * TILE, stopX = (DOOR.col + 0.5) * TILE, yy = (DOOR.row + 1) * TILE + 4;
    this.drawRivalSprite(rg, startX, yy, 0);

    let frame = 0;
    const step = this.time.addEvent({ delay: 110, loop: true, callback: () => { frame ^= 1; } });
    const proxy = { x: startX };
    this.tweens.add({
      targets: proxy, x: stopX, duration: 950, ease: 'Sine.easeOut',
      onUpdate: () => { this.drawRivalSprite(rg, proxy.x, yy, frame); tag.setPosition(proxy.x, yy - 36); },
      onComplete: () => {
        step.remove();
        this.drawRivalSprite(rg, stopX, yy, 0);
        this.dialog.show([
          "Rival: You didn't think I'd let you cross an international border without a send-off, did you?",
          "Rival: Everyone back home keeps calling you 'Champion' this, 'Champion' that. So before you walk through those doors —",
          'Rival: Now I will challenge the strongest trainer in Hanbando region! One more, for old times\' sake!',
        ], () => {
          PartySystem.healAll(this.registry);
          const team = RIVAL_TEAM.map(p => p.custom === RIVAL_CLOSER ? { ...p, custom: this.rivalFinal() } : p);
          this.registry.set('trainerName', 'Rival');
          this.registry.set('trainerKey', 'rival-5');
          this.registry.set('trainerPokemon', JSON.stringify(team));
          this.registry.set('trainerExpPool', 6000);
          this.registry.set('trainerReturnScene', 'NorthernPlazaScene');
          this.registry.set('northPlazaReturnX', (DOOR.col + 0.5) * TILE);
          this.registry.set('northPlazaReturnY', (DOOR.row + 2) * TILE + 16);
          this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
      },
    });
  }

  private rivalFinal(): string {
    const rivalKey = (this.registry.get('rivalKey') as string) ?? 'vipour';
    return rivalKey === 'munkain' ? 'banderado' : rivalKey === 'vipour' ? 'feldaconda' : 'thanatoat';
  }

  // ── Door + facilities (single prompt handler) ───────────────────────────────
  private checkInteractions() {
    if (this.cutsceneActive) { this.enterPrompt.setVisible(false); return; }
    const targets: { x: number; y: number; r: number; prompt: string; act: () => void }[] = [
      { x: NURSE.col * TILE + 16, y: NURSE.row * TILE + 16, r: TILE * 1.4, prompt: 'SPACE — Heal your team (Pokémon Center)', act: () => this.healTeam() },
      { x: MART.col  * TILE + 16, y: MART.row  * TILE + 16, r: TILE * 1.4, prompt: 'SPACE — Shop (Poké Mart)', act: () => this.openMart() },
      { x: PCBOX.col * TILE + 16, y: PCBOX.row * TILE + 16, r: TILE * 1.4, prompt: 'SPACE — Access the Storage PC', act: () => this.openPC() },
    ];
    // The doors only work once the rival has been beaten.
    if (this.defeated('rival-5')) {
      targets.unshift({
        x: (DOOR.col + 0.5) * TILE, y: DOOR.row * TILE + 16, r: TILE * 1.8,
        prompt: 'SPACE — Enter the Northern League', act: () => this.enterHall(),
      });
    }
    let near: typeof targets[number] | null = null;
    for (const t of targets) { if (Math.hypot(this.px - t.x, this.py - t.y) < t.r) { near = t; break; } }
    if (!near) { this.enterPrompt.setVisible(false); return; }
    this.enterPrompt.setText(near.prompt).setVisible(true);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) { this.enterPrompt.setVisible(false); near.act(); }
  }

  private enterHall() {
    this.cutsceneActive = true;
    // All eight 마패 (+ eight southern badges) → the League opens.
    if (northernLeagueEligible(this.registry)) {
      // Re-seal the northern gauntlet each entry → one-run challenge, and free
      // rematches after winning (northLeagueDone stays set — a rematch, not a reset).
      for (const k of ['north-seorak', 'north-hanseol', 'north-cheolgang', 'north-baekho', 'north-taewang']) {
        this.registry.remove(`trainerDefeated_${k}`);
      }
      this.registry.set('northLeagueFloor', 1);
      this.registry.remove('northColiseumReturnX');
      this.registry.remove('northColiseumReturnY');
      this.cameras.main.fadeOut(500, 0, 0, 0, () => {
        this.scene.start('NorthernColiseumScene');
      });
      return;
    }
    if (!this.registry.get('sunriseGymDefeated')) {
      this.dialog.show(['League Warden: Eight southern badges first, southerner. Come back a Champion.'], () => { this.cutsceneActive = false; });
      return;
    }
    // Check for all 8 마패s including Pyeongseong
    const currentMapaeCount = mapaeCount(this.registry);
    if (currentMapaeCount < 8) {
      this.dialog.show([
        'League Warden: Halt. The eight 어사대장 must vouch for you — in 마패.',
        `League Warden: You hold ${currentMapaeCount} of 8 마패. Complete the inspectorate circuit, defeat Supreme Gwang in Pyeongseong, and return.`,
      ], () => { this.cutsceneActive = false; });
      return;
    }
    this.dialog.show([
      'League Warden: Excellent. All eight 마패 are in your possession, including the final tablet from Supreme Gwang himself.',
      'League Warden: The Northern League awaits you, Champion. Prove yourself worthy of the title.',
    ], () => {
      // Re-seal the northern gauntlet each entry → one-run challenge
      for (const k of ['north-seorak', 'north-hanseol', 'north-cheolgang', 'north-baekho', 'north-taewang']) {
        this.registry.remove(`trainerDefeated_${k}`);
      }
      this.registry.set('northLeagueFloor', 1);
      this.registry.remove('northColiseumReturnX');
      this.registry.remove('northColiseumReturnY');
      this.cameras.main.fadeOut(500, 0, 0, 0, () => {
        this.scene.start('NorthernColiseumScene');
      });
    });
  }
  private healTeam() {
    PartySystem.healAll(this.registry);
    this.cutsceneActive = true;
    this.dialog.show([
      'Nurse: Welcome to the Northern League Pokémon Center.',
      'Nurse: Your team is fully restored. May you climb higher than any southerner before you.',
    ], () => { this.cutsceneActive = false; });
  }
  private openMart() { this.scene.launch('ShopScene', { parentKey: this.scene.key }); this.scene.pause(); }
  private openPC()   { this.scene.launch('BoxScene', { parentKey: this.scene.key }); this.scene.pause(); }

  private checkExit() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (this.py > (ROWS - 1) * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('pyeongyangReturnX', 11.5 * 32);
        this.registry.set('pyeongyangReturnY', 3 * 32 + 16);   // back through the capital
        this.scene.start('PyeongyangCityScene');
      });
    }
  }
}

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.WALL) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  fill(9, ROWS, 2, 18, T.GROUND);          // forecourt
  fill(9, 22, 8, 12, T.PAVE);              // central ceremonial approach
  fill(8, 9, 9, 11, T.CARPET);             // door threshold (walkable) at the palace base
  return m;                                 // rows 0-7 stay WALL = the palace mass
}
