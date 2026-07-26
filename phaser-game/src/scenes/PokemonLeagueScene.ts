import Phaser from 'phaser';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, drawNpcBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem } from '../systems/PartySystem';
import { customForm } from '../data/CustomBattle';

// ── Tiles ─────────────────────────────────────────────────────────────────────
const T = { FLOOR: 0, WALL: 1, DAIS: 2, BARRIER: 3, CARPET: 4, THRONE: 5 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 18, ROWS = 34;
const COLORS: Record<Tile, number> = {
  [T.FLOOR]: 0x1c2336, [T.WALL]: 0x10141f, [T.DAIS]: 0x2e3a55, [T.BARRIER]: 0x3a4a7a,
  [T.CARPET]: 0x5a2030, [T.THRONE]: 0x4a3a10,
};
const SOLID = new Set<Tile>([T.WALL]);

interface Member {
  key: string; name: string; type: string; col: number; row: number;
  color: number; barrierRow: number;     // wall above them; opens when they fall
  intro: string[]; pokemon: { id: number; level: number; custom?: string }[]; expPool: number;
}

const MEMBERS: Member[] = [
  {
    key: 'e4-gyeoul', name: 'Gyeoul', type: 'Ice', col: 9, row: 27, color: 0x9fe0ff, barrierRow: 25,
    intro: [
      'Gyeoul: I am Gyeoul, first of the Elite Four. My cranes nest on the glacier.',
      'Gyeoul: The cold does not rush. Neither will I. Begin.',
    ],
    pokemon: [
      { id: 0, level: 58, custom: 'bosongnun' },  // Ice/Fairy
      { id: 478, level: 58 },                      // Froslass (Ice/Ghost)
      { id: 0, level: 59, custom: 'luninari' },    // Ice/Fairy
      { id: 699, level: 59 },                      // Aurorus (Rock/Ice)
      { id: 473, level: 62 },                      // Mamoswine (Ice/Ground) ace
    ],
    expPool: 4600,
  },
  {
    key: 'e4-hwageum', name: 'Hwageum', type: 'Steel', col: 9, row: 22, color: 0xcfd6e0, barrierRow: 20,
    intro: [
      'Hwageum: Goryeo smiths folded steel ten thousand times. So have I folded my team.',
      'Hwageum: Let us see what your edge is made of.',
    ],
    pokemon: [
      { id: 0, level: 59, custom: 'camerghoost' },  // Ghost/Steel
      { id: 0, level: 59, custom: 'hallowknight' }, // Bug/Steel — the insect-knight
      { id: 0, level: 60, custom: 'silicutis' },    // Steel/Bug
      { id: 395, level: 60 },                      // Empoleon (Water/Steel)
      { id: 0, level: 63, custom: 'hambillet' },   // Steel/Flying ace
    ],
    expPool: 4900,
  },
  {
    key: 'e4-baram', name: 'Baram', type: 'Flying', col: 9, row: 17, color: 0xa8e6c8, barrierRow: 15,
    intro: [
      'Baram: I am Baram. The eagles and cranes of the cliffs answer to the wind.',
      'Baram: Rise to meet me — or be swept aside.',
    ],
    pokemon: [
      { id: 279, level: 60 },                      // Pelipper (Water/Flying)
      { id: 0, level: 60, custom: 'samdumae' },    // Flying/Fairy
      { id: 227, level: 62 },                      // Skarmory (Steel/Flying)
      { id: 334, level: 62 },                      // Altaria (Dragon/Flying)
      { id: 149, level: 64 },                      // Dragonite (Dragon/Flying) ace
    ],
    expPool: 5200,
  },
  {
    key: 'e4-saleum', name: 'Saleum', type: 'Psychic', col: 9, row: 12, color: 0xe0b0ff, barrierRow: 10,
    intro: [
      'Saleum: The mudang sees what is, and what is coming. I have seen this battle.',
      'Saleum: Whether the vision holds is up to you. Come.',
    ],
    pokemon: [
      { id: 282, level: 62 },                      // Gardevoir (Psychic/Fairy)
      { id: 0, level: 62, custom: 'unsilgami' },   // Psychic/Bug
      { id: 376, level: 63 },                      // Metagross (Steel/Psychic)
      { id: 0, level: 63, custom: 'frysm' },       // Water/Psychic
      { id: 0, level: 65, custom: 'supiryeong' },  // Ghost/Psychic ace
    ],
    expPool: 5500,
  },
];

const CHAMPION: Member = {
  key: 'champion-hwangeum', name: 'Champion Hwangeum', type: 'Champion', col: 9, row: 5, color: 0xffd54a, barrierRow: -1,
  intro: [
    'Hwangeum: You made it. I watched your entire journey. The Jeju Summit — 나비할망 choosing you as her guardian. The tests, the battles, the growth.',
    'Hwangeum: Eight gyms, one legendary moth, and you still climbed back up here. I became Champion three years ago and called it a fluke for a year. I don\'t take many battles seriously anymore.',
    'Hwangeum: This one — I will. Show me everything you\'ve become.',
  ],
  // The Golden One fields the region's own apex Pokémon — almost all new species.
  pokemon: [
    { id: 0,   level: 65, custom: 'thanatoat' },    // Water/Ghost — grim-reaper crane
    { id: 0,   level: 66, custom: 'snoqueen' },     // Ice/Fairy — the frost sovereign
    { id: 0,   level: 66, custom: 'turtleship' },   // Steel/Dragon — armoured turtle-ship dragon
    { id: 0,   level: 68, custom: 'daejangseung' }, // Ghost/Fighting — risen totem (Sotori's evolution)
    { id: 0,   level: 69, custom: 'kkaakdang' },    // Flying/Dark — the sharp-suited crow boss
    { id: 0,   level: 70, custom: 'bonejoillion' }, // Electric/Steel — the golden ace
  ],
  expPool: 8200,
};

export class PokemonLeagueScene extends Phaser.Scene {
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
  private readonly SPEED = 120;

  constructor() { super('PokemonLeagueScene'); }

  preload() {
    for (const key of ['nabihalmang', 'cheonjisin']) {
      if (!this.textures.exists(key)) this.load.image(key, customForm(key)?.data.spriteUrl ?? `assets/dex/${key}.png`);
    }
    // Party sprites for the Hall of Fame line-up.
    for (const e of PartySystem.get(this.registry)) {
      if (e.spriteKey && e.spriteUrl && !this.textures.exists(e.spriteKey)) this.load.image(e.spriteKey, e.spriteUrl);
    }
  }

  private fitImg(img: Phaser.GameObjects.Image, size: number) {
    const src = this.textures.get(img.texture.key).getSourceImage();
    img.setScale(size / Math.max((src.width as number) || 1, (src.height as number) || 1));
  }

  private defeated(key: string) { return !!this.registry.get(`trainerDefeated_${key}`); }
  private get champBeaten() { return this.defeated('champion-hwangeum'); }

  create() {

    // Ambient hall theme — but not when we're about to run the Hall of Fame ceremony.
    if (!(this.champBeaten && !this.registry.get('hallOfFame'))) playBgm(this, 'leagueinterior');
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0;
    this.input.keyboard?.resetKeys();

    // Failed the gauntlet (lost to any Elite Four member or the Champion)? Re-seal all
    // four Elite Four barriers — the run restarts from the first, and the player is put
    // back at the hall entrance.
    let failedRun = false;
    if (this.registry.get('leagueRunFailed')) {
      this.registry.remove('leagueRunFailed');
      for (const m of MEMBERS) this.registry.remove(`trainerDefeated_${m.key}`);
      this.registry.remove('leagueReturnX'); this.registry.remove('leagueReturnY');
      this.px = 9 * TILE + 16; this.py = 31 * TILE + 16;   // back to the entrance
      failedRun = true;
    }

    const rx = this.registry.get('leagueReturnX') as number | undefined;
    const ry = this.registry.get('leagueReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; }
    this.registry.remove('leagueReturnX'); this.registry.remove('leagueReturnY');

    this.map = buildMap();
    this.drawMap();
    this.drawMembers();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'PokemonLeagueScene');

    // Returned from beating the Champion → the Hall of Fame.
    if (this.champBeaten && !this.registry.get('hallOfFame')) {
      this.time.delayedCall(400, () => this.runHallOfFame());
    } else if (failedRun) {
      this.time.delayedCall(450, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'You were defeated. The four halls seal shut behind you once more.',
          'The League is a single trial — best all four masters again, in one unbroken run, to reach the Champion.',
        ], () => { this.cutsceneActive = false; });
      });
    } else if (!this.registry.get('leagueSeen')) {
      this.registry.set('leagueSeen', true);
      this.time.delayedCall(500, () => {
        this.cutsceneActive = true;
        this.dialog.show([
          'The Hanbando Pokémon League. Four masters guard the road to the Champion, each in their own hall.',
          'Defeat one to unseal the way to the next. Each hall has a healing machine, so your team is restored to full before every match.',
        ], () => { this.cutsceneActive = false; });
      });
    }
  }

  private barrierOpen(row: number): boolean {
    const m = MEMBERS.find(x => x.barrierRow === row);
    return !!m && this.defeated(m.key);
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c];
      const open = t === T.BARRIER && this.barrierOpen(r);
      const draw = open ? T.CARPET : t;
      g.fillStyle(COLORS[draw], 1); g.fillRect(c * TILE, r * TILE, TILE, TILE);
      if (draw === T.FLOOR) { g.fillStyle(0x252e44, 0.6); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6); }
      if (draw === T.CARPET) { g.fillStyle(0x7a3040, 0.7); g.fillRect(c*TILE+5, r*TILE, TILE-10, TILE); }
      if (draw === T.WALL) { g.fillStyle(0x070a12); g.fillRect(c*TILE+3, r*TILE+4, 7, 9); g.fillRect(c*TILE+17, r*TILE+16, 8, 9); }
      if (draw === T.DAIS) { g.fillStyle(0x46587e, 0.8); g.fillRect(c*TILE+3, r*TILE+3, TILE-6, TILE-6); }
      if (t === T.BARRIER && !open) { g.fillStyle(0x88b0ff, 0.5); for (let i=0;i<3;i++) g.fillRect(c*TILE+4+i*9, r*TILE+3, 4, TILE-6); }
      if (draw === T.THRONE) { g.fillStyle(0xffd76a, 0.7); g.fillRect(c*TILE+6, r*TILE+4, TILE-12, TILE-8); }
    }
    const key = '__leagueMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(9 * TILE, 0.6 * TILE, '👑 Champion\'s Hall', {
      fontSize: '10px', color: '#ffe88a', backgroundColor: '#00000088', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(5);
    this.add.text(9 * TILE, 32.4 * TILE, '↓ Scholars\' Road', {
      fontSize: '9px', color: '#fff', backgroundColor: '#00000088', padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setDepth(5);
  }

  private drawMembers() {
    for (const m of [...MEMBERS, CHAMPION]) {
      if (this.defeated(m.key)) continue;
      const g = this.add.graphics().setDepth(8);
      drawNpcBody(g, m.color);
      g.setPosition(m.col * TILE + 16, m.row * TILE + 16);
      this.add.text(m.col * TILE + 16, m.row * TILE - 16,
        m.type === 'Champion' ? '👑 Hwangeum' : `${m.name} — ${m.type}`, {
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
    this.add.rectangle(this.scale.width / 2, 22, 400, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, '🏛 Hanbando Pokémon League', {
      fontSize: '13px', color: '#fff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, 'WASD: move  SPACE: challenge  M: menu', {
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
    for (const m of [...MEMBERS, CHAMPION]) {
      if (this.defeated(m.key)) continue;
      const wx = m.col * TILE + 16, wy = m.row * TILE + 16;
      if (Math.hypot(this.px - wx, this.py - wy) < TILE * 1.6) {
        this.cutsceneActive = true;
        // Each hall restores your team before the match — healing between battles.
        PartySystem.healAll(this.registry);
        this.dialog.show(['(The hall\'s healing machine restores your team to full health.)', ...m.intro], () => {
          this.registry.set('trainerName', m.name);
          this.registry.set('trainerKey', m.key);
          this.registry.set('trainerPokemon', JSON.stringify(m.pokemon));
          this.registry.set('trainerExpPool', m.expPool);
          this.registry.set('trainerReturnScene', 'PokemonLeagueScene');
          this.registry.set('leagueReturnX', m.col * TILE + 16);
          this.registry.set('leagueReturnY', (m.row + 1) * TILE + 16);
          this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return;
      }
    }
  }

  private checkExit() {
    if (this.cutsceneActive) return;
    if (this.py > (ROWS - 1) * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('leaguePlazaReturnX', 14 * 32); this.registry.set('leaguePlazaReturnY', 12 * 32 + 16);
        this.scene.start('LeaguePlazaScene');
      });
    }
  }

  // ── Hall of Fame ──────────────────────────────────────────────────────────
  private runHallOfFame() {
    this.registry.set('hallOfFame', true);
    this.registry.set('championDefeated', true);
    playBgm(this, 'halloffame');
    this.cutsceneActive = true;
    const W = this.scale.width, H = this.scale.height;

    // Starry overlay (zoom-compensated like DialogBox).
    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 1);
    const stars = this.add.graphics();
    for (let i = 0; i < 90; i++) {
      stars.fillStyle(0xffffff, Math.random() * 0.7 + 0.2);
      stars.fillCircle(Math.random() * W, Math.random() * H, Math.random() < 0.2 ? 2 : 1);
    }
    const kids: Phaser.GameObjects.GameObject[] = [bg, stars];

    // The dawn moth she now protects, small at the top.
    if (this.textures.exists('nabihalmang')) {
      const moth = this.add.image(W / 2, H * 0.12, 'nabihalmang').setAlpha(0);
      this.fitImg(moth, 120);
      this.tweens.add({ targets: moth, alpha: 1, duration: 1500 });
      kids.push(moth);
    }
    const title = this.add.text(W / 2, H * 0.04, '🏆 HALL OF FAME', {
      fontSize: '26px', color: '#ffe88a', fontStyle: 'bold', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);
    kids.push(title);

    // The champion's party, displayed graphically.
    const party = PartySystem.get(this.registry);
    const cols = 3, cellW = 230, cellH = 170;
    const rowsN = Math.ceil(Math.max(party.length, 1) / cols);
    const startY = H * 0.30 - (rowsN - 1) * cellH / 2;
    party.forEach((e, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const inRow = Math.min(party.length - row * cols, cols);
      const x = W / 2 + (col - (inRow - 1) / 2) * cellW;
      const y = startY + row * cellH;
      const items: Phaser.GameObjects.GameObject[] = [];
      if (this.textures.exists(e.spriteKey)) {
        const img = this.add.image(x, y, e.spriteKey).setAlpha(0);
        this.fitImg(img, 116);
        items.push(img);
      } else {
        items.push(this.add.circle(x, y, 40, 0x33405a).setAlpha(0));
      }
      const cap = this.add.text(x, y + 74, `${e.name}  Lv.${e.level}`, {
        fontSize: '13px', color: '#fff', fontStyle: 'bold', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setAlpha(0);
      items.push(cap);
      kids.push(...items);
      this.tweens.add({ targets: items, alpha: 1, duration: 600, delay: 400 + i * 220 });
    });

    const root = this.add.container(0, 0, kids).setScrollFactor(0).setDepth(140);
    const zoom = this.cameras.main?.zoom ?? 1, s = 1 / zoom;
    root.setScale(s); root.setPosition((W / 2) * (1 - s), (H / 2) * (1 - s));

    PartySystem.healAll(this.registry);
    this.registry.set('phase1Complete', true);
    this.dialog.show([
      'Hwangeum kneels to his fallen ace first — always his Pokémon first — then stands.',
      'Hwangeum: ...Good. Three years I\'ve wondered when someone would come who could do this. I think I\'ve been waiting for you specifically.',
      'Hwangeum (extending his hand): Welcome to the Hall of Fame. You earned every step of it.',
      '🏆 Your team is recorded in the Hall of Fame!',
      '— The credits roll over a montage of the Hanbando League arc — Capitol City, the Diamond Gorge, the tidal coasts, the ancient forest, the Jeju vents, the Jeju Summit —',
      "— culminating in 나비할망's metallic wings catching the dawn light as she settles beside you, the guardian of the south you have become.",
      'At the bottom of the League steps, your Rival is waiting — because of course they are.',
      "Rival: Champion of the south. And 나비할망's chosen one. Has a ring to it.",
      'Rival: I found something while you were climbing the league. In the far north, beyond Baekdu Peak — old texts, older than the gym records. References to another spirit. One that predates the Dancheong calendar.',
      'Prof. Song (comms): That\'s... troubling. The north has always been volatile. If something wakes there before we understand it, the whole peninsula could—',
      'Rival: Easy, Professor. We\'re barely sitting down. But when you\'re ready, Champion — the Taebaek range has some climbing left to do.',
      "Rival: ...Starting tomorrow, though. Tonight, you've earned the sleep.",
      '— THE END —',
      'Phase 1: Hanbando League — COMPLETE ✓',
      'Phase 2: Northern League — UNLOCKED',
      'Post-game unlocked: rechallenge the Rival in the Shadow Court, rematch Champion Hwangeum, explore the postgame world, and track the freed trio — 풍백, 우사, 운사 — at their mountain shrines.',
    ], () => {
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
  // Central hall corridor
  fill(2, ROWS, 5, 13, T.FLOOR);
  fill(0, 2, 7, 11, T.FLOOR);          // top (behind the throne)
  fill(ROWS - 2, ROWS, 7, 11, T.FLOOR); // entry from Scholars' Road
  // Daises under each Elite Four member + champion
  for (const r of [27, 22, 17, 12, 5]) fill(r - 1, r + 2, 7, 11, T.DAIS);
  fill(3, 6, 6, 12, T.THRONE);          // champion's throne platform
  // Sealed barriers above each Elite Four member
  for (const r of [25, 20, 15, 10]) fill(r, r + 1, 5, 13, T.BARRIER);
  return m;
}
