import Phaser from 'phaser';
import { tr } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { drawTrainerBody, playerDesign, drawGymLeader } from '../data/CharacterSprite';
import { vanishesAfterDefeat } from '../data/Villains';
import { DialogBox } from '../ui/DialogBox';

interface GymTrainer {
  key: string; name: string; line: string;
  col: number; row: number;
  pokemon: { id: number; level: number; custom?: string }[];
  expPool: number;
  defeated: boolean;
}

const IT = 36;

export class ForestGymScene extends Phaser.Scene {
  private playerG!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private dialog!: DialogBox;
  private cutsceneActive = false;
  private px = 0; private py = 0;
  private facing = 0; private walkFrame = 0; private walkTimer = 0;
  private readonly SPEED = 100;
  private readonly W = 16; private readonly H = 14;

  private trainers: GymTrainer[] = [
    {
      key: 'forest-chungha', name: 'Gym Trainer Chungha',
      line: 'Chungha: The temple grows as it pleases. So do my Pokémon — endlessly!',
      col: 5, row: 9,
      pokemon: [{ id: 0, level: 33, custom: 'kudzu' }, { id: 0, level: 34, custom: 'strawtle' }],
      expPool: 1100, defeated: false,
    },
    {
      key: 'forest-minho', name: 'Gym Trainer Minho',
      line: "Minho: Roots run deeper than you think. Mind your footing.",
      col: 10, row: 5,
      pokemon: [{ id: 0, level: 34, custom: 'ivelon' }, { id: 0, level: 35, custom: 'moransae' }],
      expPool: 1140, defeated: false,
    },
  ];

  constructor() { super('ForestGymScene'); }

  create() {

    playBgm(this, 'gyminterior');
    this.cutsceneActive = false;
    this.input.keyboard?.resetKeys();
    this.trainers.forEach(t => { t.defeated = !!this.registry.get(`trainerDefeated_${t.key}`); });

    this.px = 8 * IT + IT / 2;
    this.py = 11 * IT + IT / 2;

    // Return to where you were standing before the battle (not the entry).
    const gpx = this.registry.get('gymPosX') as number | undefined;
    const gpy = this.registry.get('gymPosY') as number | undefined;
    if (gpx !== undefined) { this.px = gpx; this.py = gpy as number; }
    this.registry.remove('gymPosX'); this.registry.remove('gymPosY');

    this.drawGym();
    this.drawTrainers();
    this.createPlayer();
    drawGymLeader(this, (this.W * IT) / 2, IT * 1.9, { body: 0x2a5a2a, accent: 0x88cc55, label: 'LEADER NOKSAEK', labelColor: '#b6f0a0', skin: 0xa88a55, hair: 0x3a5a2a });
    this.setupInput();
    this.cameras.main.setBounds(0, 0, this.W * IT, this.H * IT);
    this.cameras.main.startFollow(this.playerG, true, 0.1, 0.1);
    this.cameras.main.fadeIn(300);

    this.dialog = new DialogBox(this, 1280, 720);

    if (this.registry.get('forestGymDefeated') && !this.registry.get('noksaekFarewell')) {
      this.registry.set('noksaekFarewell', true);
      this.cutsceneActive = true;
      this.dialog.show([
        'Noksaek: The roots accept you. Well fought.',
        'Noksaek: The seventh seal lies near the eastern coast — the Sunrise Cliffs.',
        'Noksaek: But I sense something stirring far to the south as well. The Grandmother wakes uneasily.',
        'You may leave through the south door whenever you are ready.',
      ], () => { this.cutsceneActive = false; });
      return;
    }

    this.dialog.show([
      'You enter the Living Temple (생명 신전)!',
      'A vast greenhouse-shrine where vines and roots grow in real time, opening and blocking the way.',
      'Defeat the two Gym Trainers, then face Leader Noksaek, the Ancient Keeper.',
    ], () => { this.cutsceneActive = false; });
    this.cutsceneActive = true;
  }

