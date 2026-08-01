import { BaseInteriorScene, NPC } from './BaseInteriorScene';
import { rivalTrainerName } from '../../data/CharacterSprite';
import { markRivalPortrait } from '../../data/BattlePortraits';

export class RivalHomeScene extends BaseInteriorScene {
  private minhyukTalked = false;

  constructor() { super({ key: 'RivalHomeScene' }); }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);

    // Walls
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x334466);
    // Floor (dark cool tone — Minhyuk is serious)
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xd8d0e8);

    // Subtle floor pattern
    for (let r = 1; r < this.ROWS - 1; r += 2) {
      const p = this.tile(1, r);
      g.fillStyle(0xcec6de, 1);
      g.fillRect(p.x, p.y, (this.COLS - 2) * 32, 32);
    }

    // ── Window (top) ──
    this.drawRect(g, 6, 0, 4, 1, 0x88ccff, 0xffffff);

    // ── Bed (top-left) ──
    this.drawRect(g, 1, 2, 4, 3, 0x2244aa, 0x112288);
    this.drawRect(g, 1, 2, 4, 1, 0xffffff, 0xdddddd); // pillow
    this.label('🛏️', 2, 3, 14);
    this.addSolid(1, 2, 4, 4);

    // ── Bookshelf (top-right) ──
    this.drawRect(g, 11, 1, 4, 4, 0x5a3a1a, 0x3a2a0a);
    const bookColors = [0xee3333, 0x3333ee, 0x33aa33, 0xeeaa22, 0xaa33ee, 0x33aaee];
    for (let i = 0; i < 6; i++) {
      const bp = this.tile(11, 1);
      g.fillStyle(bookColors[i], 1);
      g.fillRect(bp.x + 4 + i * 20, bp.y + 6, 16, 60);
    }
    this.addSolid(11, 1, 14, 4);

    // ── Desk + computer (right side) ──
    this.drawRect(g, 11, 5, 4, 2, 0x8a6030, 0x6a4020);
    this.drawRect(g, 12, 5, 2, 1, 0x222222, 0x000000); // monitor
    this.label('💻', 12, 5, 14);
    this.addSolid(11, 5, 14, 6);

    // ── Trophy shelf ──
    this.drawRect(g, 1, 6, 3, 2, 0xaa8833, 0x886622);
    this.label('🏆', 1, 6, 14);
    this.label('🥇', 2, 6, 14);
    this.addSolid(1, 6, 3, 7);

    // ── Pokéball collection on wall ──
    this.drawRect(g, 6, 1, 4, 1, 0x888888, 0x555555);
    this.label('⚽⚽⚽⚽', 6, 1, 9, '#ff4444');

    // ── Training poster ──
    this.drawRect(g, 5, 8, 2, 2, 0x223366, 0x112244);
    this.label('TRAIN\nHARD', 5, 8, 8, '#ffe44e');

    // ── Rug ──
    this.drawRect(g, 5, 5, 5, 3, 0x4466aa, 0x2244cc);
    g.lineStyle(2, 0x6688cc, 0.6);
    const rp = this.tile(6, 5);
    g.strokeRect(rp.x, rp.y, 3 * 32, 2 * 32);

    // ── Door ──
    this.drawRect(g, 7, 12, 2, 1, 0x886622, 0x664400);

    // Walls
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const rn = rivalTrainerName(this.registry);
    const minhyuk = this.createNPCGraphic(7, 6, 0x1133aa, 0x110033, false, 0);
    markRivalPortrait(minhyuk.graphic, this.registry);
    this.add.text(
      this.tile(7, 6).x + 16,
      this.tile(7, 6).y - 6,
      rn, { fontSize: '10px', color: '#ffe44e', backgroundColor: '#00000099', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(minhyuk);
  }

  protected placePlayer() {
    this.createPlayerGraphic(7, 11);
  }

  protected onInteract(_npc: NPC) {
    const rn = rivalTrainerName(this.registry);
    if (!this.minhyukTalked) {
      this.minhyukTalked = true;
      this.dialog.show([
        `${rn}: Oh, it's you. You finally got started?`,
        `${rn}: I've been training every day.\nDon't expect it to be easy.`,
        `${rn}: My Pokémon will be the strongest.\nCount on it.`,
      ]);
    } else {
      const lines = [
        [`${rn}: Still here? Go train.`, `${rn}: When we battle, I won't hold back.`],
        [`${rn}: I heard you battled near the waterfall.`, `${rn}: Don't get overconfident.`],
        [`${rn}: ...What? Stop staring at my trophies.`, `${rn}: Go get your own.`],
      ];
      this.dialog.show(lines[Math.floor(Math.random() * lines.length)]);
    }
  }

  protected checkExit() {
    const { y } = this.tile(7, 12);
    if (this.py > y + 20) this.exitToWorld();
  }
}
