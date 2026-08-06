import { BaseInteriorScene, NPC } from './interior/BaseInteriorScene';
import { tr } from '../systems/i18n';

// ── 국립도서관 (National Library of 온누리) interior ──────────────────────────────
// A grand reading hall: tall bookshelf banks lining both sides, reading tables on a
// red carpet in the central atrium, an info desk under the library emblem, and tall
// windows. The painted 2D layout extrudes into a 3D hall.
export class CapitolLibraryScene extends BaseInteriorScene {
  protected readonly COLS = 18; protected readonly ROWS = 14;
  constructor() { super({ key: 'CapitolLibraryScene' }); }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x4a3a2a);   // dark wood skirting
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xe8dcc0);   // parquet floor
    this.drawFloor(g, 6, 5, 11, 9, 0x9a2b2b);                          // central reading carpet

    // Tall bookshelf banks lining both side walls, with a colourful spine strip.
    const spine = [0x8a3a3a, 0x3a5a8a, 0x3a7a4a, 0xb08a2a];
    for (const r of [2, 4, 6, 8, 10]) {
      for (const c0 of [2, 13]) {
        this.drawRect(g, c0, r, 3, 1, 0x6a4a2a, 0x4a3320);
        this.addSolid(c0, r, c0 + 2, r);
        for (let c = c0; c < c0 + 3; c++) {
          const tp = this.tile(c, r);
          g.fillStyle(spine[(c + r) % 4]); g.fillRect(tp.x + 4, tp.y + 7, 24, 4);
        }
      }
    }

    // Reading tables in the central hall.
    for (const [c, r] of [[7, 6], [10, 6], [7, 8], [10, 8]] as [number, number][]) {
      this.drawRect(g, c, r, 1, 1, 0x7a5a3a, 0x5a3f28);
      this.addSolid(c, r, c, r);
    }

    // Info desk under the library emblem (back wall).
    this.drawRect(g, 8, 1, 2, 1, 0x315a70, 0x22405a);
    this.label('📚 국립\n도서관', 8, 1, 9, '#cfe8ff');

    // Tall windows
    this.drawRect(g, 5, 0, 2, 1, 0x9fd8ff, 0xffffff);
    this.drawRect(g, 11, 0, 2, 1, 0x9fd8ff, 0xffffff);

    // Door
    const dp = this.tile(8, this.ROWS - 1);
    g.fillStyle(0x5a3f28); g.fillRect(dp.x + 4, dp.y, 64, 32);

    // Walls (door gap at cols 8-9)
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 7, this.ROWS - 1);
    this.addSolid(10, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const librarian = this.createNPCGraphic(9, 3, 0x3a5a7a, 0x222233, true, 0);
    this.add.text(this.tile(9, 3).x + 16, this.tile(9, 3).y - 6, tr('Librarian'),
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(librarian);

    const scholar = this.createNPCGraphic(12, 8, 0x6a5a3a, 0x332200, false, 1);
    this.add.text(this.tile(12, 8).x + 16, this.tile(12, 8).y - 6, tr('Scholar'),
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(scholar);
  }

  protected placePlayer() { this.createPlayerGraphic(9, 12); }

  protected onInteract(npc: NPC) {
    if (npc.facing === 0) {
      this.dialog.show([
        'Librarian: Welcome to the 국립도서관 — the National Library of 온누리.',
        'Librarian: Every Pokédex entry ever recorded is archived on these shelves.',
        'Librarian: Read quietly... some of these scrolls are six centuries old.',
      ]);
    } else {
      this.dialog.show([
        'Scholar: They say a hidden move-tutor once studied at this very table.',
        'Scholar: Knowledge is the sharpest move of all. Ha!',
      ]);
    }
  }

  protected checkExit() {
    const { y } = this.tile(8, this.ROWS - 1);
    if (this.py > y + 20) this.exitToWorld();
  }
  protected exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('CapitolCityScene'));
  }
}
