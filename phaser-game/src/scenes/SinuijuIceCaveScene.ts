import Phaser from 'phaser';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { EncounterEntry, pickEncounter, randomLevel } from '../data/CustomPokemon';

// ── Sinuiju Ice Cave (신의주 얼음 동굴) ────────────────────────────────────────────
// The 어사대장 Amrok's exam trial: an ice cavern under the frozen Amrok. The floor is
// sheer ice — step onto it and you SLIDE until a boulder or wall stops you (the classic
// ice-puzzle). Slide your way up through the frozen maze to the heart of the cave,
// where the Ice-Bound Beartic (얼음 툰베어) sleeps frozen into the wall — until you get
// close, and it shatters free as a 우두머리 boss.

const T = { WALL: 0, SNOW: 1, ICE: 2, ROCK: 3 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 15, ROWS = 27;
const SOLID = new Set<Tile>([T.WALL, T.ROCK]);

const THREAT_KEY = 'eosa-sinuiju-threat';   // '-threat' → TrainerBattleScene 우두머리 (aura + 2× HP)
const BEAR_COL = 7, BEAR_ROW = 4;           // the Beartic, frozen into the heart chamber

// Wild ice-dwellers, only in the entrance snowdrift.
const IC_ENCOUNTERS: EncounterEntry[] = [
  { id: 220, weight: 16, minLevel: 70, maxLevel: 72, isCustom: false, catchRate: 120 }, // Swinub
  { id: 459, weight: 13, minLevel: 70, maxLevel: 72, isCustom: false, catchRate: 90  }, // Snover
  { id: 215, weight: 12, minLevel: 70, maxLevel: 72, isCustom: false, catchRate: 90  }, // Sneasel
  { id: 225, weight: 10, minLevel: 70, maxLevel: 72, isCustom: false, catchRate: 120 }, // Delibird
  { id: 615, weight: 7,  minLevel: 71, maxLevel: 73, isCustom: false, catchRate: 60  }, // Cryogonal (rare)
];

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.WALL) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  // Heart chamber (top) — walkable frozen ground where the Beartic waits.
  fill(1, 9, 1, 14, T.SNOW);
  // Wall between heart and the slide puzzle, with a single passage at col 2.
  fill(9, 10, 1, 14, T.WALL); m[9][2] = T.SNOW;
  // The slide puzzle — one big ice field.
  fill(10, 20, 1, 14, T.ICE);
  // Wall between puzzle and entrance, passage at col 7.
  fill(20, 21, 1, 14, T.WALL); m[20][7] = T.SNOW;
  // Entrance snowdrift (bottom) — safe footing; wild ice Pokémon lurk here.
  fill(21, 26, 1, 14, T.SNOW);

  // Boulders that stop your slides — the solution is: UP, LEFT, UP.
  m[10][7] = T.ROCK;   // sliding up from the entrance stops you at row 11
  m[11][1] = T.ROCK;   // sliding left along row 11 stops you at col 2, right under the heart passage
  // A few decoy boulders to make the cavern feel real (off the solution path).
  m[13][11] = T.ROCK; m[16][4] = T.ROCK; m[18][10] = T.ROCK; m[15][12] = T.ROCK;
  return m;
}

