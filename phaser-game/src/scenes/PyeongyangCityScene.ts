import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem } from '../systems/PartySystem';
import { mapaeCount, awardMapae } from '../data/Mapae';

// ── POST-GAME I — Pyeongseong, the Northern Capital ──────────────────────────────
// A stern, conservative, GRAND capital: wide ceremonial avenues, colossal grey-granite
// towers, a great obelisk and a bronze statue, formal banners on the building faces.
// An old and proud city that prizes order and decorum — uniformed City Wardens keep a
// formal, dignified watch over the plaza. The Grand Avenue leads north to the League.
// Supreme Commander Gwang, the final 어사대장, awaits in the palace grounds — defeat him
// to earn the eighth and final 마패 and gain entry to the Northern League.

const T = { GROUND: 0, PAVE: 1, WALL: 2, MONU: 3, BANNER: 4, GARDEN: 5, FOUNTAIN: 6, PLAZA: 7 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 32, ROWS = 36;

const COLORS: Record<Tile, number> = {
  [T.GROUND]: 0x33353c, [T.PAVE]: 0x3d4048, [T.WALL]: 0x1a1c22, [T.MONU]: 0x2a2c34, [T.BANNER]: 0x1e2a44,
  [T.GARDEN]: 0x2a3a2a, [T.FOUNTAIN]: 0x3a5a6a, [T.PLAZA]: 0x454852,
};
const SOLID = new Set<Tile>([T.WALL, T.MONU, T.BANNER]);

const GATE = { col: 15, row: 1 };   // road out to the Northern League (two tiles wide 15-16)

// City Wardens standing formal watch across the plaza.
const AGENTS = [
  { col: 8,  row: 24 }, { col: 23, row: 24 }, { col: 7, row: 14 }, { col: 24, row: 14 }, { col: 15, row: 18 },
  { col: 12, row: 28 }, { col: 19, row: 28 },
];

// The final 어사대장 Chief - Supreme Commander of the Northern Inspectorate
const PYEONGSEONG_CHIEF = {
  key: 'eosa-pyeongseong',
  name: '어사대장 Supreme Gwang',
  col: 15.5,
  row: 27,
  color: 0x1a1a2e,
  team: [
    { id: 384, level: 75 }, { id: 448, level: 75 }, { id: 130, level: 76 },
    { id: 612, level: 76 }, { id: 0, level: 78, custom: 'noeryong' },
  ],
  expPool: 12000,
  intro: [
    'Supreme Gwang: You have come far, southern Champion. Seven 마패 adorn your belt — each a testament to your worth.',
    'Supreme Gwang: But Pyeongseong demands more. The north demands perfection. Only those who can defeat the Supreme Commander may claim the final 마패.',
    'Supreme Gwang: Your journey ends here — either in triumph, or in defeat. Show me your true power!',
  ],
  defeat: [
    'Supreme Gwang: ...Incredible. I have not met a trainer of your caliber in decades.',
    'Supreme Gwang: You have mastered every trial the north could devise. The final 마패 is yours.',
    '🐎 You received the Pyeongseong 마패 — the eighth and final tablet!',
    'Supreme Gwang: With all eight 마패 in your possession, the Northern League awaits. Go forth and claim your destiny.',
  ],
};

export class PyeongyangCityScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private enterPrompt!: Phaser.GameObjects.Text;
  private agentGs: { g: Phaser.GameObjects.Graphics; x: number; y: number }[] = [];
  private chiefG?: Phaser.GameObjects.Graphics;
  private px = 15.5 * TILE;
  private py = 33 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false;
  private readonly SPEED = 130; private readonly RUN = 250;

  constructor() { super('PyeongyangCityScene'); }

  private get chiefDefeated() { return !!this.registry.get(`trainerDefeated_${PYEONGSEONG_CHIEF.key}`); }
  private get hasAllMapae() { return mapaeCount(this.registry) >= 7; }

  create() {

    playBgm(this, 'cheongun');
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    this.agentGs = [];
    this.input.keyboard?.resetKeys();
    this.spawnGuard = true;
    this.time.delayedCall(700, () => { this.spawnGuard = false; });

    this.px = 15.5 * TILE; this.py = 33 * TILE + 16;
    const rx = this.registry.get('pyeongyangReturnX') as number | undefined;
    const ry = this.registry.get('pyeongyangReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('pyeongyangReturnX'); this.registry.remove('pyeongyangReturnY');

    this.map = buildMap();
    this.drawMap();
    this.drawMonuments();
    this.drawAgents();
    this.drawChief();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    this.shiftKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    SaveManager.save(this.registry, this.px, this.py, 'PyeongyangCityScene');

    if (!this.registry.get('pyeongyangSeen')) {
      this.registry.set('pyeongyangSeen', true);
      this.time.delayedCall(600, () => this.playArrival());
    }
    
    // Check if player just defeated the Supreme Commander
    if (this.chiefDefeated && !this.registry.get('pyeongseongChiefRewardGiven')) {
      this.registry.set('pyeongseongChiefRewardGiven', true);
      this.time.delayedCall(500, () => this.playChiefVictory());
    }
  }

  private playArrival() {
    this.cutsceneActive = true;
    this.dialog.show([
      'You enter Pyeongseong, the northern capital — a vast, disciplined city of grey-granite towers and broad ceremonial avenues under a cold, clear sky. A great bronze figure presides over the central plaza.',
      'Uniformed City Wardens stand at their posts, still and formal, and incline their heads as you pass.',
      'City Warden Cheol: Southern Champion. You are expected. This is an old and proud capital — here, everything keeps its order, and guests keep their decorum.',
      'Warden Cheol: Supreme Commander Gwang awaits in the palace grounds. He holds the final 마패 — defeat him, and the Northern League lies beyond.',
      '(The Wardens return to their posts at the edges of the plaza — watchful, but courteous.)',
    ], () => { this.cutsceneActive = false; });
  }

  private playChiefVictory() {
    this.cutsceneActive = true;
    this.chiefG?.destroy(); // Remove the chief from the map
    this.dialog.show(PYEONGSEONG_CHIEF.defeat, () => {
      awardMapae(this.registry, 'pyeongseong');
      this.cutsceneActive = false;
    });
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
      if (t === T.GARDEN) { g.fillStyle(0x3a4a3a, 0.6); g.fillCircle(c*TILE+16, r*TILE+16, 8); g.fillStyle(0x2a3a2a, 0.8); g.fillRect(c*TILE+4, r*TILE+4, 24, 24); }
      if (t === T.FOUNTAIN) { g.fillStyle(0x4a6a7a, 0.8); g.fillCircle(c*TILE+16, r*TILE+16, 12); g.fillStyle(0x6a8a9a, 0.6); g.fillCircle(c*TILE+16, r*TILE+16, 6); }
      if (t === T.PLAZA)  { g.fillStyle(0x555862, 0.5); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4); }
    }
    const key = '__pyeongyangMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(15.5 * TILE, 0.5 * TILE, tr('↑ Grand Avenue → Northern League'), {
      fontSize: '9px', color: '#ffe88a', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(5);
  }

  /** The great stone obelisk, the bronze statue, and city labels. */
  private drawMonuments() {
    // Central obelisk — a tall grey-granite monument crowned with a gold finial.
    const sx = 10 * TILE + 16, sBase = 16 * TILE;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x50535c); g.fillTriangle(sx - 16, sBase, sx + 16, sBase, sx, sBase - 180);
    g.fillStyle(0x3c3f47); g.fillRect(sx - 18, sBase, 36, 16);
    g.fillStyle(0xd8b44a); g.fillTriangle(sx - 7, sBase - 180, sx + 7, sBase - 180, sx, sBase - 205);   // gold finial
    this.add.text(sx, sBase + 24, tr('The Grand Obelisk'), { fontSize: '8px', color: '#fff', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);

    // Bronze statue on the central plaza.
    const tx = 22 * TILE + 16, tBase = 16 * TILE;
    const s = this.add.graphics().setDepth(3);
    s.fillStyle(0x3a3d45); s.fillRect(tx - 20, tBase, 40, 20);              // plinth
    s.fillStyle(0x9a7b3a);                                                   // bronze figure
    s.fillRect(tx - 10, tBase - 50, 20, 52); s.fillRect(tx - 24, tBase - 38, 14, 8); s.fillRect(tx + 10, tBase - 42, 16, 8);
    s.fillCircle(tx, tBase - 58, 10);
    this.add.text(tx, tBase + 28, tr('The Great Statue'), { fontSize: '8px', color: '#fff', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);

    // Heroic monument arch - northern landmark
    const ax = 15.5 * TILE + 16, aBase = 8 * TILE;
    const a = this.add.graphics().setDepth(3);
    a.fillStyle(0x4a4d55); a.fillRect(ax - 40, aBase - 60, 80, 80);           // arch base
    a.fillStyle(0x3a3d45); a.fillRect(ax - 30, aBase - 50, 60, 60);           // arch opening
    a.fillStyle(0x2a2c34); a.fillRect(ax - 35, aBase - 55, 70, 70);           // arch inner
    a.fillStyle(0xd8b44a); a.fillRect(ax - 3, aBase - 58, 6, 6);             // gold keystone
    this.add.text(ax, aBase + 12, tr('Triumphal Arch'), { fontSize: '8px', color: '#ffe88a', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(4);

    // Palace building - seat of government
    const px = 15.5 * TILE + 16, pBase = 26 * TILE;
    const p = this.add.graphics().setDepth(3);
    p.fillStyle(0x3a3d45); p.fillRect(px - 60, pBase - 40, 120, 50);          // palace base
    p.fillStyle(0x4a4d55); p.fillRect(px - 55, pBase - 55, 110, 20);          // palace upper
    p.fillStyle(0x5a5d65); p.fillRect(px - 40, pBase - 65, 80, 15);           // palace roof
    p.fillStyle(0xd8b44a); p.fillRect(px - 5, pBase - 70, 10, 10);            // palace spire
    this.add.text(px, pBase + 16, tr('The Palace'), { fontSize: '9px', color: '#ffe88a', backgroundColor: '#00000099', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(4);

    this.add.text(15.5 * TILE, 4.4 * TILE, '평성 · PYEONGSEONG', {
      fontSize: '14px', color: '#ffe88a', backgroundColor: '#000000aa', padding: { x: 8, y: 3 },
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

  private drawChief() {
    if (this.chiefDefeated) return; // Don't draw if already defeated
    
    const g = this.add.graphics().setDepth(9);
    this.chiefG = g;
    const cx = PYEONGSEONG_CHIEF.col * TILE + 16;
    const cy = PYEONGSEONG_CHIEF.row * TILE + 16;
    g.setPosition(cx, cy);
    
    // Draw the Supreme Commander - more imposing than regular wardens
    g.fillStyle(0x000000, 0.3); g.fillEllipse(0, 15, 18, 6);
    g.fillStyle(0x1a1a2e); g.fillRect(-9, -10, 18, 16);      // imposing dark coat
    g.fillStyle(0xd8b44a); g.fillRect(-9, -10, 18, 3);       // gold shoulder trim
    g.fillStyle(0xd8b44a); g.fillRect(-1, -10, 2, 16);       // gold sash
    g.fillStyle(0xffcc99); g.fillRect(-8, -22, 16, 12);      // face
    g.fillStyle(0x0a0a12); g.fillRect(-9, -24, 18, 8);       // grand ceremonial cap
    g.fillStyle(0xd8b44a); g.fillRect(-9, -18, 18, 2);       // cap band
    g.fillStyle(0xd8b44a); g.fillRect(-2, -24, 4, 4);        // cap ornament
    g.fillStyle(0x000000); g.fillRect(-5, -17, 2, 2); g.fillRect(3, -17, 2, 2);   // eyes
    
    this.add.text(cx, cy - 28, '어사대장 Supreme Gwang', {
      fontSize: '9px', color: '#ffe88a', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(10);
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
    this.add.text(this.scale.width / 2, 22, tr('🏙 Pyeongseong — the Northern Capital'), {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.enterPrompt = this.add.text(this.scale.width / 2, this.scale.height - 40, '', {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);
    this.add.text(this.scale.width / 2, this.scale.height - 8, tr('WASD: move  SPACE: interact  M: menu'), {
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
    this.checkChief();
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

  private checkChief() {
    if (this.chiefDefeated) return;
    
    const cx = PYEONGSEONG_CHIEF.col * TILE + 16;
    const cy = PYEONGSEONG_CHIEF.row * TILE + 16;
    
    if (Math.hypot(this.px - cx, this.py - cy) > TILE * 2) { this.enterPrompt.setVisible(false); return; }
    
    if (!this.hasAllMapae) {
      this.enterPrompt.setText(tr('SPACE — Talk to Supreme Gwang')).setVisible(true);
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.enterPrompt.setVisible(false);
        this.cutsceneActive = true;
        const n = mapaeCount(this.registry);
        this.dialog.show([
          `Supreme Gwang: You have ${n} of the 7 regional 마패. Return when you have mastered all seven regional trials.`,
          'Supreme Gwang: Only then will you be worthy of challenging the Supreme Commander of Pyeongseong.',
        ], () => { this.cutsceneActive = false; });
      }
      return;
    }
    
    this.enterPrompt.setText(tr('SPACE — Challenge Supreme Gwang')).setVisible(true);
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.enterPrompt.setVisible(false);
      this.cutsceneActive = true;
      PartySystem.healAll(this.registry);
      this.dialog.show(PYEONGSEONG_CHIEF.intro, () => {
        this.registry.set('trainerName', PYEONGSEONG_CHIEF.name);
        this.registry.set('trainerKey', PYEONGSEONG_CHIEF.key);
        this.registry.set('trainerPokemon', JSON.stringify(PYEONGSEONG_CHIEF.team));
        this.registry.set('trainerExpPool', PYEONGSEONG_CHIEF.expPool);
        this.registry.set('trainerReturnScene', 'PyeongyangCityScene');
        this.registry.set('pyeongyangReturnX', this.px);
        this.registry.set('pyeongyangReturnY', this.py);
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
      });
    }
  }

  private checkGate() {
    const gx = (GATE.col + 0.5) * TILE, gy = GATE.row * TILE + 16;
    if (Math.hypot(this.px - gx, this.py - gy) > TILE * 1.8) { this.enterPrompt.setVisible(false); return; }
    this.enterPrompt.setText(tr('SPACE — Grand Avenue → Northern League')).setVisible(true);
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
      // South road off Pyeongseong (평성) descends through the capital checkpoint toward
      // Wonsan (원산) — NOT back down to the southern Capitol.
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('pyeongseongCheckpointReturnX', 7.5 * 32);
        this.registry.set('pyeongseongCheckpointReturnY', 14 * 32 + 16);
        this.scene.start('PyeongseongCheckpointScene');
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
  fill(1, ROWS - 1, 14, 18, T.PAVE);
  fill(0, 1, GATE.col, GATE.col + 2, T.PAVE);            // north gate opening
  fill(ROWS - 1, ROWS, 15, 17, T.PAVE);                  // south rail opening
  // Central ceremonial plaza (wider) around the monuments.
  fill(12, 20, 6, 26, T.PLAZA);
  // Grand avenue expansion at plaza level
  fill(12, 20, 14, 18, T.PAVE);
  // Monumental building blocks flanking the avenue.
  fill(4, 10, 4, 10, T.WALL);   fill(4, 10, 22, 28, T.WALL);
  fill(22, 28, 4, 10, T.WALL); fill(22, 28, 22, 28, T.WALL);
  
  // Palace complex in south (Split into left and right wings to create an open courtyard)
  fill(24, 30, 8, 14, T.WALL);  // Left wing
  fill(24, 30, 18, 24, T.WALL); // Right wing
  fill(23, 24, 10, 14, T.WALL); 
  fill(23, 24, 18, 22, T.WALL);
  
  // Formal gardens along the avenue
  fill(10, 14, 10, 14, T.GARDEN); fill(10, 14, 18, 22, T.GARDEN);
  fill(18, 22, 10, 14, T.GARDEN); fill(18, 22, 18, 22, T.GARDEN);
  // Fountains in the plaza
  m[14][15] = T.FOUNTAIN; m[14][17] = T.FOUNTAIN; m[17][16] = T.FOUNTAIN;
  // Formal navy-and-gold banners on the building faces along the avenue.
  for (const r of [5, 6, 7, 25, 26, 27]) { m[r][10] = T.BANNER; m[r][21] = T.BANNER; }
  // Solid bases under the spire (col 10) and statue (col 22).
  m[15][10] = T.MONU; m[16][22] = T.MONU;
  // Arch base
  m[7][15] = T.MONU; m[7][16] = T.MONU;
  return m;
}