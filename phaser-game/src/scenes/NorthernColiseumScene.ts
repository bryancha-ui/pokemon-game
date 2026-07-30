import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, drawNpcBody, playerDesign, rivalTrainerName } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem } from '../systems/PartySystem';

// ── POST-GAME I — The Northern League (interior gauntlet) ────────────────────────
// Inside the austere North-Korean-style palace: a severe grey-granite hall, red
// state banners and a single gold star above the throne. Four Northern Elite, then
// Champion Taewang. The Rival is fought OUTSIDE, in NorthernPlazaScene, before you
// may enter. Mirrors PokemonLeagueScene's barrier-gauntlet structure.

const T = { FLOOR: 0, WALL: 1, DAIS: 2, BARRIER: 3, CARPET: 4, THRONE: 5, BANNER: 6 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 18, ROWS = 34;

const COLORS: Record<Tile, number> = {
  [T.FLOOR]: 0x35373d, [T.WALL]: 0x14151a, [T.DAIS]: 0x4a4d55, [T.BARRIER]: 0x5f1a1a,
  [T.CARPET]: 0x6e1216, [T.THRONE]: 0x5f4a10, [T.BANNER]: 0x361212,
};
const SOLID = new Set<Tile>([T.WALL, T.BANNER]);

// Gate barriers → the guardian whose defeat unseals each one.
const GATES: Record<number, string> = {
  27: 'north-seorak', 22: 'north-hanseol', 17: 'north-cheolgang', 12: 'north-baekho',
};

interface Member {
  key: string; name: string; type: string; col: number; row: number;
  color: number; barrierRow: number;
  intro: string[]; pokemon: { id: number; level: number; custom?: string }[]; expPool: number;
}

const MEMBERS: Member[] = [
  {
    key: 'north-seorak', name: 'Seorak', type: 'Rock/Ground', col: 9, row: 29, color: 0xc9a86a, barrierRow: 27,
    intro: [
      'Seorak: First of the Northern Elite. My mountains have stood since before your peninsula had a name.',
      'Seorak: Let us see if a southerner can move stone. Begin.',
    ],
    pokemon: [
      { id: 0, level: 76, custom: 'halubang' }, { id: 0, level: 76, custom: 'palossandx' },
      { id: 306, level: 77 }, { id: 445, level: 77 }, { id: 0, level: 79, custom: 'dracoelido' },
    ],
    expPool: 6200,
  },
  {
    key: 'north-hanseol', name: 'Hanseol', type: 'Ice', col: 9, row: 24, color: 0xbfe8ff, barrierRow: 22,
    intro: [
      'Hanseol: The northern winter never ends. Neither does my patience.',
      'Hanseol: Freeze, southerner — or prove you can weather the cold.',
    ],
    pokemon: [
      { id: 0, level: 77, custom: 'snoqueen' }, { id: 478, level: 77 },
      { id: 91, level: 78 }, { id: 0, level: 78, custom: 'luninari' }, { id: 0, level: 80, custom: 'snoqueen' },
    ],
    expPool: 6500,
  },
  {
    key: 'north-cheolgang', name: 'Cheolgang', type: 'Steel', col: 9, row: 19, color: 0xced4de, barrierRow: 17,
    intro: [
      'Cheolgang: Fortress-forged discipline. My steel does not bend, and it does not tire.',
      'Cheolgang: Strike it. See what breaks first.',
    ],
    pokemon: [
      { id: 0, level: 78, custom: 'silicutis' }, { id: 0, level: 78, custom: 'turtleship' },
      { id: 208, level: 79 }, { id: 0, level: 79, custom: 'hallowknight' }, { id: 0, level: 81, custom: 'martbadger' },
    ],
    expPool: 6800,
  },
  {
    key: 'north-baekho', name: 'Baekho', type: 'Dragon', col: 9, row: 14, color: 0xd8b0ff, barrierRow: 12,
    intro: [
      'Baekho: The white tiger of the north. Last gate before the throne.',
      'Baekho: My storm-dragons have thrown down every challenger before you. Rise — or fall.',
    ],
    pokemon: [
      { id: 0, level: 79, custom: 'beardiedragon' }, { id: 612, level: 79 },
      { id: 330, level: 80 }, { id: 706, level: 80 }, { id: 0, level: 82, custom: 'dracopaia' },
    ],
    expPool: 7200,
  },
];

const TAEWANG: Member = {
  key: 'north-taewang', name: 'Champion Taewang', type: 'Champion', col: 9, row: 6, color: 0xffd54a, barrierRow: -1,
  intro: [
    'Taewang: So. The little southern peninsula finally sends someone who climbed all the way to my throne. Hwangeum never did.',
    'Taewang: You\'ve come a long way from your waterfalls and lantern festivals, southerner.',
    'Taewang: Let us see if the journey made you strong — or merely lucky.',
  ],
  pokemon: [
    { id: 0, level: 83, custom: 'mperodactyl' }, { id: 0, level: 84, custom: 'turtleship' },
    { id: 149, level: 84 }, { id: 445, level: 85 }, { id: 0, level: 85, custom: 'komodread' },
    { id: 0, level: 87, custom: 'noeryong' },
  ],
  expPool: 10000,
};

export class NorthernColiseumScene extends Phaser.Scene {
  // The league hall's near-black walls/banners otherwise extrude into tall blocks
  // that hide the player and the barriers ahead. Cap wall/floor heights and erase
  // any building-classified dark blocks so the gauntlet stays clear to see.
  public caveFloorHint = true;
  public onlyNamedBuildings = true;

  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private px = 9 * TILE + 16;
  private py = 31 * TILE + 16;
  private facing = 1; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false;
  private readonly SPEED = 120;

  constructor() { super('NorthernColiseumScene'); }

  preload() {
    // Party sprites for the Northern Hall of Fame line-up.
    for (const e of PartySystem.get(this.registry)) {
      if (e.spriteKey && e.spriteUrl && !this.textures.exists(e.spriteKey)) this.load.image(e.spriteKey, e.spriteUrl);
    }
  }

  private fitImg(img: Phaser.GameObjects.Image, size: number) {
    const src = this.textures.get(img.texture.key).getSourceImage();
    img.setScale(size / Math.max((src.width as number) || 1, (src.height as number) || 1));
  }

  private defeated(key: string) { return !!this.registry.get(`trainerDefeated_${key}`); }
  private get taewangBeaten() { return this.defeated('north-taewang'); }

  create() {

    // Coliseum hall theme — but not when we're about to run the Hall of Fame ceremony.
    if (!(this.taewangBeaten && !this.registry.get('northLeagueDone'))) playBgm(this, 'leagueinterior');
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    this.input.keyboard?.resetKeys();
    this.spawnGuard = true;
    this.time.delayedCall(600, () => { this.spawnGuard = false; });

    // Failed the northern gauntlet (lost to any master or Taewang)? Re-seal all four
    // and restart from the first, back at the entrance.
    if (this.registry.get('northLeagueRunFailed')) {
      this.registry.remove('northLeagueRunFailed');
      for (const k of ['north-seorak', 'north-hanseol', 'north-cheolgang', 'north-baekho']) {
        this.registry.remove(`trainerDefeated_${k}`);
      }
      this.registry.remove('northColiseumReturnX'); this.registry.remove('northColiseumReturnY');
    }

    this.px = 9 * TILE + 16; this.py = 31 * TILE + 16;
    const rx = this.registry.get('northColiseumReturnX') as number | undefined;
    const ry = this.registry.get('northColiseumReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('northColiseumReturnX'); this.registry.remove('northColiseumReturnY');

    this.map = buildMap();
    this.drawMap();
    this.drawMembers();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'NorthernColiseumScene');

    if (this.taewangBeaten && !this.registry.get('northLeagueDone')) {
      this.time.delayedCall(400, () => this.runNorthernEnding());
    } else if (!this.registry.get('northColiseumSeen')) {
      this.registry.set('northColiseumSeen', true);
      this.time.delayedCall(500, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'Inside, the palace is severe and almost bare — grey granite the height of a canyon, red state banners hanging in the still, cold air, a single gold star burning above the distant throne.',
          'Four of the Northern Elite guard the way up. Beat each to unseal the next. Every hall restores your team before the match.',
        ], () => { this.cutsceneActive = false; });
      });
    }
  }

  private barrierOpen(row: number): boolean {
    const key = GATES[row];
    return !!key && this.defeated(key);
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      const open = t === T.BARRIER && this.barrierOpen(r);
      const draw = open ? T.CARPET : t;
      g.fillStyle(COLORS[draw], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (draw === T.FLOOR) { g.fillStyle(0x2c2e34, 0.5); g.fillRect(c*TILE+1, r*TILE+1, TILE-2, TILE-2); }
      if (draw === T.CARPET) { g.fillStyle(0x8a1218, 0.85); g.fillRect(c*TILE+6, r*TILE, TILE-12, TILE); }
      if (draw === T.WALL) { g.fillStyle(0x0b0c10); g.fillRect(c*TILE+2, r*TILE+2, TILE-4, TILE-4); g.fillStyle(0x1c1d24); g.fillRect(c*TILE+5, r*TILE+3, TILE-10, TILE-6); }
      if (draw === T.BANNER) { g.fillStyle(0x7c1414); g.fillRect(c*TILE+8, r*TILE, TILE-16, TILE); }
      if (draw === T.DAIS) { g.fillStyle(0x565a63, 0.85); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6); }
      if (t === T.BARRIER && !open) { g.fillStyle(0xa8adba, 0.55); for (let i=0;i<4;i++) g.fillRect(c*TILE+3+i*8, r*TILE+2, 3, TILE-4); }
      if (draw === T.THRONE) { g.fillStyle(0xffd76a, 0.7); g.fillRect(c*TILE+6, r*TILE+4, TILE-12, TILE-8); }
    }
    const key = '__northMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    for (const r of [10, 16, 21, 26]) for (const c of [5, 12])
      this.add.text(c * TILE + 16, r * TILE + 16, '★', { fontSize: '12px', color: '#ffe14a' }).setOrigin(0.5).setDepth(5);
    this.add.text(9 * TILE, 1.4 * TILE, '★', { fontSize: '44px', color: '#ffe14a', stroke: '#7a5a00', strokeThickness: 4 }).setOrigin(0.5).setDepth(5);
    this.add.text(9 * TILE, 3.0 * TILE, tr('👑 Taewang\'s Throne'), { fontSize: '10px', color: '#ffe88a', backgroundColor: '#00000088', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
    this.add.text(9 * TILE, 32.4 * TILE, tr('↓ Back to the plaza'), { fontSize: '9px', color: '#fff', backgroundColor: '#00000088', padding: { x: 3, y: 2 } }).setOrigin(0.5).setDepth(5);
  }

  private drawMembers() {
    for (const m of [...MEMBERS, TAEWANG]) {
      if (this.defeated(m.key)) continue;
      const g = this.add.graphics().setDepth(8);
      drawNpcBody(g, m.color);
      g.setPosition(m.col * TILE + 16, m.row * TILE + 16);
      const label = m.type === 'Champion' ? '👑 Taewang' : `${m.name} — ${m.type}`;
      this.add.text(m.col * TILE + 16, m.row * TILE - 16, label, {
        fontSize: '8px', color: '#ffe88a', backgroundColor: '#00000099', padding: { x: 2, y: 1 }, align: 'center',
      }).setOrigin(0.5).setDepth(9);
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
    this.cameras.main.setZoom(1.7);
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
    this.add.text(this.scale.width / 2, this.scale.height - 8, tr('WASD: move  SPACE: challenge  M: menu'), {
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
      if (this.walkTimer > 180) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else this.walkFrame = 0;
    this.drawChar();
    this.checkMembers();
    this.checkExit();
  }
  private collides(x: number, y: number): boolean {
    const hw = 6;
    return [[x-hw,y-4],[x+hw,y-4],[x-hw,y+8],[x+hw,y+8]].some(([cx, cy]) => {
      const col = Math.floor(cx / TILE), row = Math.floor(cy / TILE);
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return true;
      const t = this.map[row][col];
      if (t === T.BARRIER) return !this.barrierOpen(row);
      return SOLID.has(t);
    });
  }

  private checkMembers() {
    for (const m of [...MEMBERS, TAEWANG]) {
      if (this.defeated(m.key)) continue;
      const wx = m.col * TILE + 16, wy = m.row * TILE + 16;
      if (Math.hypot(this.px - wx, this.py - wy) < TILE * 1.6) {
        this.cutsceneActive = true;
        PartySystem.healAll(this.registry);
        this.dialog.show(['(The hall\'s healing machine restores your team to full health.)', ...m.intro], () => {
          this.registry.set('trainerName', m.name);
          this.registry.set('trainerKey', m.key);
          this.registry.set('trainerPokemon', JSON.stringify(m.pokemon));
          this.registry.set('trainerExpPool', m.expPool);
          this.registry.set('trainerReturnScene', 'NorthernColiseumScene');
          this.registry.set('northColiseumReturnX', m.col * TILE + 16);
          this.registry.set('northColiseumReturnY', (m.row + 1) * TILE + 16);
          this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return;
      }
    }
  }

  private checkExit() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (this.py > (ROWS - 1) * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('northPlazaReturnX', 10 * TILE + 16);
        this.registry.set('northPlazaReturnY', 11 * TILE + 16);
        this.scene.start('NorthernPlazaScene');
      });
    }
  }

  // ── Victory ceremony — the Northern Hall of Fame ───────────────────────────
  private runNorthernEnding() {
    this.registry.set('northLeagueDone', true);
    this.registry.set('northReunionPending', true);
    this.registry.set('northHallOfFame', true);
    playBgm(this, 'halloffame');
    this.cutsceneActive = true;
    PartySystem.healAll(this.registry);

    const W = this.scale.width, H = this.scale.height;
    const kids: Phaser.GameObjects.GameObject[] = [];
    // Cold northern night sky over the coliseum.
    kids.push(this.add.rectangle(W / 2, H / 2, W, H, 0x070b18, 1));
    const stars = this.add.graphics();
    for (let i = 0; i < 90; i++) { stars.fillStyle(0xffffff, Math.random() * 0.7 + 0.2); stars.fillCircle(Math.random() * W, Math.random() * H, Math.random() < 0.2 ? 2 : 1); }
    kids.push(stars);
    // The gold star of the fortress, presiding over the ceremony.
    kids.push(this.add.text(W / 2, H * 0.12, '★', { fontSize: '54px', color: '#ffe14a', stroke: '#7a5a00', strokeThickness: 5 }).setOrigin(0.5));
    kids.push(this.add.text(W / 2, H * 0.045, tr('🏆 NORTHERN HALL OF FAME · 북방 명예의 전당'), {
      fontSize: '23px', color: '#ffe88a', fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5));

    // Your team, displayed graphically.
    const party = PartySystem.get(this.registry);
    const cols = 3, cellW = 230, cellH = 170;
    const rowsN = Math.ceil(Math.max(party.length, 1) / cols);
    const startY = H * 0.32 - (rowsN - 1) * cellH / 2;
    party.forEach((e, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const inRow = Math.min(party.length - row * cols, cols);
      const x = W / 2 + (col - (inRow - 1) / 2) * cellW;
      const y = startY + row * cellH;
      const items: Phaser.GameObjects.GameObject[] = [];
      if (this.textures.exists(e.spriteKey)) { const img = this.add.image(x, y, e.spriteKey).setAlpha(0); this.fitImg(img, 116); items.push(img); }
      else items.push(this.add.circle(x, y, 40, 0x33405a).setAlpha(0));
      items.push(this.add.text(x, y + 74, `${e.name}  Lv.${e.level}`, { fontSize: '13px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5).setAlpha(0));
      kids.push(...items);
      this.tweens.add({ targets: items, alpha: 1, duration: 600, delay: 400 + i * 220 });
    });

    const root = this.add.container(0, 0, kids).setScrollFactor(0).setDepth(140);
    const zoom = this.cameras.main?.zoom ?? 1, s = 1 / zoom;
    root.setScale(s); root.setPosition((W / 2) * (1 - s), (H / 2) * (1 - s));

    // After Northern League victory, return to Sudo City for celebration party
    const lines = [
      'Taewang rises from his throne for the first time — slowly, deliberately.',
      'Taewang: ...In thirty years on this throne, I have beaten every Hanbando Champion sent to me. Every one.',
      'Taewang: Until now.',
      'Taewang (inclining his head — a king\'s respect): The peninsula bred a real trainer at last. Your team is enshrined in the Northern Hall of Fame, beside the north\'s own legends.',
      '🏆 Your team is recorded in the Northern Hall of Fame — the first southern names ever set in this stone!',
      'Taewang: A celebration awaits in Sudo City. Go, Champion. The whole region will want to honor your achievement.',
    ];
    this.dialog.show(lines, () => {
      this.registry.set('sudoPartyPending', true);
      this.cameras.main.fadeOut(900, 0, 0, 0, () => {
        this.registry.set('capitalReturnX', 24 * 32 + 16);
        this.registry.set('capitalReturnY', 31 * 32 + 16);
        this.scene.start('CapitolCityScene');
      });
    });
  }
}

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.WALL) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  fill(2, ROWS, 5, 13, T.FLOOR);          // hall corridor (entrance → throne)
  fill(0, 2, 7, 11, T.FLOOR);             // behind the throne
  fill(ROWS - 2, ROWS, 7, 11, T.FLOOR);   // entry from the plaza
  for (const r of [29, 24, 19, 14, 6]) fill(r - 1, r + 2, 7, 11, T.DAIS);
  fill(4, 7, 6, 12, T.THRONE);
  for (const r of [10, 16, 21, 26]) { m[r][5] = T.BANNER; m[r][12] = T.BANNER; }
  for (const r of [27, 22, 17, 12]) fill(r, r + 1, 5, 13, T.BARRIER);
  return m;
}
