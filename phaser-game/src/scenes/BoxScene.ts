import Phaser from 'phaser';
import { PartySystem, PartyEntry } from '../systems/PartySystem';
import { TYPE_COLORS } from '../data/StarterData';
import { t } from '../systems/i18n';

/**
 * PC storage box. Left column = party (max 6), right grid = box.
 * Click a party Pokémon then a box Pokémon to swap; or use the
 * →BOX / →PARTY buttons to move single Pokémon between them.
 */
export class BoxScene extends Phaser.Scene {
  private parentKey = 'PokemonCenterScene';
  private selectedParty = -1;
  private selectedBox = -1;
  private boxPage = 0;
  private static readonly PER_PAGE = 12;   // 2 columns × 6 rows
  private content!: Phaser.GameObjects.Container;
  private info!: Phaser.GameObjects.Text;
  private escKey!: Phaser.Input.Keyboard.Key;

  private get W() { return this.scale.width; }
  private get H() { return this.scale.height; }

  constructor() { super('BoxScene'); }
  init(data: { parentKey?: string }) { this.parentKey = data.parentKey ?? 'PokemonCenterScene'; }

  create() {
    this.scene.bringToTop();   // draw the PC box above the Pokémon Center scene
    this.cameras.main.fadeIn(150);
    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x060a14, 0.98);

