import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { STARTERS } from '../data/StarterData';

export class TitleScene extends Phaser.Scene {
  private selected = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private confirmKey!: Phaser.Input.Keyboard.Key;
  private hasSave = false;
  private stars: Phaser.GameObjects.Arc[] = [];
  private floatObjs: Phaser.GameObjects.GameObject[] = [];

  // Use actual canvas dimensions so it adapts to any resolution
  private get W() { return this.scale.width; }
  private get H() { return this.scale.height; }

  constructor() { super('TitleScene'); }

  preload() {
    STARTERS.forEach(s => {
      if (!this.textures.exists(s.spriteKey))
        this.load.image(s.spriteKey, s.data.spriteUrl);
    });
  }

  create() {
    this.hasSave = SaveManager.exists();
    this.cameras.main.fadeIn(900);

    this.drawBackground();
    this.drawStars();
    this.drawStarters();
    this.drawLogoArea();
    this.drawMenu();
    this.drawSaveInfo();
    this.setupInput();
    this.refreshSelection();
  }

  update() {
    // Twinkle stars
    this.stars.forEach((s, i) => {
      s.alpha = 0.4 + Math.sin(Date.now() / 700 + i) * 0.35;
    });
    // Gentle float on starter silhouettes
    this.floatObjs.forEach((o, i) => {
      const img = o as Phaser.GameObjects.Image;
      img.y += Math.sin(Date.now() / 1200 + i * 2.1) * 0.3;
    });
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground() {
    const g = this.add.graphics();

    // Deep purple-midnight gradient (sky)
    g.fillGradientStyle(0x0a000f, 0x0a000f, 0x220033, 0x220033, 1);
    g.fillRect(0, 0, this.W, this.H);

    // Ground silhouette — dark purple hills
    g.fillStyle(0x110018, 1);
    g.fillRect(0, this.H * 0.72, this.W, this.H * 0.28);

    // Mountain silhouettes
    const hills = [
      [0, this.H * 0.72, 220, this.H * 0.48],
      [180, this.H * 0.72, 500, this.H * 0.38],
      [440, this.H * 0.72, 800, this.H * 0.42],
      [720, this.H * 0.72, 1080, this.H * 0.36],
      [1000, this.H * 0.72, 1280, this.H * 0.50],
    ];
    g.fillStyle(0x1a0028, 1);
    for (const [lx, ly, rx, ty] of hills) {
      const mx = (lx + rx) / 2;
      g.fillTriangle(lx, ly, mx, ty, rx, ly);
    }

    // Purple moon glow
    g.fillStyle(0xaa44ff, 0.10);
    g.fillCircle(this.W * 0.78, this.H * 0.14, 110);
    // Moon
    g.fillStyle(0xeeddff, 1);
    g.fillCircle(this.W * 0.78, this.H * 0.14, 44);
    // Crescent cutout
    g.fillStyle(0x1a0030, 1);
    g.fillCircle(this.W * 0.78 - 18, this.H * 0.14 - 10, 38);

    // Subtle purple fog near ground
    g.fillGradientStyle(0x330055, 0x330055, 0x330055, 0x330055, 0, 0, 0.25, 0.25);
    g.fillRect(0, this.H * 0.62, this.W, this.H * 0.12);
  }

  // ── Stars ─────────────────────────────────────────────────────────────────

  private drawStars() {
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(0, this.W);
      const y = Phaser.Math.Between(0, this.H * 0.68);
      const r = Math.random() < 0.12 ? 2.5 : Math.random() < 0.3 ? 1.5 : 1;
      const col = Math.random() < 0.2 ? 0xddaaff : 0xffffff;
      const s = this.add.arc(x, y, r, 0, 360, false, col, 0.8);
      this.stars.push(s);
    }
  }

  // ── Starter silhouettes ───────────────────────────────────────────────────

  private drawStarters() {
    const keys = ['munkain', 'vipour', 'onnurian'];
    const xs   = [this.W * 0.12, this.W * 0.5, this.W * 0.88];
    const ys   = [this.H * 0.60, this.H * 0.56, this.H * 0.60];
    const size = 130;

    keys.forEach((key, i) => {
      if (!this.textures.exists(key)) return;
      const img = this.add.image(xs[i], ys[i], key).setDepth(1);
      const tex = this.textures.get(key).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      img.setScale(size / dim)
         .setAlpha(0.30)
         .setTint(0x6600aa);

      // Subtle hover reveal
      img.setInteractive()
         .on('pointerover',  () => this.tweens.add({ targets: img, alpha: 0.75, duration: 200 }))
         .on('pointerout',   () => this.tweens.add({ targets: img, alpha: 0.30, duration: 200 }));

      this.floatObjs.push(img);
    });
  }

  // ── Logo area ─────────────────────────────────────────────────────────────

