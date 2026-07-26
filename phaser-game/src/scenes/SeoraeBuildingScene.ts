import { BaseInteriorScene, NPC } from './interior/BaseInteriorScene';

type BuildingKind = 'lodge' | 'baths' | 'market' | 'skateshop';

const ROOMS: Record<BuildingKind, { title: string; wall: number; floor: number; counter: number; host: string; line: string }> = {
  lodge: {
    title: '❄ ALPINE LODGE', wall: 0x76513a, floor: 0xd8c6ad, counter: 0x8e6245,
    host: 'Lodge Keeper', line: 'Lodge Keeper: Welcome in from the cold. The hearth is always warm for travelers in Seorae.',
  },
  baths: {
    title: '♨ SNOWMELT BATHS', wall: 0x6f9a9c, floor: 0xcde9e8, counter: 0x5f8c8e,
    host: 'Bath Attendant', line: 'Bath Attendant: The spring comes up hot beneath the snow. Rest your feet and let the mountain steam do its work.',
  },
  market: {
    title: '🍡 FROST MARKET', wall: 0x5b7596, floor: 0xe0e6ef, counter: 0x426784,
    host: 'Market Vendor', line: 'Market Vendor: Frost-berries, handwarmers, trail snacks—we have everything a climber needs.',
  },
  skateshop: {
    title: '⛸ SKATE SHOP', wall: 0x4a8fa0, floor: 0xd0e8ef, counter: 0x2a6a8a,
    host: 'Skate Technician', line: 'Skate Technician: Looking to hit the ice? We\'ve got the fastest skates in Hanbando—rent or buy!',
  },
};

/** Shared enterable interiors for Seorae's lodge, bathhouse, and market. */
export class SeoraeBuildingScene extends BaseInteriorScene {
  protected bgmKey = 'seorae';
  private kind: BuildingKind = 'lodge';

  constructor() { super({ key: 'SeoraeBuildingScene' }); }

  init(data: { kind?: BuildingKind }) {
    this.kind = data.kind ?? 'lodge';
  }

  private get room() { return ROOMS[this.kind]; }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, this.room.wall);
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, this.room.floor);
    this.drawRect(g, 3, 3, 10, 2, this.room.counter, 0x352a22);
    this.addSolid(3, 3, 12, 4);
    this.drawRect(g, 2, 7, 3, 2, this.kind === 'baths' ? 0x77c7ce : this.kind === 'skateshop' ? 0x5a9ebb : 0x9a7955, 0x4d392b);
    this.drawRect(g, 11, 7, 3, 2, this.kind === 'market' ? 0xd89a55 : this.kind === 'skateshop' ? 0x6a8aaa : 0x6e9aba, 0x4d392b);
    this.addSolid(2, 7, 4, 8); this.addSolid(11, 7, 13, 8);
    this.drawRect(g, 7, 12, 2, 1, 0x886622, 0x664400);
    this.add.text(400, this.tile(0, 1).y + 16, this.room.title, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setDepth(10);
    this.add.text(this.tile(3, 7).x + 48, this.tile(7, 7).y + 32, this.kind === 'baths' ? '♨ STEAM POOL' : this.kind === 'market' ? '🍡 LOCAL GOODS' : this.kind === 'skateshop' ? '⛸ SKATE RENTAL' : '🔥 WARM HEARTH', { fontSize: '9px', color: '#fff' }).setOrigin(0.5).setDepth(10);
    this.add.text(this.tile(7, 12).x + 32, this.tile(7, 12).y + 16, '🚪', { fontSize: '20px' }).setOrigin(0.5).setDepth(10);
    this.addSolid(0, 0, this.COLS - 1, 0); this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1); this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const host = this.createNPCGraphic(7, 2, this.room.counter, 0x2a2018, this.kind !== 'market', 0);
    this.npcs.push(host);
    this.add.text(this.tile(7, 2).x + 16, this.tile(7, 2).y - 7, this.room.host, { fontSize: '10px', color: '#fff', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }).setOrigin(0.5, 1).setDepth(16);
  }

  protected placePlayer() { this.createPlayerGraphic(7, 11); }

  protected onInteract(_: NPC) {
    if (this.kind === 'market') {
      this.dialog.show([this.room.line], () => {
        this.scene.launch('ShopScene', { parentKey: this.scene.key, title: '🍡  SEORAE FROST MARKET' });
        this.scene.pause();
      });
      return;
    }
    if (this.kind === 'skateshop') {
      this.dialog.show([this.room.line, 'Skate Technician: The Skate Link will take you all the way to Sunrise City—fast and safe!']);
      return;
    }
    this.dialog.show([this.room.line]);
  }

  protected checkExit() {
    const { y } = this.tile(7, 12);
    if (this.py > y + 20) this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('SeoraeTownScene'));
  }
}