  private drawGym() {
    const g = this.add.graphics().setDepth(0);
    const W = this.W * IT, H = this.H * IT;
    // Mossy temple floor
    g.fillStyle(0x1f3a1e); g.fillRect(0, 0, W, H);
    for (let r = 1; r < this.H - 1; r++) for (let c = 1; c < this.W - 1; c++) {
      const col = (r + c) % 2 === 0 ? 0x274a24 : 0x21401f;
      g.fillStyle(col); g.fillRect(c * IT, r * IT, IT, IT);
    }
    // Walls (dark bark)
    g.fillStyle(0x0e2410);
    g.fillRect(0, 0, W, IT); g.fillRect(0, 0, IT, H);
    g.fillRect(W - IT, 0, IT, H); g.fillRect(0, H - IT, W, IT);
    // Glowing spores along the sides
    for (let r = 2; r < this.H - 1; r += 2) {
      g.fillStyle(0x88ffcc, 0.8); g.fillCircle(1 * IT + IT / 2, r * IT + IT / 2, 6);
      g.fillStyle(0xccff88, 0.8); g.fillCircle((this.W - 2) * IT + IT / 2, r * IT + IT / 2, 6);
    }
    // Keeper dais (living wood)
    g.fillStyle(0x3a5a28); g.fillRect(4 * IT, IT, 8 * IT, IT * 1.4);
    g.lineStyle(2, 0x9fe06a); g.strokeRect(4 * IT, IT, 8 * IT, IT * 1.4);
    // Door
    g.fillStyle(0x6b4a28); g.fillRect(7 * IT, H - IT, 2 * IT, IT);

    const texKey = '__forestGymMap__';
    if (this.textures.exists(texKey)) this.textures.remove(texKey);
    g.generateTexture(texKey, W, H); g.destroy();
    this.add.image(0, 0, texKey).setOrigin(0, 0).setDepth(0);

    this.add.text(W / 2, H - IT / 2, '🚪', { fontSize: '20px' }).setOrigin(0.5).setDepth(5);
    this.add.text(W / 2, IT * 1.7, tr('🌿 LIVING TEMPLE'), {
      fontSize: '11px', color: '#bfffa0', fontStyle: 'bold', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(5);
    if (this.trainers.every(t => t.defeated) && !this.registry.get('forestGymDefeated')) {
      this.add.text(W / 2, IT * 2.4, tr('← KEEPER NOKSAEK →'), { fontSize: '9px', color: '#cfffb0' })
        .setOrigin(0.5).setDepth(5);
    }
  }

  private drawTrainers() {
    for (const tr of this.trainers) {
      if (tr.defeated && vanishesAfterDefeat(tr.key)) continue;
      const x = tr.col * IT + IT / 2, y = tr.row * IT + IT / 2;
      const g = this.add.graphics().setDepth(10);
      g.setPosition(x, y);
      g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 16, 5);
      g.fillStyle(0x4a8a3a); g.fillRect(-7, -8, 14, 11);
      g.fillStyle(0x4a8a3a); g.fillRect(-11, -7, 5, 8); g.fillRect(6, -7, 5, 8);
      g.fillStyle(0x222222); g.fillRect(-6, 3, 5, 9); g.fillRect(1, 3, 5, 9);
      g.fillStyle(0xffcc99); g.fillRect(-6, -20, 12, 11);
      g.fillStyle(0x1a2a10); g.fillRect(-6, -20, 12, 4);
      g.fillStyle(0x000000); g.fillRect(-3, -14, 2, 2); g.fillRect(1, -14, 2, 2);
      this.add.text(x, y - 28, tr.name.split(' ').pop() ?? tr.name, {
        fontSize: '8px', color: '#bfffa0', backgroundColor: '#00000088', padding: { x: 2, y: 1 },
      }).setOrigin(0.5).setDepth(11);
    }
  }

  private createPlayer() { this.playerG = this.add.graphics().setDepth(20); this.redrawPlayer(); }
  private redrawPlayer() {
    const g = this.playerG;
    // Gender-aware body (was a hardcoded red-shirt boy).
    drawTrainerBody(g, this.facing, this.walkFrame, playerDesign(this.registry));
    g.setPosition(this.px, this.py);
  }

  private setupInput() {
    this.cursors  = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.wasd = {
      up:    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left:  this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => { if (!this.cutsceneActive) this.scene.launch('MenuScene'); });
  }

  update(_: number, delta: number) {
    if (this.cutsceneActive) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
      return;
    }
    const dt = delta / 1000;
    let dx = 0, dy = 0;
    if (this.cursors.left.isDown  || this.wasd.left.isDown)  { dx = -1; this.facing = 2; }
    if (this.cursors.right.isDown || this.wasd.right.isDown) { dx =  1; this.facing = 3; }
    if (this.cursors.up.isDown    || this.wasd.up.isDown)    { dy = -1; this.facing = 1; }
    if (this.cursors.down.isDown  || this.wasd.down.isDown)  { dy =  1; this.facing = 0; }
    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = this.px + (dx / len) * this.SPEED * dt;
      const ny = this.py + (dy / len) * this.SPEED * dt;
      const wall = (x: number, y: number) => x < IT || x > (this.W - 1) * IT || y < IT || y > (this.H - 1) * IT;
      if (!wall(nx, this.py)) this.px = nx;
      if (!wall(this.px, ny)) this.py = ny;
      this.walkTimer += delta;
      if (this.walkTimer > 180) { this.walkFrame ^= 1; this.walkTimer = 0; }
    } else { this.walkFrame = 0; }
    this.redrawPlayer();
    this.checkTrainers();
    this.checkLeaderApproach();
    this.checkExit();
  }

  private checkTrainers() {
    for (const tr of this.trainers) {
      if (!tr.defeated && !!this.registry.get(`trainerDefeated_${tr.key}`)) tr.defeated = true;
    }
    for (const tr of this.trainers) {
      if (tr.defeated) continue;
      const tx = tr.col * IT + IT / 2, ty = tr.row * IT + IT / 2;
      if (Math.hypot(this.px - tx, this.py - ty) < IT * 1.4) {
        this.cutsceneActive = true;
        this.dialog.show([tr.line, `${tr.name}: Take root and fight!`], () => {
          this.registry.set('trainerName',        tr.name);
          this.registry.set('trainerKey',         tr.key);
          this.registry.set('trainerPokemon',     JSON.stringify(tr.pokemon));
          this.registry.set('trainerExpPool',     tr.expPool);
          this.registry.set('trainerReturnScene', 'ForestGymScene');
          this.registry.set('gymPosX', this.px); this.registry.set('gymPosY', this.py);
          this.registry.set('forestCityReturnX', this.px);
          this.registry.set('forestCityReturnY', this.py);
          this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
        });
        return;
      }
    }
  }

  private checkLeaderApproach() {
    if (!this.trainers.every(t => t.defeated)) return;
    if (this.registry.get('forestGymDefeated')) return;
    if (this.py < IT * 2.8 && !this.cutsceneActive) {
      this.cutsceneActive = true;
      this.dialog.show([
        '(An old keeper rises from the living dais, bark-skinned and calm.)',
        "Noksaek: I am Noksaek, Keeper of the Living Temple. I have tended these roots for a hundred years.",
        'Noksaek: Grass is not weakness. It is patience that splits stone. Show me yours.',
        "Noksaek: Let the temple judge you. Begin.",
      ], () => {
        this.registry.set('trainerName',        'Leader Noksaek');
        this.registry.set('trainerKey',         'forest-noksaek');
        this.registry.set('trainerPokemon', JSON.stringify([
          { id: 0,   level: 35, custom: 'gorcobat' },   // Grass/Fighting (Trop Kick)
          { id: 0,   level: 35, custom: 'kudzu' },       // Grass/Normal
          { id: 0,   level: 36, custom: 'strawtle' },   // Grass/Water
          { id: 0,   level: 37, custom: 'ghograss' },   // Grass/Ghost (Spirit Shackle)
          { id: 407, level: 38 },                        // Roserade (Grass/Poison ace, Petal Dance)
        ]));
        this.registry.set('trainerExpPool',     2000);
        this.registry.set('trainerReturnScene', 'ForestGymScene');
        this.registry.set('gymPosX', this.px); this.registry.set('gymPosY', this.py);
        this.registry.set('trainerBadgeFlag',   'forestGymDefeated');
        this.registry.set('trainerBadgeName',   'Ancient Keeper Badge');
        this.registry.set('trainerBadgeTM',     'Wood Hammer');
        this.registry.set('trainerWinLine',     'Noksaek: The forest has spoken. You are worthy to pass.');
        this.registry.set('forestCityReturnX', this.px);
        this.registry.set('forestCityReturnY', this.py);
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
      });
    }
  }

  private checkExit() {
    if (this.py > (this.H - 2) * IT && this.px > 6.5 * IT && this.px < 9.5 * IT && !this.cutsceneActive) {
      this.cameras.main.fadeOut(300, 0, 0, 0, () => this.scene.start('ForestCityScene'));
    }
  }
}
