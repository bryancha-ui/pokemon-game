import { BaseInteriorScene, NPC } from './interior/BaseInteriorScene';

export class CapitolPalaceScene extends BaseInteriorScene {
  protected readonly COLS = 18; protected readonly ROWS = 14;
  constructor() { super({ key: 'CapitolPalaceScene' }); }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x8a6020);
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xd4a060);
    // Traditional floor tiles
    for (let r = 1; r < this.ROWS - 1; r += 2)
      this.drawFloor(g, 1, r, this.COLS - 2, r, 0xc89050);

    // Central throne area
    this.drawRect(g, 7, 1, 4, 3, 0xaa6600, 0x884400);
    this.label('Ancient\nThrone', 8, 2, 9, '#ffe44e');
    this.addSolid(7, 1, 10, 3);

    // Pillars
    [[2,2],[2,6],[2,10],[15,2],[15,6],[15,10]].forEach(([c,r]) => {
      this.drawRect(g, c, r, 1, 2, 0x885522, 0x664400);
      this.addSolid(c, r, c, r + 1);
    });

    // Artifacts
    this.drawRect(g, 5, 6, 2, 2, 0xcc9933, 0xaa7722);
    this.label('Ancient\nArtifact', 5, 6, 8, '#ffe44e');
    this.drawRect(g, 11, 6, 2, 2, 0xcc9933, 0xaa7722);
    this.label('Royal\nSword', 11, 6, 8, '#ffe44e');
    this.addSolid(5, 6, 6, 7); this.addSolid(11, 6, 12, 7);

    // Windows
    this.drawRect(g, 3, 0, 3, 1, 0x88ccff, 0xffffff);
    this.drawRect(g, 12, 0, 3, 1, 0x88ccff, 0xffffff);

    // Door
    const dp = this.tile(8, this.ROWS - 1);
    g.fillStyle(0x885522); g.fillRect(dp.x + 4, dp.y, 64, 32);
    this.add.text(dp.x + 32, dp.y + 16, '🚪', { fontSize: '20px' }).setOrigin(0.5).setDepth(5);

    // Walls
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 7, this.ROWS - 1);
    this.addSolid(10, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const guard = this.createNPCGraphic(8, 4, 0x336622, 0x111100, false, 0);
    this.add.text(this.tile(8, 4).x + 16, this.tile(8, 4).y - 6, 'Palace Guard',
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(guard);

    const curator = this.createNPCGraphic(4, 9, 0x886622, 0x332200, true, 3);
    this.add.text(this.tile(4, 9).x + 16, this.tile(4, 9).y - 6, 'Curator',
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(curator);
  }

  protected placePlayer() { this.createPlayerGraphic(8, 12); }

  protected onInteract(npc: NPC) {
    if (npc.facing === 0) {
      this.dialog.show([
        'Guard: This is the Ancient Palace, 600 years of history.',
        'Guard: The original rulers once walked these halls.',
        'Guard: They say their spirits still watch over the city.',
      ]);
    } else {
      this.dialog.show([
        'Curator: Welcome to the Capitol Palace Museum!',
        'Curator: That artifact was used by the first city founder.',
        'Curator: And that sword? It slayed a shadow beast long ago...',
        'Curator: Perhaps that is why dark-type Pokémon are so common here.',
      ]);
    }
  }

  protected checkExit() {
    const { y } = this.tile(8, this.ROWS - 1);
    if (this.py > y + 20) {
      this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('CapitolCityScene'));
    }
  }
  protected exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('CapitolCityScene'));
  }
}
