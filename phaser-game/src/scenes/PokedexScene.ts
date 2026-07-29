import Phaser from 'phaser';
import { POKEDEX, POKEDEX_COUNT, DexEntry } from '../data/Pokedex';
import { DexTracker } from '../systems/DexTracker';
import { TYPE_COLORS } from '../data/StarterData';
import { t, pokeName, typeName } from '../systems/i18n';

const PER_PAGE = 12;     // 3 columns × 4 rows
const COLS = 3;

export class PokedexScene extends Phaser.Scene {
  private page = 0;
  private parentKey = 'MenuScene';
  private listContainer!: Phaser.GameObjects.Container;
  private detailContainer?: Phaser.GameObjects.Container;
  private pageText!: Phaser.GameObjects.Text;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  private get W() { return this.scale.width; }
  private get H() { return this.scale.height; }

  constructor() { super('PokedexScene'); }

  init(data: { parentKey?: string }) { this.parentKey = data.parentKey ?? 'MenuScene'; }

  create() {
    this.scene.bringToTop();
    DexTracker.syncCaughtFromParty(this.registry);
    this.cameras.main.fadeIn(150);

    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x06060f, 0.97);

    // Header
    const seen = DexTracker.seenCount(this.registry);
    const caught = DexTracker.caughtCount(this.registry);
    this.add.text(this.W / 2, 34, t('📖  HANBANDO POKÉDEX', '📖  한반도 도감'), {
      fontSize: '24px', color: '#ffe44e', fontStyle: 'bold',
      stroke: '#221133', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(this.W / 2, 64, t(`Seen ${seen}    ·    Caught ${caught}    ·    Total ${POKEDEX_COUNT}`, `발견 ${seen}    ·    잡음 ${caught}    ·    전체 ${POKEDEX_COUNT}`), {
      fontSize: '14px', color: '#aaccff',
    }).setOrigin(0.5);

    // Close button
    this.add.text(this.W - 24, 30, t('✕ CLOSE', '✕ 닫기'), {
      fontSize: '14px', color: '#aaaaaa',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.close())
      .on('pointerover', function (this: Phaser.GameObjects.Text) { this.setColor('#fff'); })
      .on('pointerout', function (this: Phaser.GameObjects.Text) { this.setColor('#aaa'); });

    // Page controls
    this.add.text(40, this.H - 36, t('◀ PREV', '◀ 이전'), { fontSize: '16px', color: '#fff' })
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.changePage(-1));
    this.add.text(this.W - 40, this.H - 36, t('NEXT ▶', '다음 ▶'), { fontSize: '16px', color: '#fff' })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.changePage(1));
    this.pageText = this.add.text(this.W / 2, this.H - 30, '', { fontSize: '13px', color: '#99aacc' }).setOrigin(0.5);

    this.add.text(this.W / 2, this.H - 12, t('← → page   ·   click an entry for details   ·   ESC to close', '← → 페이지   ·   항목을 클릭하면 상세정보   ·   ESC로 닫기'), {
      fontSize: '11px', color: '#667799',
    }).setOrigin(0.5);

    this.listContainer = this.add.container(0, 0);

    this.leftKey  = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.escKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.input.keyboard!.on('keydown-M', () => this.close());

    this.renderPage();
  }

  update() {
    if (this.detailContainer) {
      if (Phaser.Input.Keyboard.JustDown(this.escKey)) this.closeDetail();
      return;
    }
    if (Phaser.Input.Keyboard.JustDown(this.leftKey))  this.changePage(-1);
    if (Phaser.Input.Keyboard.JustDown(this.rightKey)) this.changePage(1);
    if (Phaser.Input.Keyboard.JustDown(this.escKey))   this.close();
  }

  // ── Page grid ──────────────────────────────────────────────────────────────

  private changePage(dir: number) {
    const maxPage = Math.ceil(POKEDEX_COUNT / PER_PAGE) - 1;
    this.page = Phaser.Math.Clamp(this.page + dir, 0, maxPage);
    this.renderPage();
  }

