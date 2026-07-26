import Phaser from 'phaser';
import { AVATAR_URL } from '../data/PlayerAvatar';

// ── New-game character select ───────────────────────────────────────────────────
// The very first step of a new game: pick boy or girl. The rival is always the
// opposite gender. The chosen portraits are shown in trainer battles.

export class GenderSelectScene extends Phaser.Scene {
  private choice: 'boy' | 'girl' = 'boy';
  private panels: Record<'boy' | 'girl', Phaser.GameObjects.Rectangle> = {} as never;

  private get W() { return this.scale.width; }
  private get H() { return this.scale.height; }

  constructor() { super('GenderSelectScene'); }

  preload() {
    for (const [key, url] of Object.entries(AVATAR_URL)) {
      if (!this.textures.exists(key)) this.load.image(key, url);
    }
  }

  create() {
    this.cameras.main.fadeIn(300);
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x0a0e1c, 1);

    this.add.text(this.W / 2, 70, 'Who are you?', {
      fontSize: '30px', color: '#ffe44e', fontStyle: 'bold', stroke: '#221133', strokeThickness: 5,
    }).setOrigin(0.5);
    this.add.text(this.W / 2, 112, 'Choose your character. Your rival will be the opposite.', {
      fontSize: '15px', color: '#bcd',
    }).setOrigin(0.5);

    this.buildPanel('boy',  this.W / 2 - 230, 'Boy',  'Rival: a girl');
    this.buildPanel('girl', this.W / 2 + 230, 'Girl', 'Rival: a boy');

    this.add.text(this.W / 2, this.H - 44, '← →  choose      SPACE / click  confirm', {
      fontSize: '14px', color: '#8ab', backgroundColor: '#00000066', padding: { x: 10, y: 5 },
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown-LEFT',  () => this.select('boy'));
    this.input.keyboard!.on('keydown-RIGHT', () => this.select('girl'));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on('down', () => this.confirm());
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER).on('down', () => this.confirm());

    this.select('boy');
  }

  private buildPanel(g: 'boy' | 'girl', cx: number, label: string, sub: string) {
    const key = g === 'boy' ? 'trainer_boy' : 'trainer_girl';
    const panel = this.add.rectangle(cx, this.H / 2 + 10, 320, 400, 0x14203a, 1).setStrokeStyle(3, 0x33507e)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.select(g))
      .on('pointerdown', () => { this.select(g); this.confirm(); });
    this.panels[g] = panel;

    if (this.textures.exists(key)) {
      const img = this.add.image(cx, this.H / 2 - 10, key);
      const src = this.textures.get(key).getSourceImage();
      img.setScale(Math.min(280 / (src.width as number), 300 / (src.height as number)));
    }
    this.add.text(cx, this.H / 2 + 158, label, { fontSize: '22px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, this.H / 2 + 188, sub,   { fontSize: '13px', color: '#9ab' }).setOrigin(0.5);
  }

  private select(g: 'boy' | 'girl') {
    this.choice = g;
    this.panels.boy.setStrokeStyle(this.choice === 'boy' ? 4 : 3, this.choice === 'boy' ? 0xffe44e : 0x33507e);
    this.panels.girl.setStrokeStyle(this.choice === 'girl' ? 4 : 3, this.choice === 'girl' ? 0xffe44e : 0x33507e);
  }

  private confirm() {
    this.registry.set('playerGender', this.choice);
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('WorldMapScene'));
  }
}
