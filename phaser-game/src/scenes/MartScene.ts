import { BaseInteriorScene, NPC } from './interior/BaseInteriorScene';
import { tr } from '../systems/i18n';

// A Poké Mart interior: walk up to the clerk at the counter and press SPACE to open
// the shopping menu (ShopScene). Returns to whatever city launched it (martReturnScene).
export class MartScene extends BaseInteriorScene {
  protected bgmKey = 'mart';
  constructor() { super({ key: 'MartScene' }); }

  protected override exitToWorld() {
    this.returnSceneKey = (this.registry.get('martReturnScene') as string) ?? 'WorldMapScene';
    super.exitToWorld();
  }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x2a6a9a);           // walls
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xe8eef2);           // floor
    g.lineStyle(1, 0xd0dae2, 1);
    for (let r = 1; r < this.ROWS - 1; r++) for (let c = 1; c < this.COLS - 1; c++) {
      if ((r + c) % 2 === 0) { const p = this.tile(c, r); g.fillStyle(0xdce6ee, 1); g.fillRect(p.x, p.y, 32, 32); }
    }

    // Sign
    this.drawRect(g, 1, 1, this.COLS - 2, 1, 0x2a6a9a, 0x11557a);
    this.add.text(400, this.tile(0, 1).y + 16, tr('🏪  POKÉ MART  🏪'), {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Counter (the clerk stands behind it)
    this.drawRect(g, 4, 3, 8, 2, 0x6a4a2a, 0x4a3218);
    this.label('COUNTER', 7, 3, 10, '#ffe9c0');
    this.addSolid(4, 3, 11, 4);

    // Stock shelves left + right
    this.drawRect(g, 2, 6, 2, 3, 0x88aacc, 0x6688aa); this.label('🧴', 2, 7, 14); this.addSolid(2, 6, 3, 8);
    this.drawRect(g, 12, 6, 2, 3, 0x88aacc, 0x6688aa); this.label('⚽', 12, 7, 14); this.addSolid(12, 6, 13, 8);

    // Door
    this.drawRect(g, 7, 12, 2, 1, 0x886622, 0x664400);
    this.add.text(this.tile(7, 12).x + 32, this.tile(7, 12).y + 16, '🚪', { fontSize: '20px' }).setOrigin(0.5).setDepth(5);

    // Walls (with the door gap at the bottom)
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const clerk = this.createNPCGraphic(7, 2, 0x33aa66, 0x223322, false, 0);
    (clerk as NPC & { role?: string }).role = 'clerk';
    this.add.text(this.tile(7, 2).x + 16, this.tile(7, 2).y - 6, tr('Mart Clerk'),
      { fontSize: '10px', color: '#aaffcc', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(clerk);
  }

  protected placePlayer() { this.createPlayerGraphic(7, 11); }

  protected onInteract(_npc: NPC) {
    this.dialog.show(['Mart Clerk: Welcome to the Poké Mart! What can I get you?'], () => {
      this.scene.launch('ShopScene', { parentKey: this.scene.key });
      this.scene.pause();
    });
  }

  protected checkExit() {
    const { y } = this.tile(7, 12);
    if (this.py > y + 20) this.exitToWorld();
  }
}
