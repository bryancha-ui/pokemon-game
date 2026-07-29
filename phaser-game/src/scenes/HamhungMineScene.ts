import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { vanishesAfterDefeat } from '../data/Villains';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, drawNpcBody, playerDesign } from '../data/CharacterSprite';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { maybeLaunchEvolution } from '../systems/EvolutionSystem';
import { EncounterEntry, pickEncounter, randomLevel } from '../data/CustomPokemon';

// ── Hamhung Ore Mine (함흥 광산) ─────────────────────────────────────────────────
// The pit that feeds Hamhung's furnaces, reached by the paved pit road at the south
// edge of town. Rock galleries, ore veins, molten runoff and minecart rails — and
// deep in the tunnels, the berserk Steelix that Chief Cheolju sends you to subdue.

const T = { FLOOR: 0, WALL: 1, ORE: 2, TRACK: 3, LAVA: 4 } as const;
type Tile = typeof T[keyof typeof T];
const TILE = 32, COLS = 22, ROWS = 20;
const COLORS: Record<Tile, number> = { [T.FLOOR]: 0x584f45, [T.WALL]: 0x38322a, [T.ORE]: 0x6a6152, [T.TRACK]: 0x4c463c, [T.LAVA]: 0xcf5720 };
const SOLID = new Set<Tile>([T.WALL, T.ORE, T.LAVA]);
const ENCOUNTER = new Set<Tile>([T.FLOOR, T.TRACK]);

const THREAT_KEY = 'eosa-hamhung-threat';
const THREAT = { col: 11, row: 15 };

// Wild rock / steel / ground Pokémon of the deep galleries.
const HM_ENCOUNTERS: EncounterEntry[] = [
  { id: 75,  weight: 16, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 120 }, // Graveler
  { id: 95,  weight: 14, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 120 }, // Onix
  { id: 305, weight: 12, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 90  }, // Lairon
  { id: 525, weight: 12, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 120 }, // Boldore
  { id: 82,  weight: 10, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 90  }, // Magneton
  { id: 28,  weight: 10, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 120 }, // Sandslash
  { id: 529, weight: 10, minLevel: 66, maxLevel: 68, isCustom: false, catchRate: 120 }, // Drilbur
  { id: 208, weight: 4,  minLevel: 67, maxLevel: 69, isCustom: false, catchRate: 45  }, // Steelix (rare)
];

function buildMap(): Tile[][] {
  const m: Tile[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(T.FLOOR) as Tile[]);
  const fill = (r1: number, r2: number, c1: number, c2: number, t: Tile) => {
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++)
      if (r >= 0 && r < ROWS && c >= 0 && c < COLS) m[r][c] = t;
  };
  // rock walls around the gallery
  fill(0, 2, 0, COLS, T.WALL); fill(ROWS - 2, ROWS, 0, COLS, T.WALL);
  fill(0, ROWS, 0, 2, T.WALL); fill(0, ROWS, COLS - 2, COLS, T.WALL);
  fill(0, 2, 9, 13, T.FLOOR);   // mouth of the mine (entrance from Hamhung)
  // minecart rails running down the central gallery to the Steelix
  for (let r = 2; r < 18; r++) { m[r][10] = T.TRACK; m[r][11] = T.TRACK; }
  // rock pillars & ore veins off to the sides
  for (const [r, c] of [[5,6],[5,7],[6,6],[13,5],[14,5],[16,15],[16,16],[7,15],[8,15]] as [number,number][]) m[r][c] = T.WALL;
  for (const [r, c] of [[4,4],[8,17],[12,3],[15,17],[6,4],[17,7]] as [number,number][]) m[r][c] = T.ORE;
  // molten runoff pools, well clear of the central rails
  fill(10, 13, 3, 5, T.LAVA);
  fill(6, 8, 16, 19, T.LAVA);
  return m;
}

interface Trainer { key: string; name: string; col: number; row: number; color: number; label: string; line: string; pokemon: string; expPool: number; }

