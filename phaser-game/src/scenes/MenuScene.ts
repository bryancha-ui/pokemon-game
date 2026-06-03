import Phaser from 'phaser';
import { STARTERS, TYPE_COLORS } from '../data/StarterData';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem, PartyEntry } from '../systems/PartySystem';

export class MenuScene extends Phaser.Scene {
  private tab: 'pokemon' | 'bag' = 'pokemon';
  private tabPokemon!: Phaser.GameObjects.Text;
  private tabBag!:     Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private escKey!: Phaser.Input.Keyboard.Key;

  private get W() { return this.scale.width; }
  private get H() { return this.scale.height; }

  constructor() { super({ key: 'MenuScene' }); }

  preload() {
    // Load sprites for any caught Pokémon whose textures aren't cached yet
    STARTERS.forEach(s => {
      if (!this.textures.exists(s.spriteKey))
        this.load.image(s.spriteKey, s.data.spriteUrl);
    });
    const party = PartySystem.get(this.registry);
    party.forEach(entry => {
      if (entry.spriteKey && !this.textures.exists(entry.spriteKey) && entry.spriteUrl) {
        this.load.image(entry.spriteKey, entry.spriteUrl);
      }
    });
  }

  create() {
    this.cameras.main.fadeIn(180);

    // Dim overlay (covers full canvas)
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);

    // Main panel
    this.add.rectangle(this.W / 2, this.H / 2, 780, 540, 0x0d0d2e, 0.97)
      .setStrokeStyle(2, 0x5577aa);