export class SinuijuIceCaveScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private tc = 7; private tr = 24;    // tile coords; spawn in the entrance
  private facing = 1;
  private stepping = false;
  private dir = { dx: 0, dy: 0 };
  private cutscene = false;
  private beaten = false;

  constructor() { super('SinuijuIceCaveScene'); }

  create() {
    this.stepping = false; this.cutscene = false;
    playBgm(this, 'baekdupass');
    this.input.keyboard?.resetKeys();
    this.beaten = !!this.registry.get(`trainerDefeated_${THREAT_KEY}`);

    const rc = this.registry.get('iceCaveReturnCol') as number | undefined;
    const rr = this.registry.get('iceCaveReturnRow') as number | undefined;
    if (rc !== undefined) { this.tc = rc; this.tr = rr as number; }
    this.registry.remove('iceCaveReturnCol'); this.registry.remove('iceCaveReturnRow');

    this.map = buildMap();
    this.drawMap();
    if (!this.beaten) this.drawBeartic();
    this.createPlayer();
    this.setupCamera();
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.tc * TILE + 16, this.tr * TILE + 16, 'SinuijuIceCaveScene');

    // Returned from beating the Beartic → the cave is calm; head back to Amrok.
    if (this.beaten && !this.registry.get('iceCaveCleared')) {
      this.registry.set('iceCaveCleared', true);
      this.cutscene = true;
      this.time.delayedCall(500, () => this.dialog.show([
        'The Ice-Bound Beartic is driven from the cavern. The groaning of the ice fades to a deep, settled quiet.',
        '어사대장 Amrok will want to know the crossing is safe. Head back to Sinuiju.',
      ], () => {
        this.registry.set('SinuijuCitySceneReturnX', 13 * 32 + 16);
        this.registry.set('SinuijuCitySceneReturnY', 12 * 32 + 16);
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('SinuijuCityScene'));
      }));
    }
  }

  // ── Map ─────────────────────────────────────────────────────────────────
  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c]; const x = c * TILE, y = r * TILE;
      if (t === T.WALL) { g.fillStyle(0x24303f, 1); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x33475c, 1); g.fillRect(x + 2, y + 2, TILE - 4, TILE - 6); g.fillStyle(0x1a2330, 1); g.fillRect(x + 7, y + 8, 5, 4); }
      else if (t === T.ICE) { g.fillStyle(0x9fd6ee, 1); g.fillRect(x, y, TILE, TILE); g.fillStyle(0xc7ecf9, 0.9); g.fillRect(x + 1, y + 1, TILE - 2, TILE - 2); g.lineStyle(1, 0x7fbfe0, 0.7); g.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6); g.fillStyle(0xffffff, 0.7); g.fillRect(x + 6, y + 6, 8, 2); g.fillRect(x + 18, y + 20, 6, 2); }
      else if (t === T.SNOW) { g.fillStyle(0xe9f1f7, 1); g.fillRect(x, y, TILE, TILE); g.fillStyle(0xffffff, 0.7); g.fillCircle(x + 10, y + 12, 3); g.fillCircle(x + 22, y + 22, 2); }
      else if (t === T.ROCK) { g.fillStyle(0x9fd6ee, 1); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x5c6b7a, 1); g.fillTriangle(x + 16, y + 4, x + 3, y + 28, x + 29, y + 28); g.fillStyle(0x7f8f9e, 0.8); g.fillRect(x + 12, y + 12, 6, 5); g.fillStyle(0xdff0fb, 0.6); g.fillRect(x + 8, y + 24, TILE - 16, 4); }
    }
    const key = '__iceCaveMap__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);

    this.add.text(7 * TILE + 16, 25.4 * TILE, '↓ Sinuiju', { fontSize: '10px', color: '#fff', backgroundColor: '#3a5a8a99', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
    this.add.text(7.5 * TILE, 15 * TILE, '얼음길 — 미끄러진다!\n(the ice slides you)', { fontSize: '8px', color: '#0a3a4a', align: 'center', backgroundColor: '#cdeafaee', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(5);
    if (!this.beaten) this.add.text(BEAR_COL * TILE + 16, 1.4 * TILE, '❄ 얼음 동굴의 심장부 ❄', { fontSize: '9px', color: '#bfe8ff', fontStyle: 'bold', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(6);
  }

  private drawBeartic() {
    const g = this.add.graphics().setDepth(7);
    const cx = BEAR_COL * TILE + 16, cy = BEAR_ROW * TILE + 20;
    // a hulking frozen bear encased in a block of ice
    g.fillStyle(0x000000, 0.2); g.fillEllipse(cx, cy + 20, 46, 12);
    g.fillStyle(0xeaf6ff, 1); g.fillEllipse(cx, cy, 34, 40);                 // body
    g.fillStyle(0xf6fcff, 1); g.fillCircle(cx, cy - 20, 16);                 // head
    g.fillStyle(0x2a3550, 1); g.fillCircle(cx - 6, cy - 22, 2.5); g.fillCircle(cx + 6, cy - 22, 2.5); // eyes
    g.fillStyle(0xbfe0f0, 1); g.fillTriangle(cx - 4, cy - 8, cx + 4, cy - 8, cx, cy + 6); // ice beard
    g.fillStyle(0xffffff, 1); g.fillTriangle(cx - 14, cy - 30, cx - 10, cy - 30, cx - 12, cy - 40); g.fillTriangle(cx + 10, cy - 30, cx + 14, cy - 30, cx + 12, cy - 40); // ears
    // encasing ice sheen
    g.fillStyle(0xaad8f0, 0.28); g.fillRoundedRect(cx - 26, cy - 44, 52, 78, 8);
    this.tweens.add({ targets: g, alpha: { from: 1, to: 0.82 }, duration: 900, yoyo: true, repeat: -1 });
  }

  private createPlayer() {
    this.playerG = this.add.graphics().setDepth(20);
    this.drawChar();
    this.playerG.setPosition(this.tc * TILE + 16, this.tr * TILE + 16);
  }
  private drawChar() { this.playerG.clear(); drawTrainerBody(this.playerG, this.facing, 0, playerDesign(this.registry)); }
  private setupCamera() {
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(1.9);
    this.cameras.main.startFollow(this.playerG, true, 0.12, 0.12);
  }
  private setupInput() {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = { up: this.input.keyboard!.addKey('W'), down: this.input.keyboard!.addKey('S'), left: this.input.keyboard!.addKey('A'), right: this.input.keyboard!.addKey('D') };
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutscene) this.scene.launch('MenuScene'); });
  }
  private createUI() {
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.add.rectangle(this.scale.width / 2, 22, 420, 32, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, '❄ 신의주 얼음 동굴 (Ice Cave)', {
      fontSize: '14px', color: '#eaf6ff', fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, 'WASD/Arrows: move  (ice slides you until a rock stops you)  M: menu', {
      fontSize: '10px', color: '#cbe6f5', backgroundColor: '#00000088', padding: { x: 5, y: 2 },
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

  // ── Grid-step movement with ice sliding ──────────────────────────────────
  update() {
    if (this.cutscene) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
      return;
    }
    if (this.stepping) return;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    else if (this.cursors.right.isDown || this.wasd.right.isDown) { dx = 1; this.facing = 3; }
    else if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    else if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy = 1; this.facing = 0; }
    if (dx || dy) { this.drawChar(); this.tryStep(dx, dy); }
  }

  private tileAt(c: number, r: number): Tile | undefined { return this.map[r]?.[c]; }
  private solid(c: number, r: number): boolean {
    const t = this.tileAt(c, r);
    return t === undefined || SOLID.has(t);
  }

  private tryStep(dx: number, dy: number) {
    this.dir = { dx, dy };
    const nc = this.tc + dx, nr = this.tr + dy;
    if (this.solid(nc, nr)) { return; }   // blocked — a boulder/wall halts the slide
    const onIce = this.tileAt(this.tc, this.tr) === T.ICE || this.tileAt(nc, nr) === T.ICE;
    this.stepping = true;
    this.tweens.add({
      targets: this.playerG, x: nc * TILE + 16, y: nr * TILE + 16,
      duration: onIce ? 85 : 150, ease: 'Linear',
      onComplete: () => { this.tc = nc; this.tr = nr; this.stepping = false; this.onArrive(); },
    });
  }

  private onArrive() {
    if (this.tileAt(this.tc, this.tr) === T.ICE) { this.tryStep(this.dir.dx, this.dir.dy); return; }  // keep sliding
    this.checkBeartic();
    this.maybeEncounter();
    this.checkExit();
  }

  private checkBeartic() {
    if (this.beaten) return;
    if (Math.abs(this.tc - BEAR_COL) + Math.abs(this.tr - BEAR_ROW) > 1) return;
    this.cutscene = true;
    this.dialog.show([
      'At the heart of the cave, a great bear-shape sleeps frozen into the ice wall.',
      'As you draw near, a deep CRACK splinters the ice — and two cold eyes snap open.',
      'The Ice-Bound Beartic shatters free of the wall with a roar that shakes frost from the ceiling!',
    ], () => {
      this.registry.set('trainerName', '얼음 툰베어 (Ice-Bound Beartic)');
      this.registry.set('trainerKey', THREAT_KEY);
      this.registry.set('trainerPokemon', JSON.stringify([{ id: 614, level: 74 }]));
      this.registry.set('trainerExpPool', 3200);
      this.registry.set('trainerReturnScene', 'SinuijuIceCaveScene');
      this.registry.set('iceCaveReturnCol', this.tc); this.registry.set('iceCaveReturnRow', this.tr);
      this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
    });
  }

  private maybeEncounter() {
    if (this.tileAt(this.tc, this.tr) !== T.SNOW || this.tr < 21) return;   // only the entrance snowdrift
    if (Math.random() > 0.12) return;
    const e = pickEncounter(IC_ENCOUNTERS);
    this.registry.set('wildId', e.id);
    this.registry.set('wildLevel', randomLevel(e));
    this.registry.set('wildCustom', e.isCustom);
    this.registry.set('wildCatchRate', e.catchRate);
    this.registry.set('wildReturnScene', 'SinuijuIceCaveScene');
    this.registry.set('iceCaveReturnCol', this.tc); this.registry.set('iceCaveReturnRow', this.tr);
    this.cameras.main.fadeOut(400, 255, 255, 255, () => this.scene.start('WildBattleScene'));
  }

  private checkExit() {
    if (this.tr < ROWS - 1) return;   // walked off the bottom → back out to Sinuiju
    this.cutscene = true;
    this.cameras.main.fadeOut(400, 0, 0, 0, () => {
      this.registry.set('SinuijuCitySceneReturnX', 16 * 32); this.registry.set('SinuijuCitySceneReturnY', 21 * 32 + 16);
      this.scene.start('SinuijuCityScene');
    });
  }
}