  private drawLogoArea() {
    const cx = this.W / 2;

    // ── "P O K É M O N" header — small caps, letter-spaced ───────────────
    this.add.text(cx, this.H * 0.13, 'P  O  K  É  M  O  N', {
      fontSize:   '22px',
      color:      '#ddbbff',
      fontFamily: 'Arial, sans-serif',
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(5);

    // ── Main Korean title ─────────────────────────────────────────────────
    // Layer 4 — darkest shadow
    this.addLogoLayer(cx + 6, this.H * 0.26, '포켓몬스터', '80px', '#1a0030');
    // Layer 3
    this.addLogoLayer(cx + 4, this.H * 0.26 - 2, '포켓몬스터', '80px', '#330055');
    // Layer 2
    this.addLogoLayer(cx + 2, this.H * 0.26 - 4, '포켓몬스터', '80px', '#660099');
    // Layer 1 — main purple
    this.addLogoLayer(cx,     this.H * 0.26 - 6, '포켓몬스터', '80px', '#aa44ee',
      { stroke: '#ffffff', strokeThickness: 3 });

    // ── English subtitle ──────────────────────────────────────────────────
    // Shadow layers
    this.addLogoLayer(cx + 5, this.H * 0.40, 'STRING', '62px', '#1a0030');
    this.addLogoLayer(cx + 3, this.H * 0.40 - 2, 'STRING', '62px', '#44006e');
    // Main
    this.addLogoLayer(cx,     this.H * 0.40 - 4, 'STRING', '62px', '#cc66ff',
      { stroke: '#ffffff', strokeThickness: 2 });

    // ── Decorative line under title ───────────────────────────────────────
    const lineG = this.add.graphics().setDepth(5);
    lineG.fillStyle(0xaa44ff, 0.6);
    lineG.fillRect(cx - 220, this.H * 0.47, 440, 2);
    lineG.fillStyle(0xffffff, 0.3);
    lineG.fillRect(cx - 180, this.H * 0.47 + 3, 360, 1);

    // ── Pokéball icon (top-left of title, like the reference) ─────────────
    const pbG = this.add.graphics().setDepth(5);
    const pbx = cx - 250, pby = this.H * 0.26 - 6;
    const pbr = 20;
    pbG.fillStyle(0xee2222, 1); pbG.fillCircle(pbx, pby, pbr);
    pbG.fillStyle(0xffffff, 1); pbG.fillRect(pbx - pbr, pby, pbr * 2, pbr);
    pbG.lineStyle(3, 0x222222, 1); pbG.strokeCircle(pbx, pby, pbr);
    pbG.lineStyle(2, 0x222222, 1); pbG.lineBetween(pbx - pbr, pby, pbx + pbr, pby);
    pbG.fillStyle(0xffffff, 1); pbG.fillCircle(pbx, pby, 6);
    pbG.lineStyle(2, 0x222222, 1); pbG.strokeCircle(pbx, pby, 6);
  }

  private addLogoLayer(
    x: number, y: number, text: string, fontSize: string, color: string,
    extra?: { stroke?: string; strokeThickness?: number },
  ) {
    this.add.text(x, y, text, {
      fontSize,
      color,
      fontStyle:  'bold',
      fontFamily: '"Arial Black", Impact, Arial, sans-serif',
      stroke:          extra?.stroke,
      strokeThickness: extra?.strokeThickness ?? 0,
    }).setOrigin(0.5).setDepth(4);
  }

  // ── Menu ──────────────────────────────────────────────────────────────────

  private drawMenu() {
    const cx = this.W / 2;
    const options = ['▶  NEW GAME', '▶  CONTINUE'];

    this.menuItems = options.map((label, i) => {
      const disabled = i === 1 && !this.hasSave;
      const t = this.add.text(cx, this.H * 0.57 + i * 48, label, {
        fontSize:   '24px',
        color:      disabled ? '#553366' : '#ffffff',
        fontStyle:  'bold',
        fontFamily: 'Arial, sans-serif',
        stroke:     disabled ? undefined : '#330055',
        strokeThickness: disabled ? 0 : 3,
      }).setOrigin(0.5).setDepth(6);

      if (!disabled) {
        t.setInteractive({ useHandCursor: true })
         .on('pointerdown', () => { this.selected = i; this.confirm(); })
         .on('pointerover', () => { this.selected = i; this.refreshSelection(); });
      }
      return t;
    });
  }

  // ── Save info ─────────────────────────────────────────────────────────────

  private drawSaveInfo() {
    if (!this.hasSave) return;
    const save = SaveManager.load();
    if (!save) return;

    const info = save.starterName
      ? `${save.starterName}  Lv.${save.starterLevel}  ·  ${SaveManager.formatDate(save.timestamp)}`
      : SaveManager.formatDate(save.timestamp);

    this.add.text(this.W / 2, this.H * 0.69, `Save data: ${info}`, {
      fontSize: '13px', color: '#9966cc',
    }).setOrigin(0.5).setDepth(6);
  }

  // ── Input ─────────────────────────────────────────────────────────────────

  private setupInput() {
    this.cursors    = this.input.keyboard!.createCursorKeys();
    this.confirmKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
      .on('down', () => this.confirm());

    this.cursors.up.on('down',   () => { this.selected = Math.max(0, this.selected - 1); this.refreshSelection(); });
    this.cursors.down.on('down', () => { this.selected = Math.min(1, this.selected + 1); this.refreshSelection(); });
    this.confirmKey.on('down', () => this.confirm());
  }

  private refreshSelection() {
    this.menuItems.forEach((t, i) => {
      const disabled = i === 1 && !this.hasSave;
      if (disabled) return;
      const active = i === this.selected;
      t.setColor(active ? '#ffddff' : '#ffffff')
       .setScale(active ? 1.08 : 1);
      // Glow effect for selected
      t.setStroke(active ? '#aa44ff' : '#330055', active ? 5 : 3);
    });
  }

  // ── Confirm ───────────────────────────────────────────────────────────────

  private confirm() {
    if (this.selected === 1 && !this.hasSave) return;

    this.cameras.main.fadeOut(500, 0, 0, 0, () => {
      if (this.selected === 0) {
        SaveManager.delete();
        this.registry.reset();
        this.scene.start('WorldMapScene');
      } else {
        const save = SaveManager.load();
        if (save) SaveManager.restore(this.registry, save);
        this.scene.start('WorldMapScene');
      }
    });
  }
}