    this.add.text(this.W / 2, 34, t('💻  POKÉMON STORAGE — PC', '💻  포켓몬 보관 — PC'), {
      fontSize: '22px', color: '#88bbff', fontStyle: 'bold', stroke: '#112244', strokeThickness: 4,
    }).setOrigin(0.5);
    this.add.text(this.W - 30, 34, t('✕ CLOSE', '✕ 닫기'), { fontSize: '14px', color: '#aaa' })
      .setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.close());

    this.add.text(40, 80, t('PARTY', '동료'), { fontSize: '15px', color: '#ffe44e', fontStyle: 'bold' });
    this.add.text(360, 80, t('BOX', '보관함'), { fontSize: '15px', color: '#ffe44e', fontStyle: 'bold' });

    this.info = this.add.text(this.W / 2, this.H - 50, 'Click a PARTY Pokémon, then a BOX Pokémon to swap them.', {
      fontSize: '13px', color: '#aaccee',
    }).setOrigin(0.5);
    this.add.text(this.W / 2, this.H - 24, 'You must keep at least one Pokémon in your party.   ·   ESC to close', {
      fontSize: '11px', color: '#667',
    }).setOrigin(0.5);

    this.content = this.add.container(0, 0);
    this.escKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // Scroll through box pages with the mouse wheel or ← / → arrow keys
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.changePage(dy > 0 ? 1 : -1));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT).on('down', () => this.changePage(1));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT).on('down', () => this.changePage(-1));

    this.render();
  }

  update() { if (Phaser.Input.Keyboard.JustDown(this.escKey)) this.close(); }

  private get pageCount() {
    return Math.max(1, Math.ceil(PartySystem.getBox(this.registry).length / BoxScene.PER_PAGE));
  }

  private changePage(delta: number) {
    const next = Phaser.Math.Clamp(this.boxPage + delta, 0, this.pageCount - 1);
    if (next !== this.boxPage) { this.boxPage = next; this.render(); }
  }

  private render() {
    this.content.removeAll(true);
    const party = PartySystem.get(this.registry);
    const box   = PartySystem.getBox(this.registry);

    // Party column (left)
    party.forEach((e, i) => this.makeSlot(e, 40, 104 + i * 64, 280, i === this.selectedParty, 'party', i));
    for (let i = party.length; i < 6; i++) this.emptySlot(40, 104 + i * 64, 280);

    // Box grid (right, 2 cols × 6 rows per page) — paginated so every Pokémon is reachable
    const perCol = 6;
    const pages = this.pageCount;
    if (this.boxPage >= pages) this.boxPage = pages - 1;
    const start = this.boxPage * BoxScene.PER_PAGE;
    const pageItems = box.slice(start, start + BoxScene.PER_PAGE);
    pageItems.forEach((e, j) => {
      const i = start + j;                                  // real box index
      const col = Math.floor(j / perCol), row = j % perCol;
      this.makeSlot(e, 360 + col * 300, 104 + row * 64, 280, i === this.selectedBox, 'box', i);
    });
    if (box.length === 0) {
      this.content.add(this.add.text(500, 250, t('Box is empty.', '보관함이 비어 있어요.'), { fontSize: '14px', color: '#556' }));
    }

    // Page controls (only when there's more than one page)
    if (pages > 1) {
      const py = 104 + perCol * 64 - 2;   // just below the grid
      const prev = this.add.text(390, py, t('◀ Prev', '◀ 이전'), { fontSize: '14px', color: this.boxPage > 0 ? '#aaccee' : '#445', backgroundColor: '#142033', padding: { x: 8, y: 4 } })
        .setOrigin(0, 0.5);
      const next = this.add.text(910, py, t('Next ▶', '다음 ▶'), { fontSize: '14px', color: this.boxPage < pages - 1 ? '#aaccee' : '#445', backgroundColor: '#142033', padding: { x: 8, y: 4 } })
        .setOrigin(1, 0.5);
      if (this.boxPage > 0)         prev.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.changePage(-1));
      if (this.boxPage < pages - 1) next.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.changePage(1));
      this.content.add([prev, next]);
      this.content.add(this.add.text(650, py, `Box ${this.boxPage + 1} / ${pages}   (wheel · ← →)`, {
        fontSize: '13px', color: '#ffe44e',
      }).setOrigin(0.5));
    }

    // Action buttons
    if (this.selectedParty >= 0 && this.selectedBox >= 0) {
      this.actionButton(t('⇄ SWAP', '⇄ 교체'), this.W / 2, this.H - 86, () => {
        PartySystem.swapWithBox(this.registry, this.selectedParty, this.selectedBox);
        this.info.setText(t('Swapped!', '교체했다!')); this.selectedParty = this.selectedBox = -1; this.render();
      });
    } else if (this.selectedParty >= 0) {
      this.actionButton(t('→ MOVE TO BOX', '→ 보관함으로'), this.W / 2, this.H - 86, () => {
        if (PartySystem.partyToBox(this.registry, this.selectedParty)) { this.info.setText(t('Moved to box.', '보관함으로 옮겼다.')); }
        else this.info.setText(t('You must keep at least one Pokémon!', '최소 한 마리는 데리고 있어야 해!'));
        this.selectedParty = -1; this.render();
      });
    } else if (this.selectedBox >= 0) {
      this.actionButton(t('← MOVE TO PARTY', '← 동료로'), this.W / 2, this.H - 86, () => {
        if (PartySystem.boxToParty(this.registry, this.selectedBox)) { this.info.setText(t('Moved to party.', '동료로 옮겼다.')); }
        else this.info.setText(t('Your party is full (6).', '동료가 가득 찼어 (6).'));
        this.selectedBox = -1; this.render();
      });
    }
  }

  private makeSlot(e: PartyEntry, x: number, y: number, w: number, selected: boolean, which: 'party' | 'box', idx: number) {
    const bg = this.add.rectangle(x + w / 2, y, w, 56, selected ? 0x244a6a : 0x141a2a)
      .setStrokeStyle(selected ? 2 : 1, selected ? 0xffe44e : 0x2a3550)
      .setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      if (which === 'party') this.selectedParty = this.selectedParty === idx ? -1 : idx;
      else                   this.selectedBox   = this.selectedBox === idx ? -1 : idx;
      this.render();
    });
    this.content.add(bg);

    // Type dot
    const col = (TYPE_COLORS as Record<string, number>)[e.type1] ?? 0x888;
    this.content.add(this.add.rectangle(x + 22, y, 30, 30, col, 0.7));
    this.content.add(this.add.text(x + 22, y, e.type1.toUpperCase()[0], { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
    // Name + level + hp
    this.content.add(this.add.text(x + 46, y - 14, e.name, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }));
    this.content.add(this.add.text(x + 46, y + 4, `Lv.${e.level}   HP ${e.hp}/${e.maxHp}`, { fontSize: '11px', color: '#9ab' }));
  }

  private emptySlot(x: number, y: number, w: number) {
    this.content.add(this.add.rectangle(x + w / 2, y, w, 56, 0x0c0f18).setStrokeStyle(1, 0x1a2030));
    this.content.add(this.add.text(x + w / 2, y, t('— empty —', '— 비어 있음 —'), { fontSize: '12px', color: '#334' }).setOrigin(0.5));
  }

  private actionButton(label: string, x: number, y: number, cb: () => void) {
    const btn = this.add.rectangle(x, y, 240, 34, 0x1a4a2a).setStrokeStyle(1, 0x3a8a5a).setInteractive({ useHandCursor: true });
    this.content.add(btn);
    this.content.add(this.add.text(x, y, label, { fontSize: '15px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5));
    btn.on('pointerover', () => btn.setFillStyle(0x2a6a3a));
    btn.on('pointerout',  () => btn.setFillStyle(0x1a4a2a));
    btn.on('pointerdown', cb);
  }

  private close() {
    this.cameras.main.fadeOut(150, 0, 0, 0, () => { this.scene.stop(); this.scene.resume(this.parentKey); });
  }
}