    // ── Header ──────────────────────────────────────────────────────────────
    this.add.text(this.W / 2, this.H / 2 - 248, '— MENU —', {
      fontSize: '18px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Tab buttons ──────────────────────────────────────────────────────────
    this.tabPokemon = this.add.text(this.W / 2 - 80, this.H / 2 - 218, 'POKÉMON', {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#1a3a6a',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('pokemon'));

    this.tabBag = this.add.text(this.W / 2 + 60, this.H / 2 - 218, 'BAG', {
      fontSize: '14px', color: '#aaaaaa', backgroundColor: '#111133',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('bag'));

    // ── Save button ──────────────────────────────────────────────────────────
    const saveBtn = this.add.text(this.W / 2 - 340, this.H / 2 - 248, '💾 SAVE', {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#1a3a1a',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    saveBtn.on('pointerdown', () => {
      const px = (this.registry.get('returnX') as number) ?? 22 * 32 + 16;
      const py = (this.registry.get('returnY') as number) ?? 24 * 32 + 16;
      SaveManager.save(this.registry, px, py);
      saveBtn.setText('💾 SAVED!').setColor('#aaffaa');
      this.time.delayedCall(1500, () => saveBtn.setText('💾 SAVE').setColor('#ffe44e'));
    });

    // ── Close button ─────────────────────────────────────────────────────────
    this.add.text(this.W / 2 + 370, this.H / 2 - 248, '✕ CLOSE', {
      fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeMenu())
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#aaaaaa'); });

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => this.closeMenu());

    this.contentContainer = this.add.container(0, 0);
    this.renderPokemonTab();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) this.closeMenu();
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  private switchTab(tab: 'pokemon' | 'bag') {
    this.tab = tab;
    this.tabPokemon.setColor(tab === 'pokemon' ? '#ffffff' : '#888888')
      .setBackgroundColor(tab === 'pokemon' ? '#1a3a6a' : '#111133');
    this.tabBag.setColor(tab === 'bag' ? '#ffffff' : '#888888')
      .setBackgroundColor(tab === 'bag' ? '#1a3a6a' : '#111133');
    this.contentContainer.destroy(true);
    this.contentContainer = this.add.container(0, 0);
    if (tab === 'pokemon') this.renderPokemonTab();
    else                   this.renderBagTab();
  }

  // ── Pokémon tab — shows ALL party members ────────────────────────────────

  private renderPokemonTab() {
    const party = PartySystem.get(this.registry);
    const cx    = this.W / 2;
    const cy    = this.H / 2;

    if (party.length === 0) {
      const t = this.add.text(cx, cy + 20,
        "You have no Pokémon yet.\nVisit Prof. Kim's Lab to choose your starter!",
        { fontSize: '14px', color: '#cccccc', align: 'center', lineSpacing: 8 },
      ).setOrigin(0.5);
      this.contentContainer.add(t);
      return;
    }

    // ── Layout: 2-column card grid ────────────────────────────────────────
    const cardW = 348, cardH = 90;
    const gridX = [cx - 194, cx + 194];   // left / right column centers
    const startY = cy - 165;
    const rowH   = 100;

    party.forEach((entry, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x   = gridX[col];
      const y   = startY + row * rowH;

      this.drawPartyCard(entry, x, y, cardW, cardH, i === 0);
    });

    // Empty slots
    for (let i = party.length; i < 6; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x   = gridX[col];
      const y   = startY + row * rowH;
      const bg  = this.add.rectangle(x, y, cardW, cardH, 0x0a0a22, 0.6)
        .setStrokeStyle(1, 0x223355);
      const lbl = this.add.text(x, y, '— empty —', { fontSize: '12px', color: '#334466' })
        .setOrigin(0.5);
      this.contentContainer.add([bg, lbl]);
    }
  }

  private drawPartyCard(entry: PartyEntry, x: number, y: number, w: number, h: number, isLead: boolean) {
    // Background — gold border for lead Pokémon
    const bg = this.add.rectangle(x, y, w, h, 0x111133, 1)
      .setStrokeStyle(isLead ? 2 : 1, isLead ? 0xffe44e : 0x3355aa);
    this.contentContainer.add(bg);

    const lx = x - w / 2 + 8;   // left edge

    // Sprite (if texture cached in this scene, show it; otherwise type square)
    const sprKey = entry.spriteKey;
    if (this.textures.exists(sprKey)) {
      const img = this.add.image(x - w / 2 + 36, y, sprKey);
      const tex = this.textures.get(sprKey).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      img.setScale(Math.min(70, 70) / dim);
      this.contentContainer.add(img);
    } else {
      // Coloured square based on type
      const typeCol = TYPE_COLORS[entry.type1 as keyof typeof TYPE_COLORS] ?? 0x555577;
      const sq = this.add.rectangle(x - w / 2 + 36, y, 60, 60, typeCol, 0.5)
        .setStrokeStyle(1, typeCol);
      const tl = this.add.text(x - w / 2 + 36, y, entry.type1.toUpperCase()[0],
        { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      this.contentContainer.add([sq, tl]);
    }

    // Name + level
    const name = this.add.text(lx + 72, y - 28, entry.name.toUpperCase(), {
      fontSize: '15px', color: isLead ? '#ffe44e' : '#ffffff', fontStyle: 'bold',
    });
    const lv = this.add.text(x + w / 2 - 8, y - 28, `Lv.${entry.level}`,
      { fontSize: '13px', color: '#aaccff' }).setOrigin(1, 0);
    this.contentContainer.add([name, lv]);

    // Types
    const types = [entry.type1, entry.type2].filter(Boolean) as string[];
    types.forEach((t, ti) => {
      const pill = this.add.rectangle(lx + 80 + ti * 56, y - 6, 50, 14,
        TYPE_COLORS[t as keyof typeof TYPE_COLORS] ?? 0x334466, 1);
      const tTxt = this.add.text(lx + 80 + ti * 56, y - 6, t.toUpperCase(),
        { fontSize: '8px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
      this.contentContainer.add([pill, tTxt]);
    });

    // HP bar
    const ratio = Math.max(0, entry.hp / entry.maxHp);
    const barW  = w - 90;
    const barColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddcc00 : 0xcc4444;
    const hpTrack  = this.add.rectangle(lx + 72 + barW / 2, y + 16, barW, 8, 0x222244);
    const hpFill   = this.add.rectangle(lx + 72, y + 16, Math.max(0, barW * ratio), 8, barColor).setOrigin(0, 0.5);
    const hpTxt    = this.add.text(x + w / 2 - 8, y + 11, `${entry.hp}/${entry.maxHp}`,
      { fontSize: '10px', color: '#aaaaaa' }).setOrigin(1, 0);
    this.contentContainer.add([hpTrack, hpFill, hpTxt]);

    // Moves (compact)
    const moveSummary = entry.moves.slice(0, 2).join('  ·  ');
    if (moveSummary) {
      const mt = this.add.text(lx + 72, y + 28, moveSummary,
        { fontSize: '10px', color: '#7788bb' });
      this.contentContainer.add(mt);
    }
  }

  // ── Bag tab ───────────────────────────────────────────────────────────────

  private renderBagTab() {
    const cx    = this.W / 2;
    const cy    = this.H / 2;
    const balls  = (this.registry.get('pokeballs') as number) ?? 0;
    const hasShoes = !!this.registry.get('hasRunningShoes');

    const items: { name: string; desc: string; icon: string; count?: number }[] = [];
    if (balls > 0 || true) items.push({ name: 'Pokéball', desc: 'Throw in battle to catch Pokémon.', icon: '🔴', count: balls });
    if (hasShoes)           items.push({ name: 'Running Shoes', desc: 'Hold SHIFT to run fast.', icon: '👟' });

    if (items.length === 0 || (balls === 0 && !hasShoes)) {
      const t = this.add.text(cx, cy + 20, 'Your bag is empty.', {
        fontSize: '15px', color: '#888888',
      }).setOrigin(0.5);
      this.contentContainer.add(t);
      return;
    }

    items.forEach((item, i) => {
      const y   = cy - 120 + i * 80;
      const row = this.add.rectangle(cx, y, 560, 62, 0x111133).setStrokeStyle(1, 0x334466);
      const icon = this.add.text(cx - 252, y, item.icon, { fontSize: '26px' }).setOrigin(0.5);
      const nm   = this.add.text(cx - 218, y - 10, item.name, { fontSize: '15px', color: '#ffe44e', fontStyle: 'bold' });
      const desc = this.add.text(cx - 218, y + 12, item.desc, { fontSize: '12px', color: '#aaaaaa' });
      this.contentContainer.add([row, icon, nm, desc]);
      if (item.count !== undefined) {
        const cnt = this.add.text(cx + 260, y, `×${item.count}`, { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(1, 0.5);
        this.contentContainer.add(cnt);
      }
    });
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  private closeMenu() {
    this.cameras.main.fadeOut(150, 0, 0, 0, () => {
      this.scene.stop('MenuScene');
    });
  }
}