  private renderPage() {
    this.listContainer.removeAll(true);
    const maxPage = Math.ceil(POKEDEX_COUNT / PER_PAGE) - 1;
    this.pageText.setText(t(`Page ${this.page + 1} / ${maxPage + 1}`, `페이지 ${this.page + 1} / ${maxPage + 1}`));

    const start = this.page * PER_PAGE;
    const slice = POKEDEX.slice(start, start + PER_PAGE);
    const cellW = 380, cellH = 124;
    const gridW = COLS * cellW;
    const ox = (this.W - gridW) / 2 + cellW / 2;
    const oy = 110 + cellH / 2;

    slice.forEach((entry, i) => {
      const col = i % COLS, row = Math.floor(i / COLS);
      const x = ox + col * cellW;
      const y = oy + row * cellH;
      this.makeCell(entry, x, y, cellW - 16, cellH - 14);
    });
  }

  private makeCell(entry: DexEntry, x: number, y: number, w: number, h: number) {
    const seen   = DexTracker.isSeen(this.registry, entry.key);
    const caught = DexTracker.isCaught(this.registry, entry.key);

    const bg = this.add.rectangle(x, y, w, h, caught ? 0x14223a : 0x10101e, 1)
      .setStrokeStyle(1, caught ? 0x3a6aaa : 0x2a2a3a);
    this.listContainer.add(bg);

    // Number + caught ball
    this.listContainer.add(this.add.text(x - w / 2 + 10, y - h / 2 + 8,
      `No.${String(entry.num).padStart(3, '0')}`, { fontSize: '11px', color: '#8899bb' }));
    if (caught) this.listContainer.add(this.add.text(x + w / 2 - 18, y - h / 2 + 6, '🔴', { fontSize: '13px' }));

    // Sprite area
    const sx = x - w / 2 + 44, sy = y + 6;
    if (seen) {
      this.loadAndPlaceSprite(entry, sx, sy, caught);
    } else {
      this.listContainer.add(this.add.text(sx, sy, '?', {
        fontSize: '40px', color: '#33334a', fontStyle: 'bold',
      }).setOrigin(0.5));
    }

    // Name + types (only if seen)
    const nameX = x - w / 2 + 86;
    if (seen) {
      this.listContainer.add(this.add.text(nameX, y - 22, pokeName(entry.key, entry.name), {
        fontSize: '16px', color: caught ? '#ffffff' : '#bbbbcc', fontStyle: 'bold',
      }));
      const types = [entry.type1, entry.type2].filter(Boolean) as string[];
      types.forEach((t, ti) => {
        const tx = nameX + ti * 64;
        this.listContainer.add(this.add.rectangle(tx + 26, y + 4, 56, 16, TYPE_COLORS[t] ?? 0x666, 1));
        this.listContainer.add(this.add.text(tx + 26, y + 4, typeName(t).toUpperCase(),
          { fontSize: '9px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
      });
      if (entry.legendary) {
        this.listContainer.add(this.add.text(nameX, y + 22, t('★ Legendary', '★ 전설'), { fontSize: '10px', color: '#ffcc44' }));
      }
    } else {
      this.listContainer.add(this.add.text(nameX, y - 8, '??????', {
        fontSize: '16px', color: '#444455', fontStyle: 'bold',
      }));
    }

    // Click → detail (only if seen)
    if (seen) {
      bg.setInteractive({ useHandCursor: true })
        .on('pointerover', () => bg.setFillStyle(caught ? 0x1d2f50 : 0x18182a))
        .on('pointerout',  () => bg.setFillStyle(caught ? 0x14223a : 0x10101e))
        .on('pointerdown', () => this.openDetail(entry));
    }
  }

  /** Load an entry's sprite (local or remote) and place it; tint black if only seen. */
  private loadAndPlaceSprite(entry: DexEntry, x: number, y: number, caught: boolean, target?: Phaser.GameObjects.Container) {
    const key = `dex_${entry.key}`;
    const place = () => {
      if (!this.textures.exists(key)) return;
      const img = this.add.image(x, y, key);
      const tex = this.textures.get(key).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      img.setScale(64 / dim);
      if (!caught) img.setTint(0x000000).setAlpha(0.55);  // silhouette for seen-only
      (target ?? this.listContainer).add(img);
    };
    if (this.textures.exists(key)) { place(); return; }
    // Dynamic load
    this.load.image(key, entry.spriteUrl);
    this.load.once('complete', place);
    this.load.start();
  }

  // ── Detail overlay ─────────────────────────────────────────────────────────

  private openDetail(entry: DexEntry) {
    const caught = DexTracker.isCaught(this.registry, entry.key);
    const c = this.add.container(0, 0).setDepth(50);
    c.add(this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.7));
    const panel = this.add.rectangle(this.W / 2, this.H / 2, 720, 460, 0x0e0e22, 0.99).setStrokeStyle(2, 0x5577aa);
    c.add(panel);

    const cx = this.W / 2, cy = this.H / 2;
    c.add(this.add.text(cx - 340, cy - 200, `No.${String(entry.num).padStart(3, '0')}  ${pokeName(entry.key, entry.name)}`, {
      fontSize: '22px', color: '#ffe44e', fontStyle: 'bold',
    }));
    if (caught) c.add(this.add.text(cx + 320, cy - 196, t('🔴 Caught', '🔴 잡음'), { fontSize: '13px', color: '#aaffaa' }).setOrigin(1, 0));

    // Sprite (left)
    this.loadAndPlaceSpriteBig(entry, cx - 230, cy - 10, caught, c);

    // Info (right)
    const ix = cx - 80;
    const types = [entry.type1, entry.type2].filter(Boolean) as string[];
    types.forEach((t, ti) => {
      const tx = ix + ti * 76;
      c.add(this.add.rectangle(tx + 32, cy - 150, 68, 20, TYPE_COLORS[t] ?? 0x666, 1));
      c.add(this.add.text(tx + 32, cy - 150, typeName(t).toUpperCase(), { fontSize: '11px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
    });
    if (entry.ability) c.add(this.add.text(ix, cy - 118, t(`Ability: ${entry.ability}`, `특성: ${entry.ability}`), { fontSize: '14px', color: '#aaccff' }));
    c.add(this.add.text(ix, cy - 92, t(`Found: ${entry.dist} — ${entry.where}`, `서식지: ${entry.dist} — ${entry.where}`), { fontSize: '13px', color: '#cccccc', wordWrap: { width: 360 } }));
    if (entry.evolvesTo) {
      const to = POKEDEX.find(e => e.key === entry.evolvesTo);
      c.add(this.add.text(ix, cy - 50, t(`Evolves into ${to?.name ?? '???'} at Lv. ${entry.evolvesAtLevel}`, `Lv. ${entry.evolvesAtLevel}에 ${to ? pokeName(to.key, to.name) : '???'}(으)로 진화`), {
        fontSize: '13px', color: '#ffcc88',
      }));
    }
    c.add(this.add.text(ix, cy - 16, entry.dexText, {
      fontSize: '14px', color: '#e8e8f0', wordWrap: { width: 380 }, lineSpacing: 5,
    }));
    if (entry.legendary) c.add(this.add.text(ix, cy + 120, t('★ Legendary Pokémon', '★ 전설의 포켓몬'), { fontSize: '14px', color: '#ffcc44', fontStyle: 'bold' }));

    c.add(this.add.text(cx, cy + 198, t('[ ESC / click to go back ]', '[ ESC / 클릭하면 뒤로 ]'), { fontSize: '12px', color: '#8899bb' }).setOrigin(0.5));
    panel.setInteractive().on('pointerdown', () => this.closeDetail());
    this.detailContainer = c;
  }

  private loadAndPlaceSpriteBig(entry: DexEntry, x: number, y: number, caught: boolean, target: Phaser.GameObjects.Container) {
    const key = `dex_${entry.key}`;
    const place = () => {
      if (!this.textures.exists(key)) return;
      const img = this.add.image(x, y, key);
      const tex = this.textures.get(key).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      img.setScale(170 / dim);
      if (!caught) img.setTint(0x000000).setAlpha(0.6);
      target.add(img);
    };
    if (this.textures.exists(key)) { place(); return; }
    this.load.image(key, entry.spriteUrl);
    this.load.once('complete', place);
    this.load.start();
  }

  private closeDetail() {
    this.detailContainer?.destroy(true);
    this.detailContainer = undefined;
  }

  // ── Close ──────────────────────────────────────────────────────────────────

  private close() {
    this.cameras.main.fadeOut(150, 0, 0, 0, () => {
      this.scene.stop();
      this.scene.resume(this.parentKey);
    });
  }
}
