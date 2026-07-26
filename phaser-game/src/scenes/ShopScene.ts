import Phaser from 'phaser';
import { pushBgm, popBgm } from '../systems/Music';
import { ITEMS, ItemDef, Inventory, formatMoney } from '../systems/Items';

/** Default stock sold in town marts. */
const STOCK = ['potion', 'superpotion', 'hyperpotion', 'antidote', 'paralyzeheal', 'fullheal',
               'revive', 'ether', 'elixir', 'pokeball', 'greatball', 'ultraball'];

export class ShopScene extends Phaser.Scene {
  private parentKey = 'CapitolCityScene';
  private moneyText!: Phaser.GameObjects.Text;
  private feedbackText!: Phaser.GameObjects.Text;
  private rows: { def: ItemDef; ownedText: Phaser.GameObjects.Text }[] = [];
  private escKey!: Phaser.Input.Keyboard.Key;
  private stock: string[] = STOCK;
  private shopTitle = '🏪  POKÉ MART';

  private get W() { return this.scale.width; }
  private get H() { return this.scale.height; }

  constructor() { super('ShopScene'); }

  init(data: { parentKey?: string; stock?: string[]; title?: string }) {
    this.parentKey = data.parentKey ?? 'CapitolCityScene';
    this.stock = (data.stock && data.stock.length) ? data.stock : STOCK;
    this.shopTitle = data.title ?? '🏪  POKÉ MART';
  }

  create() {
    // This scene instance is reused across every mart, and its GameObjects are
    // destroyed on close — so clear the row list, or refresh() would touch stale
    // (destroyed) text objects from a previous visit and throw.
    this.rows = [];

    pushBgm(this, 'mart');   // remember the city track so it resumes when the shop closes
    this.scene.bringToTop();   // draw the shop above the Pokémon Center / city scene
    Inventory.ensureInit(this.registry);
    this.cameras.main.fadeIn(150);
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x07070f, 0.97);

    this.add.text(this.W / 2, 36, this.shopTitle, {
      fontSize: '24px', color: '#66ddaa', fontStyle: 'bold', stroke: '#113322', strokeThickness: 4,
    }).setOrigin(0.5);
    this.moneyText = this.add.text(this.W - 30, 36, '', { fontSize: '18px', color: '#ffe44e' }).setOrigin(1, 0.5);

    this.add.text(30, 36, '✕ EXIT', { fontSize: '15px', color: '#aaa' })
      .setOrigin(0, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.close())
      .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#fff'); })
      .on('pointerout',  function (this: Phaser.GameObjects.Text) { this.setColor('#aaa'); });

    this.feedbackText = this.add.text(this.W / 2, this.H - 28, '', { fontSize: '14px', color: '#aaffaa' }).setOrigin(0.5);
    this.add.text(this.W / 2, this.H - 8, 'Click BUY ×1 or BUY ×5   ·   ESC to exit', { fontSize: '11px', color: '#778' }).setOrigin(0.5);

    // Item rows
    const startY = 86, rowH = 52;
    this.stock.forEach((key, i) => {
      const def = ITEMS.find(it => it.key === key);
      if (!def) return;
      const y = startY + i * rowH;
      const cx = this.W / 2;
      this.add.rectangle(cx, y, 900, rowH - 6, 0x111526).setStrokeStyle(1, 0x2a3550);
      this.add.text(cx - 430, y, def.icon, { fontSize: '24px' }).setOrigin(0.5);
      this.add.text(cx - 400, y - 12, def.name, { fontSize: '16px', color: '#fff', fontStyle: 'bold' });
      this.add.text(cx - 400, y + 9, def.desc, { fontSize: '11px', color: '#99aabb' });
      this.add.text(cx + 110, y, formatMoney(def.price), { fontSize: '15px', color: '#ffe44e' }).setOrigin(1, 0.5);
      const owned = this.add.text(cx + 130, y, '', { fontSize: '12px', color: '#88aacc' }).setOrigin(0, 0.5);
      this.rows.push({ def, ownedText: owned });

      this.makeBuyButton(cx + 250, y, def, 1);
      this.makeBuyButton(cx + 360, y, def, 5);
    });

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.refresh();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) this.close();
  }

  private makeBuyButton(x: number, y: number, def: ItemDef, qty: number) {
    const btn = this.add.rectangle(x, y, 96, 30, 0x1a3a5a).setStrokeStyle(1, 0x3a6aaa)
      .setInteractive({ useHandCursor: true });
    const lbl = this.add.text(x, y, `BUY ×${qty}`, { fontSize: '13px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    btn.on('pointerover', () => btn.setFillStyle(0x2a5a8a));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a3a5a));
    btn.on('pointerdown', () => this.buy(def, qty));
    void lbl;
  }

  private buy(def: ItemDef, qty: number) {
    const total = def.price * qty;
    if (!Inventory.spend(this.registry, total)) {
      this.flash(`Not enough money for ${qty}× ${def.name}.`, '#ff8888');
      return;
    }
    Inventory.add(this.registry, def.key, qty);
    this.flash(`Bought ${qty}× ${def.name}!  (-${formatMoney(total)})`, '#aaffaa');
    this.refresh();
  }

  private flash(msg: string, color: string) {
    this.feedbackText.setText(msg).setColor(color);
  }

  private refresh() {
    this.moneyText.setText(`Money: ${formatMoney(Inventory.money(this.registry))}`);
    this.rows.forEach(r => {
      const n = Inventory.count(this.registry, r.def.key);
      r.ownedText.setText(n > 0 ? `(have ${n})` : '');
    });
  }

  private close() {
    this.cameras.main.fadeOut(150, 0, 0, 0, () => {
      popBgm(this);   // restore the city's music (the resumed parent won't re-run create)
      this.scene.stop();
      this.scene.resume(this.parentKey);
    });
  }
}
