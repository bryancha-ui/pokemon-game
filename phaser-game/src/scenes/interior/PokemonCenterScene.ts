import { BaseInteriorScene, NPC } from './BaseInteriorScene';
import { tr } from '../../systems/i18n';
import { PartySystem } from '../../systems/PartySystem';
import { playJingle } from '../../systems/Music';
import { recordLastCenter } from '../../systems/Blackout';

export class PokemonCenterScene extends BaseInteriorScene {
  protected bgmKey = 'center';
  constructor() { super({ key: 'PokemonCenterScene' }); }

  create() {
    // This Pokémon Center is shared by several overworld scenes (Waterfall, Kaesong…);
    // honour whoever sent us here so the south exit returns to the right city.
    const ret = this.registry.get('pcReturnScene');
    this.returnSceneKey = (typeof ret === 'string' && ret) ? ret : 'WorldMapScene';
    // Remember this center as the whiteout respawn point.
    recordLastCenter(this, this.returnSceneKey);
    super.create();
  }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);

    // Walls
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0xcc2244);
    // Floor (white/light)
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xf0f0f0);

    // Tile pattern
    g.lineStyle(1, 0xdddddd, 1);
    for (let r = 1; r < this.ROWS - 1; r++) {
      for (let c = 1; c < this.COLS - 1; c++) {
        if ((r + c) % 2 === 0) {
          const p = this.tile(c, r);
          g.fillStyle(0xe8e8f0, 1);
          g.fillRect(p.x, p.y, 32, 32);
        }
      }
    }

    // ── PC Sign ──
    this.drawRect(g, 1, 1, this.COLS - 2, 1, 0xcc2244, 0xaa0022);
    this.add.text(400, this.tile(0, 1).y + 16, tr('🏥  POKÉMON CENTER  🏥'), {
      fontSize: '14px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // ── Reception desk ──
    this.drawRect(g, 4, 3, 8, 2, 0xcc2244, 0x990022);
    this.label('RECEPTION', 7, 3, 10, '#fff');
    this.addSolid(4, 3, 11, 4);

    // ── Healing machines (left + right) ──
    this.drawRect(g, 2, 6, 2, 2, 0x3355cc, 0x1133aa);
    this.label('⚡\nHEAL', 2, 6, 9, '#ffe44e');
    this.drawRect(g, 12, 6, 2, 2, 0x3355cc, 0x1133aa);
    this.label('⚡\nHEAL', 12, 6, 9, '#ffe44e');
    this.addSolid(2, 6, 3, 7);
    this.addSolid(12, 6, 13, 7);

    // ── Waiting chairs ──
    this.drawRect(g, 3, 9, 2, 1, 0x4444cc, 0x2222aa);
    this.drawRect(g, 6, 9, 2, 1, 0x4444cc, 0x2222aa);
    this.drawRect(g, 9, 9, 2, 1, 0x4444cc, 0x2222aa);
    this.drawRect(g, 12, 9, 2, 1, 0x4444cc, 0x2222aa);
    this.addSolid(3, 9, 4, 9);
    this.addSolid(6, 9, 7, 9);
    this.addSolid(9, 9, 10, 9);
    this.addSolid(12, 9, 13, 9);

    // ── Info board ──
    this.drawRect(g, 1, 10, 1, 2, 0x88aacc, 0x6688aa);
    this.label('ℹ️', 1, 10, 14);

    // ── Door ──
    this.drawRect(g, 7, 12, 2, 1, 0x886622, 0x664400);
    this.add.text(this.tile(7, 12).x + 32, this.tile(7, 12).y + 16, '🚪', { fontSize: '20px' }).setOrigin(0.5).setDepth(5);

    // Walls
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    // Nurse Joy (heals)
    const nurse = this.createNPCGraphic(7, 2, 0xffffff, 0xff88aa, true, 0);
    (nurse as NPC & { role?: string }).role = 'nurse';
    this.add.text(this.tile(7, 2).x + 16, this.tile(7, 2).y - 6, 'Nurse Joy',
      { fontSize: '10px', color: '#fff', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(nurse);

    // Mart Clerk (shop)
    const clerk = this.createNPCGraphic(3, 6, 0x33aa66, 0x223322, false, 0);
    (clerk as NPC & { role?: string }).role = 'clerk';
    this.add.text(this.tile(3, 6).x + 16, this.tile(3, 6).y - 6, 'Mart Clerk',
      { fontSize: '10px', color: '#aaffcc', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(clerk);

    // PC (storage box)
    const pc = this.createNPCGraphic(13, 6, 0x4466cc, 0x112244, false, 0);
    (pc as NPC & { role?: string }).role = 'pc';
    this.add.text(this.tile(13, 6).x + 16, this.tile(13, 6).y - 6, '💻 PC',
      { fontSize: '10px', color: '#aaccff', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(pc);
  }

  protected placePlayer() {
    this.createPlayerGraphic(7, 11);
  }

  protected onInteract(npc: NPC) {
    const role = (npc as NPC & { role?: string }).role ?? 'nurse';

    if (role === 'clerk') {
      this.dialog.show(['Mart Clerk: Welcome! Take a look at our wares.'], () => {
        this.scene.launch('ShopScene', { parentKey: this.scene.key });
        this.scene.pause();
      });
      return;
    }

    if (role === 'pc') {
      this.dialog.show(["Trainer's PC: Accessing Pokémon storage system..."], () => {
        this.scene.launch('BoxScene', { parentKey: this.scene.key });
        this.scene.pause();
      });
      return;
    }

    // Nurse — heal the party
    this.dialog.show(
      ['Nurse Joy: Welcome to the Pokémon Center! 🌸',
       'Nurse Joy: We restore your tired Pokémon.\nShall I heal your Pokémon?'],
      () => {
        this.dialog.showChoice(
          () => {
            PartySystem.healAll(this.registry);
            this.registry.set('playerHealed', true);
            playJingle(this, 'heal');   // healing chime
            this.dialog.show([
              'Nurse Joy: We\'ll take your Pokémon for just a moment!',
              '...  ✨  ...  ✨  ...  ✨',
              'Nurse Joy: Your Pokémon have been fully restored!\nPlease come again! 🌸',
            ]);
          },
          () => {
            this.dialog.show(['Nurse Joy: Okay! Please come again anytime. 🌸']);
          }
        );
      }
    );
  }

  protected checkExit() {
    const { y } = this.tile(7, 12);
    if (this.py > y + 20) this.exitToWorld();
  }
}