export class HamhungMineScene extends Phaser.Scene {
  private map!: Tile[][];
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private dialog!: DialogBox;
  private enterPrompt!: Phaser.GameObjects.Text;
  private px = 11 * TILE + 16; private py = 3 * TILE + 16;
  private facing = 0; private walkFrame = 0; private walkTimer = 0;
  private cutsceneActive = false;
  private spawnGuard = false; private spawnPx = 0; private spawnPy = 0;
  private steps = 0; private nextEnc = 8;
  private readonly SPEED = 120; private readonly RUN = 250;
  private threatG?: Phaser.GameObjects.Container;

  private readonly TRAINERS: Trainer[] = [
    { key: 'mine-gwang', name: 'Miner Gwang', col: 5, row: 9, color: 0x8a6a3a, label: 'Miner',
      line: "Careful down here — the Steelix has the deep gallery. Warm up on me first!",
      pokemon: JSON.stringify([{ id: 75, level: 66 }, { id: 95, level: 67 }]), expPool: 2000 },
    { key: 'mine-cheol', name: 'Worker Cheol', col: 16, row: 12, color: 0x6a6f7a, label: 'Worker',
      line: "Furnace won't light till that beast's dealt with. Prove you're up to it — battle me!",
      pokemon: JSON.stringify([{ id: 525, level: 67 }, { id: 530, level: 68 }]), expPool: 2100 },
  ];

  constructor() { super('HamhungMineScene'); }

  private get missionTaken() { return !!this.registry.get('HamhungCitySceneMissionTaken'); }
  private get steelixDone() { return !!this.registry.get('trainerDefeated_' + THREAT_KEY); }

  create() {
    this.cutsceneActive = false; this.walkFrame = 0; this.walkTimer = 0; this.steps = 0;
    playBgm(this, 'dolmoemine');
    this.input.keyboard?.resetKeys();
    const rx = this.registry.get('HamhungMineSceneReturnX') as number | undefined;
    const ry = this.registry.get('HamhungMineSceneReturnY') as number | undefined;
    if (rx !== undefined) { this.px = rx; this.py = ry as number; } else { this.px = 11 * TILE + 16; this.py = 3 * TILE + 16; }
    this.registry.remove('HamhungMineSceneReturnX'); this.registry.remove('HamhungMineSceneReturnY');
    this.spawnPx = this.px; this.spawnPy = this.py;
    this.spawnGuard = true; this.time.delayedCall(500, () => { this.spawnGuard = false; });

    this.map = buildMap();
    this.drawMap();
    this.spawnThreat();
    this.drawTrainers();
    this.playerG = this.add.graphics().setDepth(20); this.drawChar();
    this.cameras.main.setBounds(0, 0, COLS * TILE, ROWS * TILE);
    this.cameras.main.setZoom(1.7);
    this.cameras.main.startFollow(this.playerG, true, 0.1, 0.1);
    this.setupInput();
    this.createUI();
    this.cameras.main.fadeIn(400);
    SaveManager.save(this.registry, this.px, this.py, 'HamhungMineScene');
    this.time.delayedCall(300, () => maybeLaunchEvolution(this));
  }

