import Phaser from 'phaser';
import { tr, typeName } from '../systems/i18n';
import { STARTERS, TYPE_COLORS } from '../data/StarterData';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem, PartyEntry } from '../systems/PartySystem';
import { displayMoves, buildFromEntry } from '../systems/PartyBattle';
import { TM_MOVE_DATA } from '../data/TMs';
import type { MoveData } from '../battle/Pokemon';
import { t } from '../systems/i18n';

// Battle data for HM field moves, so teaching one on a full moveset can offer the
// same "which move to forget?" picker that TMs use.
const HM_MOVE_DATA: Record<string, MoveData> = {
  fly: { name: 'Fly', type: 'flying', category: 'physical', power: 90, accuracy: 95, pp: 15 },
};
import { DexTracker } from '../systems/DexTracker';
import { ITEMS, Inventory, itemDef, useItemOnSlot, teachHM, canLearnMove, formatMoney } from '../systems/Items';
import { TMS } from '../data/TMs';
import { BADGES } from '../data/Badges';

export class MenuScene extends Phaser.Scene {
  private tab: 'pokemon' | 'bag' = 'pokemon';
  private tabPokemon!: Phaser.GameObjects.Text;
  private tabBag!:     Phaser.GameObjects.Text;
  private contentContainer!: Phaser.GameObjects.Container;
  private escKey!: Phaser.Input.Keyboard.Key;
  private upKey!: Phaser.Input.Keyboard.Key;
  private downKey!: Phaser.Input.Keyboard.Key;
  private bagScroll = 0;       // first visible bag row
  private bagMaxScroll = 0;    // clamp bound, set each bag render

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
    this.scene.bringToTop();   // render above the field/route scene that launched it
    this.cameras.main.fadeIn(180);

    // Retroactive: any trainer who already has a starter owns a Pokédex
    if (this.registry.get('starterChosen') && !this.registry.get('hasPokedex')) {
      DexTracker.grantPokedex(this.registry);
    }
    DexTracker.syncCaughtFromParty(this.registry);

    // Retroactive: champions who earned Fly before it was a Bag item get the HM now.
    if (this.registry.get('hasFlyHM') && Inventory.count(this.registry, 'hm_fly') === 0) {
      Inventory.add(this.registry, 'hm_fly', 1);
    }
    // Retroactive: any gym already beaten grants its TM (they weren't Bag items before).
    for (const tm of TMS) {
      if (this.registry.get(tm.badgeFlag) && Inventory.count(this.registry, tm.key) === 0) {
        Inventory.add(this.registry, tm.key, 1);
      }
    }

