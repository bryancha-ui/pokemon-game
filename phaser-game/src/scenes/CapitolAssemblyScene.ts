import { BaseInteriorScene, NPC } from './interior/BaseInteriorScene';
import { tr } from '../systems/i18n';

// ── 온누리 National Assembly Hall (온누리 국회의사당) interior ─────────────────────
// A grand debate chamber: tiered green benches banking down both sides of a sunken
// blue debate well, a central speaker's rostrum under the national ☀ emblem, marble
// columns and tall windows. The painted 2D layout extrudes into a 3D chamber.
export class CapitolAssemblyScene extends BaseInteriorScene {
  protected readonly COLS = 18; protected readonly ROWS = 14;
  constructor() { super({ key: 'CapitolAssemblyScene' }); }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x4a4436);   // stone skirting band
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xe4dcc4);   // pale marble floor
    this.drawFloor(g, 5, 4, 12, 11, 0x24407a);                          // sunken blue debate well

    // National emblem + speaker's rostrum (top-centre, facing the chamber).
    this.drawRect(g, 8, 0, 2, 1, 0xd4af37, 0x9a7b1a);
    this.label('☀ 온누리', 8, 0, 9, '#fff0b0');
    this.drawRect(g, 7, 1, 4, 2, 0x8a6a3a, 0x5f4a28);   // rostrum block
    this.drawRect(g, 8, 1, 2, 1, 0xb98a3a, 0x8a6420);   // podium
    this.label('연단\nRostrum', 8, 1, 9, '#fff0b0');
    this.addSolid(7, 1, 10, 2);

    // Tiered debate benches — banks down both sides, facing the rostrum.
    for (const [c0, w] of [[2, 3], [13, 3]] as [number, number][]) {
      for (const r of [4, 6, 8, 10]) {
        this.drawRect(g, c0, r, w, 1, 0x3f5a44, 0x2a3f30);   // green benches
        this.addSolid(c0, r, c0 + w - 1, r);
      }
    }

    // Marble columns flanking the well.
    for (const c of [5, 12]) for (const r of [3, 6, 9]) {
      this.drawRect(g, c, r, 1, 1, 0xd8cba0, 0x9a8a66);
      this.addSolid(c, r, c, r);
    }

    // Tall windows.
    this.drawRect(g, 3, 0, 2, 1, 0x9fd8ff, 0xffffff);
    this.drawRect(g, 13, 0, 2, 1, 0x9fd8ff, 0xffffff);

    // Door
    const dp = this.tile(8, this.ROWS - 1);
    g.fillStyle(0x5f4a28); g.fillRect(dp.x + 4, dp.y, 64, 32);

    // Walls (door gap at cols 8-9)
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 7, this.ROWS - 1);
    this.addSolid(10, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const speaker = this.createNPCGraphic(9, 3, 0x445588, 0x222244, false, 0);
    this.add.text(this.tile(9, 3).x + 16, this.tile(9, 3).y - 6, tr('Speaker'),
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(speaker);

    const aide = this.createNPCGraphic(4, 11, 0x6a5a3a, 0x332200, true, 3);
    this.add.text(this.tile(4, 11).x + 16, this.tile(4, 11).y - 6, tr('Assembly Aide'),
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(aide);
  }

  protected placePlayer() { this.createPlayerGraphic(9, 12); }

  protected onInteract(npc: NPC) {
    if (npc.facing === 0) {
      this.dialog.show([
        'Speaker: Welcome to the 온누리 National Assembly Hall.',
        'Speaker: Here the province debates the laws that bind every city and route.',
        'Speaker: Even the Pokémon League answers to what is decided on this floor.',
      ]);
    } else {
      this.dialog.show([
        'Aide: Mind the benches — the afternoon session runs long.',
        'Aide: They say the first Champion was sworn in right here, at the rostrum.',
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