  private drawMap() {
    const g = this.make.graphics({ x: 0, y: 0 });
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const t = this.map[r][c]; const x = c * TILE, y = r * TILE;
      g.fillStyle(COLORS[t], 1); g.fillRect(x, y, TILE, TILE);
      if (t === T.FLOOR) { g.fillStyle(0x4a423a, 0.6); g.fillRect(x + 6, y + 9, 4, 3); g.fillRect(x + 18, y + 20, 4, 3); }
      if (t === T.WALL) { g.fillStyle(0x4a4236); g.fillRect(x + 3, y + 4, 8, 8); g.fillRect(x + 17, y + 16, 8, 8); }
      if (t === T.ORE) { g.fillStyle(0x4a4236); g.fillRect(x, y, TILE, TILE); g.fillStyle(0x8fd0ff); g.fillRect(x + 8, y + 8, 5, 5); g.fillStyle(0xffe066); g.fillRect(x + 18, y + 16, 4, 4); }
      if (t === T.TRACK) { g.fillStyle(0x6a6152); g.fillRect(x + 6, y, 3, TILE); g.fillRect(x + 22, y, 3, TILE); g.fillStyle(0x3a342c); for (let i = 0; i < 4; i++) g.fillRect(x + 4, y + 3 + i * 9, 24, 3); }
      if (t === T.LAVA) { g.fillStyle(0xff8a3a, 0.8); g.fillRect(x + 4, y + 6, 12, 4); g.fillStyle(0xffd06a, 0.7); g.fillRect(x + 14, y + 18, 8, 4); }
    }
    const key = '__hamhungMine__';
    if (this.textures.exists(key)) this.textures.remove(key);
    g.generateTexture(key, COLS * TILE, ROWS * TILE); g.destroy();
    this.add.image(0, 0, key).setOrigin(0, 0).setDepth(0);
    this.add.text(11 * TILE, 0.6 * TILE, '↑ Hamhung', { fontSize: '9px', color: '#fff', backgroundColor: '#3a5a8a99', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(5);
  }

  private spawnThreat() {
    if (!this.missionTaken || this.steelixDone) return;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillEllipse(0, 15, 34, 9);
    g.fillStyle(0x8a8f98, 1); g.fillCircle(0, 0, 15);            // steel body
    g.fillStyle(0x666b74, 1); g.fillCircle(0, 5, 13);
    for (let i = -1; i <= 1; i++) { g.fillStyle(0xb0b6c0, 1); g.fillRect(i * 9 - 4, -13, 8, 8); }   // segments
    g.fillStyle(0xff5a2a, 1); g.fillCircle(-5, -3, 3.4); g.fillCircle(5, -3, 3.4);                  // glowing eyes
    g.fillStyle(0x000000, 1); g.fillCircle(-5, -2, 1.5); g.fillCircle(5, -2, 1.5);
    g.lineStyle(2, 0x2a2a2a, 1); g.beginPath(); g.moveTo(-10, -8); g.lineTo(-2, -5); g.moveTo(10, -8); g.lineTo(2, -5); g.strokePath();
    const label = this.add.text(0, -32, tr('⚠ Berserk Steelix (폭주 강철톤)'), { fontSize: '9px', color: '#ff9a6a', fontStyle: 'bold', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }).setOrigin(0.5);
    const cont = this.add.container(THREAT.col * TILE + 16, THREAT.row * TILE + 16, [g, label]).setDepth(9);
    this.tweens.add({ targets: cont, y: cont.y - 5, duration: 540, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.threatG = cont;
  }

  private drawTrainers() {
    for (const tr of this.TRAINERS) {
      if (this.registry.get('trainerDefeated_' + tr.key) && vanishesAfterDefeat(tr.key)) continue;
      const g = this.add.graphics().setDepth(8);
      drawNpcBody(g, tr.color, { hair: 0x2a2622 });
      g.setPosition(tr.col * TILE + 16, tr.row * TILE + 16);
      this.add.text(tr.col * TILE + 16, tr.row * TILE - 12, tr.label, { fontSize: '8px', color: '#fff', backgroundColor: '#00000088', padding: { x: 2, y: 1 } }).setOrigin(0.5).setDepth(9);
    }
  }

  private drawChar() {
    drawTrainerBody(this.playerG, this.facing, this.walkFrame, playerDesign(this.registry));
    this.playerG.setPosition(this.px, this.py);
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
    this.enterPrompt = this.add.text(this.scale.width / 2, this.scale.height - 34, '', { fontSize: '13px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 8, y: 4 } }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false);
    this.add.rectangle(this.scale.width / 2, 22, 360, 30, 0x000000, 0.6).setScrollFactor(0).setDepth(50);
    this.add.text(this.scale.width / 2, 22, tr('⛏ Hamhung Ore Mine (함흥 광산)'), { fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(51);
    this.add.text(this.scale.width / 2, this.scale.height - 8, tr('WASD move  SPACE act  M menu   ·   Subdue the Steelix in the deep gallery'), { fontSize: '10px', color: '#ccc', backgroundColor: '#00000088', padding: { x: 5, y: 2 } }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(51);
  }

  update(_: number, delta: number) {
    if (this.cutsceneActive) {
      if (this.dialog.isInChoice()) {
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.dialog.navigateChoice(-1);
        if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.dialog.navigateChoice(1);
        if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.confirmChoice();
      } else if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
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
      const len = Math.hypot(dx, dy);
      const nx = this.px + (dx / len) * speed * dt, ny = this.py + (dy / len) * speed * dt;
      if (!this.collides(nx, this.py)) this.px = nx;
      if (!this.collides(this.px, ny)) this.py = ny;
      this.walkTimer += delta; if (this.walkTimer > (running ? 100 : 180)) { this.walkFrame ^= 1; this.walkTimer = 0; this.steps++; this.checkEncounter(); }
    } else this.walkFrame = 0;
    this.drawChar();
    if (this.checkThreat()) return;
    if (this.checkTrainers()) return;
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

  private checkEncounter() {
    const col = Math.floor(this.px / TILE), row = Math.floor(this.py / TILE);
    const t = this.map[row]?.[col];
    if (t === undefined || !ENCOUNTER.has(t)) { this.steps = 0; return; }
    if (this.steps < this.nextEnc) return;
    if (Math.random() > 0.18) return;
    this.steps = 0; this.nextEnc = 7 + Math.floor(Math.random() * 8);
    const e = pickEncounter(HM_ENCOUNTERS);
    this.registry.set('wildId', e.id);
    this.registry.set('wildLevel', randomLevel(e));
    this.registry.set('wildCustom', e.isCustom);
    this.registry.set('wildCatchRate', e.catchRate);
    this.registry.set('wildReturnScene', 'HamhungMineScene');
    this.registry.set('HamhungMineSceneReturnX', this.px); this.registry.set('HamhungMineSceneReturnY', this.py);
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('WildBattleScene'));
  }

  private checkThreat(): boolean {
    if (!this.missionTaken || this.steelixDone) return false;
    const tx = THREAT.col * TILE + 16, ty = THREAT.row * TILE + 16;
    if (Math.hypot(this.px - tx, this.py - ty) > TILE * 1.5) return false;
    this.enterPrompt.setText(tr('SPACE — Subdue the Steelix')).setVisible(true);
    if (!Phaser.Input.Keyboard.JustDown(this.spaceKey)) return true;
    this.cutsceneActive = true; this.enterPrompt.setVisible(false);
    this.dialog.show([
      'Heat and ore-dust roll through the gallery. The Steelix rears from the rock, plates glowing dull red.',
      'It lunges, shaking the whole tunnel. Hold your ground!',
    ], () => {
      this.registry.set('trainerName', 'Berserk Steelix (폭주 강철톤)');
      this.registry.set('trainerKey', THREAT_KEY);
      this.registry.set('trainerPokemon', JSON.stringify([{ id: 208, level: 72 }]));
      this.registry.set('trainerExpPool', 1900);
      this.registry.set('trainerReturnScene', 'HamhungMineScene');
      this.registry.set('HamhungMineSceneReturnX', tx);
      this.registry.set('HamhungMineSceneReturnY', ty + TILE);
      this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
    });
    return true;
  }

  private checkTrainers(): boolean {
    for (const tr of this.TRAINERS) {
      if (this.registry.get('trainerDefeated_' + tr.key)) continue;
      if (Math.hypot(this.px - (tr.col * TILE + 16), this.py - (tr.row * TILE + 16)) < TILE * 1.5) {
        this.cutsceneActive = true; this.enterPrompt.setVisible(false);
        this.registry.set('trainerName', tr.name);
        this.registry.set('trainerKey', tr.key);
        this.registry.set('trainerPokemon', tr.pokemon);
        this.registry.set('trainerExpPool', tr.expPool);
        this.registry.set('trainerReturnScene', 'HamhungMineScene');
        this.registry.set('HamhungMineSceneReturnX', this.px); this.registry.set('HamhungMineSceneReturnY', this.py);
        this.dialog.show([tr.line, `${tr.name}: Let's battle!`], () => {
          this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return true;
      }
    }
    return false;
  }

  private checkExit() {
    if (this.cutsceneActive || this.spawnGuard) return;
    if (Math.hypot(this.px - this.spawnPx, this.py - this.spawnPy) < 1.4 * TILE) return;
    // Mine mouth (north edge, centre) → back up the pit road to Hamhung.
    if (this.py < 1.5 * TILE && this.px > 8 * TILE && this.px < 14 * TILE) {
      this.cutsceneActive = true;
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('HamhungCitySceneReturnX', 30 * 32 + 16);
        this.registry.set('HamhungCitySceneReturnY', 21 * 32 + 16);
        this.scene.start('HamhungCityScene');
      });
    }
  }
}