    // Dim overlay (covers full canvas)
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.65);

    // Main panel
    this.add.rectangle(this.W / 2, this.H / 2, 780, 540, 0x0d0d2e, 0.97)
      .setStrokeStyle(2, 0x5577aa);

    // ── Header ──────────────────────────────────────────────────────────────
    this.add.text(this.W / 2, this.H / 2 - 248, t('— MENU —', '— 메뉴 —'), {
      fontSize: '18px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5);

    // ── Tab buttons ──────────────────────────────────────────────────────────
    this.tabPokemon = this.add.text(this.W / 2 - 80, this.H / 2 - 218, t('POKÉMON', '포켓몬'), {
      fontSize: '14px', color: '#ffffff', backgroundColor: '#1a3a6a',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('pokemon'));

    this.tabBag = this.add.text(this.W / 2 + 60, this.H / 2 - 218, t('BAG', '가방'), {
      fontSize: '14px', color: '#aaaaaa', backgroundColor: '#111133',
      padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.switchTab('bag'));

    // ── Save button ──────────────────────────────────────────────────────────
    const saveBtn = this.add.text(this.W / 2 - 340, this.H / 2 - 248, t('💾 SAVE', '💾 저장'), {
      fontSize: '13px', color: '#ffe44e', backgroundColor: '#1a3a1a',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    saveBtn.on('pointerdown', () => {
      // Save into the scene the player is actually in (tracked by SaveManager),
      // not the WorldMap default — otherwise resume drops them in the wrong map.
      const scene = (this.registry.get('lastScene') as string) ?? 'WorldMapScene';
      const px = (this.registry.get('lastX') as number) ?? (this.registry.get('returnX') as number) ?? 22 * 32 + 16;
      const py = (this.registry.get('lastY') as number) ?? (this.registry.get('returnY') as number) ?? 24 * 32 + 16;
      const ok = SaveManager.save(this.registry, px, py, scene);
      if (ok) saveBtn.setText(tr('💾 SAVED!')).setColor('#aaffaa');
      else    saveBtn.setText(tr('⚠ SAVE FAILED')).setColor('#ff8888');
      this.time.delayedCall(1800, () => saveBtn.setText('💾 SAVE').setColor('#ffe44e'));
    });

    // ── Close button ─────────────────────────────────────────────────────────
    this.add.text(this.W / 2 + 370, this.H / 2 - 248, t('✕ CLOSE', '✕ 닫기'), {
      fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.closeMenu())
      .on('pointerover', function(this: Phaser.GameObjects.Text) { this.setColor('#ffffff'); })
      .on('pointerout',  function(this: Phaser.GameObjects.Text) { this.setColor('#aaaaaa'); });

    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => this.closeMenu());
    this.upKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.downKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    // Mouse-wheel scrolling for the bag list.
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (this.tab === 'bag') this.scrollBag(dy > 0 ? 1 : -1);
    });

    this.bagScroll = 0;
    this.contentContainer = this.add.container(0, 0);
    this.renderPokemonTab();
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) this.closeMenu();
    if (this.tab === 'bag') {
      if (Phaser.Input.Keyboard.JustDown(this.downKey)) this.scrollBag(1);
      if (Phaser.Input.Keyboard.JustDown(this.upKey))   this.scrollBag(-1);
    }
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────

  private switchTab(tab: 'pokemon' | 'bag') {
    if (tab === 'bag' && this.tab !== 'bag') this.bagScroll = 0;   // fresh bag view starts at the top
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
        tr("You have no Pokémon yet.\nVisit Prof. Song's Lab to choose your starter!"),
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

      this.drawPartyCard(entry, x, y, cardW, cardH, i === 0, i);
    });

    // Hint
    this.contentContainer.add(this.add.text(cx, cy + 196,
      tr('Tap a Pokémon to make it your lead (first in battle).'),
      { fontSize: '11px', color: '#8899bb' }).setOrigin(0.5));

    // Empty slots
    for (let i = party.length; i < 6; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x   = gridX[col];
      const y   = startY + row * rowH;
      const bg  = this.add.rectangle(x, y, cardW, cardH, 0x0a0a22, 0.6)
        .setStrokeStyle(1, 0x223355);
      const lbl = this.add.text(x, y, tr('— empty —'), { fontSize: '12px', color: '#334466' })
        .setOrigin(0.5);
      this.contentContainer.add([bg, lbl]);
    }
  }

  private drawPartyCard(entry: PartyEntry, x: number, y: number, w: number, h: number, isLead: boolean, index = 0) {
    // Background — gold border for lead Pokémon. Tapping a non-lead promotes it.
    const bg = this.add.rectangle(x, y, w, h, 0x111133, 1)
      .setStrokeStyle(isLead ? 2 : 1, isLead ? 0xffe44e : 0x3355aa);
    this.contentContainer.add(bg);
    if (!isLead) {
      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => bg.setStrokeStyle(2, 0x77aaff))
        .on('pointerout',  () => bg.setStrokeStyle(1, 0x3355aa))
        .on('pointerdown', () => {
          PartySystem.setLead(this.registry, index);
          this.showToast(`${entry.name.toUpperCase()} is now your lead!`);
          this.switchTab('pokemon');
        });
    }
    // Lead badge
    const tag = this.add.text(x + w / 2 - 8, y + h / 2 - 12,
      isLead ? '★ LEAD' : 'set lead',
      { fontSize: '9px', color: isLead ? '#ffe44e' : '#6688bb' }).setOrigin(1, 1);
    this.contentContainer.add(tag);

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

    // Moves (compact) — computed from the current level/form so newly-learned
    // moves show up as the Pokémon grows, not just its capture-time moves.
    const moveSummary = displayMoves(entry).slice(0, 2).join('  ·  ');
    if (moveSummary) {
      const mt = this.add.text(lx + 72, y + 28, moveSummary,
        { fontSize: '10px', color: '#7788bb' });
      this.contentContainer.add(mt);
    }
  }

  // ── Bag tab ───────────────────────────────────────────────────────────────

  private renderBagTab() {
    const cx = this.W / 2;
    Inventory.ensureInit(this.registry);
    const hasShoes = !!this.registry.get('hasRunningShoes');
    const hasDex   = !!this.registry.get('hasPokedex');

    // Money
    this.contentContainer.add(this.add.text(cx + 280, this.H / 2 - 210, `💰 ${formatMoney(Inventory.money(this.registry))}`,
      { fontSize: '15px', color: '#ffe44e' }).setOrigin(1, 0.5));

    type Row = { name: string; desc: string; icon: string; count?: number; onClick?: () => void };
    const rows: Row[] = [];

    // Town Map — always available; view the whole region and (post-League) Fly.
    rows.push({
      name: 'Town Map', icon: '🗺️',
      desc: 'See the region and where you are.' + (this.registry.get('hasFlyHM') ? ' Fly between cities.' : ''),
      onClick: () => { this.scene.launch('RegionMapScene', { parentKey: 'MenuScene' }); this.scene.pause(); },
    });

    if (hasDex) rows.push({
      name: 'Pokémon Encyclopedia', icon: '📖',
      desc: 'Browse every Pokémon you have seen and caught.',
      onClick: () => { this.scene.launch('PokedexScene', { parentKey: 'MenuScene' }); this.scene.pause(); },
    });

    // Gym Badges — showcase every badge earned so far.
    const badgeCount = BADGES.filter(b => this.registry.get(b.flag)).length;
    rows.push({
      name: 'Gym Badges', icon: '🏅',
      desc: `${badgeCount} of ${BADGES.length} badges collected. Tap to view your case.`,
      onClick: () => this.showBadgeCase(),
    });

    // Key items — HMs sit near the top (with the map/dex) so they're always visible.
    const inv = Inventory.all(this.registry);
    for (const def of ITEMS) {
      if (def.category !== 'hm' || (inv[def.key] ?? 0) <= 0) continue;
      rows.push({
        name: def.name, icon: def.icon,
        desc: def.desc + (def.move ? ' Tap to teach.' : ''),
        onClick: () => this.beginTeachHM(def.key),
      });
    }

    // Consumable items (heal / status / revive / ball)
    for (const def of ITEMS) {
      const n = inv[def.key] ?? 0;
      if (n <= 0 || def.category === 'hm') continue;
      rows.push({
        name: def.name, icon: def.icon, desc: def.desc, count: n,
        onClick: (def.category === 'ball' || def.category === 'souvenir') ? undefined : () => this.beginUseItem(def.key),
      });
    }

    if (hasShoes) rows.push({ name: 'Running Shoes', desc: 'Hold SHIFT to run fast.', icon: '👟' });

    // Scrollable list — show a 7-row window; scroll with the wheel, ↑/↓ or the arrows.
    const VISIBLE = 7;
    this.bagMaxScroll = Math.max(0, rows.length - VISIBLE);
    this.bagScroll = Phaser.Math.Clamp(this.bagScroll, 0, this.bagMaxScroll);
    rows.slice(this.bagScroll, this.bagScroll + VISIBLE).forEach((item, i) => {
      const y = this.H / 2 - 178 + i * 50;
      const row = this.add.rectangle(cx, y, 600, 44, 0x111133).setStrokeStyle(1, 0x334466);
      const icon = this.add.text(cx - 282, y, item.icon, { fontSize: '22px' }).setOrigin(0.5);
      const nm   = this.add.text(cx - 252, y - 9, item.name, { fontSize: '14px', color: '#ffe44e', fontStyle: 'bold' });
      const desc = this.add.text(cx - 252, y + 9, item.desc, { fontSize: '11px', color: '#aaaaaa' });
      this.contentContainer.add([row, icon, nm, desc]);
      if (item.count !== undefined) {
        this.contentContainer.add(this.add.text(cx + 285, y, `×${item.count}`, { fontSize: '16px', color: '#fff', fontStyle: 'bold' }).setOrigin(1, 0.5));
      }
      if (item.onClick) {
        row.setInteractive({ useHandCursor: true })
          .on('pointerover', () => row.setFillStyle(0x1a2a4a))
          .on('pointerout',  () => row.setFillStyle(0x111133))
          .on('pointerdown', item.onClick!);
      }
    });

    // Scroll affordances — clickable arrows + a count when the list overflows.
    if (this.bagMaxScroll > 0) {
      const mkArrow = (glyph: string, y: number, dir: number, enabled: boolean) => {
        const a = this.add.text(cx + 322, y, glyph, {
          fontSize: '20px', color: enabled ? '#ffe44e' : '#445',
        }).setOrigin(0.5);
        if (enabled) a.setInteractive({ useHandCursor: true })
          .on('pointerover', () => a.setColor('#ffffff'))
          .on('pointerout',  () => a.setColor('#ffe44e'))
          .on('pointerdown', () => this.scrollBag(dir));
        this.contentContainer.add(a);
      };
      mkArrow('▲', this.H / 2 - 186, -1, this.bagScroll > 0);
      mkArrow('▼', this.H / 2 + 168,  1, this.bagScroll < this.bagMaxScroll);
      this.contentContainer.add(this.add.text(cx + 322, this.H / 2 - 12,
        `${this.bagScroll + 1}-${Math.min(rows.length, this.bagScroll + VISIBLE)}\n/${rows.length}`,
        { fontSize: '10px', color: '#8899bb', align: 'center' }).setOrigin(0.5));
    }
  }

  /** Move the bag window by `delta` rows and redraw (no-op off the bag tab). */
  private scrollBag(delta: number) {
    if (this.tab !== 'bag') return;
    const next = Phaser.Math.Clamp(this.bagScroll + delta, 0, this.bagMaxScroll);
    if (next === this.bagScroll) return;
    this.bagScroll = next;
    this.contentContainer.destroy(true);
    this.contentContainer = this.add.container(0, 0);
    this.renderBagTab();
  }

  /** Badge case — an 8-slot showcase of every Gym Badge, earned ones lit up. */
  private showBadgeCase() {
    const cx = this.W / 2, cy = this.H / 2;
    const earned = BADGES.filter(b => this.registry.get(b.flag)).length;

    const overlay = this.add.container(0, 0).setDepth(60);
    overlay.add(this.add.rectangle(cx, cy, this.W, this.H, 0x000000, 0.7));
    overlay.add(this.add.rectangle(cx, cy, 620, 470, 0x10142a, 0.99).setStrokeStyle(2, 0xffe44e));
    overlay.add(this.add.text(cx, cy - 205, t('— GYM BADGES —', '— 체육관 배지 —'), { fontSize: '18px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5));
    overlay.add(this.add.text(cx, cy - 180, `${earned} / ${BADGES.length} collected`, { fontSize: '13px', color: '#9ab' }).setOrigin(0.5));

    // 4 columns × 2 rows
    const cols = 4, cellW = 142, cellH = 150;
    const startX = cx - ((cols - 1) / 2) * cellW;
    const startY = cy - 70;
    BADGES.forEach((b, i) => {
      const col = i % cols, row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;
      const has = !!this.registry.get(b.flag);
      const col0 = TYPE_COLORS[b.type as keyof typeof TYPE_COLORS] ?? 0x556699;

      // Emblem disc — coloured & glowing when earned, dark & dim when not.
      const disc = this.add.circle(x, y - 18, 34, has ? col0 : 0x1a1e33)
        .setStrokeStyle(3, has ? 0xffe44e : 0x2a3050);
      overlay.add(disc);
      const glyph = this.add.text(x, y - 18, has ? b.icon : '🔒', { fontSize: '26px' }).setOrigin(0.5);
      if (!has) glyph.setAlpha(0.5);
      overlay.add(glyph);

      // Labels
      overlay.add(this.add.text(x, y + 24, has ? b.name : '? ? ?',
        { fontSize: '11px', color: has ? '#ffffff' : '#556', fontStyle: 'bold', align: 'center', wordWrap: { width: cellW - 8 } }).setOrigin(0.5, 0));
      overlay.add(this.add.text(x, y + 52, has ? `${b.leader} · ${b.city}` : '',
        { fontSize: '9px', color: '#8899bb', align: 'center', wordWrap: { width: cellW - 8 } }).setOrigin(0.5, 0));
    });

    const close = this.add.text(cx, cy + 205, tr('✕ Close'), { fontSize: '14px', color: '#aaa' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true });
    close.on('pointerover', () => close.setColor('#fff'));
    close.on('pointerout',  () => close.setColor('#aaa'));
    close.on('pointerdown', () => overlay.destroy(true));
    overlay.add(close);
  }

  /** Pick which party Pokémon to use a consumable on. */
  private beginUseItem(itemKey: string) {
    const party = PartySystem.get(this.registry);
    const cx = this.W / 2, cy = this.H / 2;
    const overlay = this.add.container(0, 0).setDepth(60);
    overlay.add(this.add.rectangle(cx, cy, this.W, this.H, 0x000000, 0.6));
    overlay.add(this.add.rectangle(cx, cy, 460, 420, 0x10142a, 0.99).setStrokeStyle(2, 0x5577aa));
    overlay.add(this.add.text(cx, cy - 178, `Use ${itemDef(itemKey)?.name} on…`, { fontSize: '16px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5));

    party.forEach((e, i) => {
      const y = cy - 140 + i * 48;
      const r = this.add.rectangle(cx, y, 400, 42, e.hp <= 0 ? 0x2a1414 : 0x14223a).setStrokeStyle(1, 0x3a5a8a).setInteractive({ useHandCursor: true });
      overlay.add(r);
      overlay.add(this.add.text(cx - 180, y - 9, `${e.name}  Lv.${e.level}`, { fontSize: '14px', color: '#fff' }));
      overlay.add(this.add.text(cx - 180, y + 9, `HP ${e.hp}/${e.maxHp}  ${(e.status && e.status !== 'none') ? e.status.toUpperCase() : ''}`, { fontSize: '11px', color: '#9ab' }));
      r.on('pointerdown', () => {
        const res = useItemOnSlot(this.registry, itemKey, i);
        overlay.destroy(true);
        this.showToast(res.message);
        this.switchTab('bag');   // refresh
      });
    });

    const cancel = this.add.text(cx, cy + 176, tr('✕ Cancel'), { fontSize: '14px', color: '#aaa' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => overlay.destroy(true));
    overlay.add(cancel);
  }

  /** Pick which party Pokémon learns an HM's move (reusable — the HM is not consumed). */
  private beginTeachHM(itemKey: string) {
    const def = itemDef(itemKey);
    const move = def?.move ?? '';
    const party = PartySystem.get(this.registry);
    const cx = this.W / 2, cy = this.H / 2;
    const overlay = this.add.container(0, 0).setDepth(60);
    overlay.add(this.add.rectangle(cx, cy, this.W, this.H, 0x000000, 0.6));
    overlay.add(this.add.rectangle(cx, cy, 460, 420, 0x10142a, 0.99).setStrokeStyle(2, 0x5577aa));
    overlay.add(this.add.text(cx, cy - 178, `Teach ${move} to…`, { fontSize: '16px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5));

    party.forEach((e, i) => {
      const y = cy - 140 + i * 48;
      const knows    = e.moves.some(m => m.toLowerCase() === move.toLowerCase());
      const eligible = def ? canLearnMove(e, def) : false;
      const usable   = eligible && !knows;
      const r = this.add.rectangle(cx, y, 400, 42, usable ? 0x14223a : 0x241f2e)
        .setStrokeStyle(1, usable ? 0x3a5a8a : 0x443355);
      if (usable) r.setInteractive({ useHandCursor: true });
      overlay.add(r);
      overlay.add(this.add.text(cx - 180, y - 9, `${e.name}  Lv.${e.level}`, { fontSize: '14px', color: usable ? '#fff' : '#888' }));
      const types = [e.type1, e.type2].filter(Boolean).join(' / ');
      const note  = knows ? `already knows ${move}` : eligible ? `can learn ${move}` : `can't learn ${move}`;
      overlay.add(this.add.text(cx - 180, y + 9, `${types}  ·  ${note}`, { fontSize: '11px', color: usable ? '#9ab' : '#776688' }));
      if (usable) r.on('pointerdown', () => {
        overlay.destroy(true);
        this.teachToSlot(itemKey, i);
      });
    });

    const cancel = this.add.text(cx, cy + 176, tr('✕ Cancel'), { fontSize: '14px', color: '#aaa' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => overlay.destroy(true));
    overlay.add(cancel);
  }

  /** Teach the item's move to a slot. For damaging TMs on a full moveset, ask
   *  which move to forget; otherwise fall back to the simple teach. */
  private teachToSlot(itemKey: string, slot: number) {
    const def = itemDef(itemKey);
    const move = def?.move ?? '';
    // Battle data for the taught move — a gym TM or an HM (Fly). Status/unknown moves
    // have none, so they keep the simple append/replace teach.
    const newData = TM_MOVE_DATA[move.toLowerCase()] ?? HM_MOVE_DATA[move.toLowerCase()];
    if (!newData || newData.power <= 0) {
      const res = teachHM(this.registry, itemKey, slot);
      this.showToast(res.message);
      this.switchTab('bag');
      return;
    }
    const entry = PartySystem.get(this.registry)[slot];
    if (!entry) return;
    const current = buildFromEntry(entry).moves.map(m => m.data);
    if (current.some(m => m.name.toLowerCase() === move.toLowerCase())) {
      this.showToast(`${entry.name} already knows ${move}.`);
      return;
    }
    if (current.length < 4) {
      // Free slot — just add it (keeps the Pokémon's normal move growth).
      const res = teachHM(this.registry, itemKey, slot);
      this.showToast(res.message);
      this.switchTab('bag');
      return;
    }
    // Full moveset — let the player choose which move to forget.
    this.showForgetPicker(slot, current, newData, move);
  }

  /** With 4 moves known, let the player pick which one to forget for the new move. */
  private showForgetPicker(slot: number, current: MoveData[], tmData: MoveData, move: string) {
    const entry = PartySystem.get(this.registry)[slot];
    const cx = this.W / 2, cy = this.H / 2;
    const overlay = this.add.container(0, 0).setDepth(60);
    overlay.add(this.add.rectangle(cx, cy, this.W, this.H, 0x000000, 0.6));
    overlay.add(this.add.rectangle(cx, cy, 480, 400, 0x10142a, 0.99).setStrokeStyle(2, 0x5577aa));
    overlay.add(this.add.text(cx, cy - 168, `${entry.name} wants to learn ${move}.`, { fontSize: '15px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5));
    overlay.add(this.add.text(cx, cy - 144, tr('Which move should it forget?'), { fontSize: '12px', color: '#9ab' }).setOrigin(0.5));

    current.forEach((m, j) => {
      const y = cy - 110 + j * 46;
      const r = this.add.rectangle(cx, y, 420, 40, 0x14223a).setStrokeStyle(1, 0x3a5a8a).setInteractive({ useHandCursor: true });
      overlay.add(r);
      overlay.add(this.add.text(cx - 195, y - 8, tr(m.name), { fontSize: '14px', color: '#fff' }));
      const kind = m.category === 'status' ? t('STATUS', '변화') : `${t('Pow', '위력')} ${m.power}`;
      overlay.add(this.add.text(cx - 195, y + 9, `${typeName(m.type)}  ·  ${kind}`, { fontSize: '10px', color: '#9ab' }));
      r.on('pointerover', () => r.setFillStyle(0x1a4488));
      r.on('pointerout',  () => r.setFillStyle(0x14223a));
      r.on('pointerdown', () => {
        overlay.destroy(true);
        const next = current.slice();
        next[j] = tmData;                       // replace the chosen move with the TM's move
        this.commitCuratedMoves(slot, next, move, m.name);
      });
    });

    const cancel = this.add.text(cx, cy + 168, `✕ Don't learn ${move}`, { fontSize: '13px', color: '#c99' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancel.on('pointerdown', () => { overlay.destroy(true); this.showToast(`${entry.name} did not learn ${move}.`); });
    overlay.add(cancel);
  }

  /** Store the chosen moveset on the party entry (overrides the auto-derived set). */
  private commitCuratedMoves(slot: number, moves: MoveData[], learned: string, forgot?: string) {
    const party = PartySystem.get(this.registry);
    const e = party[slot];
    if (!e) return;
    e.battleMoves = moves.slice(0, 4);
    e.moves = e.battleMoves.map(m => m.name);   // keep the display list in sync
    PartySystem.set(this.registry, party);
    this.showToast(forgot ? `${e.name} forgot ${forgot} and learned ${learned}!` : `${e.name} learned ${learned}!`);
    this.switchTab('bag');
  }

  private showToast(msg: string) {
    const t = this.add.text(this.W / 2, this.H - 40, msg, {
      fontSize: '14px', color: '#aaffaa', backgroundColor: '#000000cc', padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(80);
    this.time.delayedCall(1800, () => t.destroy());
  }

  // ── Close ─────────────────────────────────────────────────────────────────

  private closeMenu() {
    this.cameras.main.fadeOut(150, 0, 0, 0, () => {
      this.scene.stop('MenuScene');
    });
  }
}
