import Phaser from 'phaser';
import { tr } from '../../systems/i18n';
import { BaseInteriorScene, NPC } from './BaseInteriorScene';

// ── Prof. Song's Pokémon Lab (walkable interior) ─────────────────────────────
// You enter from Waterfall City and walk up to Professor Song, drawn as a 2-D
// sprite behind the starter table. Talking to him opens the starter picker — but
// only once: after you've chosen, he just chats. The picker is never reachable by
// simply walking into the building again.

export class PokemonLabScene extends BaseInteriorScene {
  private song!: NPC;

  constructor() { super({ key: 'PokemonLabScene' }); }
  // Lab sits in the home town — keep the overworld hub theme playing (no switch).

  protected drawRoom(): void {
    const g = this.add.graphics().setDepth(0);
    // Walls + floor
    this.drawFloor(g, 0, 0, this.COLS - 1, 1, 0x6b5138);          // top wall
    this.drawFloor(g, 0, 2, this.COLS - 1, this.ROWS - 1, 0xd8cca4); // wood floor
    // Floorboards
    g.lineStyle(1, 0xc4b890, 0.6);
    for (let r = 3; r < this.ROWS; r++) { const p = this.tile(0, r); g.lineBetween(p.x, p.y, p.x + this.COLS * 32, p.y); }

    // ── Left bookshelves ──
    this.drawRect(g, 1, 3, 3, 3, 0x7a5c38, 0x4a3722);
    const books = [0xcc3333, 0x3355cc, 0x33aa44, 0xddaa22, 0xaa33bb, 0x33aacc];
    books.forEach((c, i) => { const p = this.tile(1, 3); g.fillStyle(c, 1); g.fillRect(p.x + 6 + (i % 3) * 28, p.y + 8 + Math.floor(i / 3) * 44, 22, 34); });
    this.addSolid(1, 3, 3, 5);

    // ── Right lab bench with beakers + an analyzer console ──
    this.drawRect(g, 11, 3, 4, 2, 0x8b7355, 0x5a4634);
    [0xaaddff, 0xffeebb, 0xddffaa].forEach((c, i) => { const p = this.tile(11, 3); g.fillStyle(c, 0.9); g.fillEllipse(p.x + 22 + i * 34, p.y + 26, 16, 26); });
    this.addSolid(11, 3, 14, 4);
    this.drawRect(g, 12, 6, 2, 2, 0x2a3550, 0x1a2338);   // analyzer/PC
    g.fillStyle(0x66ccff, 0.85); { const p = this.tile(12, 6); g.fillRect(p.x + 8, p.y + 8, 48, 30); }
    this.addSolid(12, 6, 13, 7);

    // ── The starter table (centre-top) with three Poké Balls ──
    this.drawRect(g, 5, 3, 6, 2, 0xa8763e, 0x6d4a24);
    const ballX = [6, 8, 10];
    ballX.forEach((c) => {
      const p = this.tile(c, 3);
      const cx = p.x + 16, cy = p.y + 30;
      g.fillStyle(0x000000, 0.18); g.fillEllipse(cx, cy + 12, 22, 6);
      g.fillStyle(0xd63b3b, 1); g.fillCircle(cx, cy, 11);
      g.fillStyle(0xf2f2f2, 1); g.fillRect(cx - 11, cy, 22, 11);
      g.lineStyle(2, 0x2a2a2a, 1); g.strokeCircle(cx, cy, 11); g.lineBetween(cx - 11, cy, cx + 11, cy);
      g.fillStyle(0x2a2a2a, 1); g.fillCircle(cx, cy, 3);
    });
    this.addSolid(5, 3, 10, 4);

    // ── Door (bottom centre) ──
    this.drawRect(g, 7, this.ROWS - 1, 2, 1, 0x5a3a1a, 0x3a2410);
    this.label('▼', 7, this.ROWS - 1, 12, '#ffe44e');
    this.label('▼', 8, this.ROWS - 1, 12, '#ffe44e');

    // Perimeter walls (leave the door open)
    this.addSolid(0, 0, this.COLS - 1, 1);
    this.addSolid(0, 2, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 2, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);

    // Signage
    const banner = this.tile(4, 0);
    this.add.text(banner.x + 128, banner.y + 32, tr("Prof. Song's Pokémon Lab"), {
      fontSize: '13px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
  }

  protected setupNPCs(): void {
    // Professor Song — white lab coat, greying hair — standing before the table.
    this.song = this.createNPCGraphic(7, 5, 0xffffff, 0x9a9088, false, 0);
    const p = this.tile(7, 5);
    this.add.text(p.x + 16, p.y - 18, '🔬 Prof. Song', {
      fontSize: '9px', color: '#bfe4ff', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(16);
    this.npcs.push(this.song);
  }

  protected placePlayer(): void {
    this.createPlayerGraphic(8, 10);
  }

  protected onInteract(_npc: NPC): void {
    if (this.registry.get('starterChosen')) {
      const name = (this.registry.get('starterName') as string) ?? 'your partner';
      this.dialog.show([
        `Prof. Song: How is ${name} settling in? A fine choice — I can tell you two already trust each other.`,
        'Prof. Song: Your journey is out there, not in my lab. Head south when you\'re ready!',
      ]);
      return;
    }
    this.dialog.show([
      'Prof. Song: Ah, there you are! I have three Pokémon here, and each is hoping to find a trainer.',
      'Prof. Song: Go on — take a good look at all three, and choose the one who calls to you.',
    ], () => {
      this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('StarterSelectScene'));
    });
  }

  protected checkExit(): void {
    const doorY = this.tile(0, this.ROWS - 1).y;
    const nearDoor = this.px > this.tile(6, 0).x && this.px < this.tile(10, 0).x;
    if (nearDoor && this.py > doorY + 16) this.exitToWorld();
  }
}
