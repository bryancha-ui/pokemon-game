import { BaseInteriorScene, NPC } from './BaseInteriorScene';
import { PartySystem } from '../../systems/PartySystem';
import { playJingle } from '../../systems/Music';
import { speakerName, tr } from '../../systems/i18n';

// ── Generic enterable building for the northern 어사대 cities ──────────────────────
// One reusable interior driven by a config id (set in registry 'northBuildingId' by
// the city's landmark). Each entry themes the room + an owner NPC; hospitality places
// (inns, taverns, teahouses, lodges) let the party rest — a free full heal.

interface NBuilding {
  title: string; npc: string; color: number; female: boolean;
  lines: string[]; heal?: boolean; floor: number; wall: number; accent: number;
}

export const NORTH_BUILDINGS: Record<string, NBuilding> = {
  'nampo-tavern': {
    title: "남포 뱃사람 주막 · Nampo Sailors' Tavern", npc: 'Barkeep', color: 0x2f6f9a, female: false,
    floor: 0xd8b884, wall: 0x5a3a2a, accent: 0x3a6a9a, heal: true,
    lines: ["Barkeep: Ahoy! In from the salt air, are ye? Sit by the fire — first bowl of clam broth's on the house.",
            'You and your team share a hot meal by the hearth. Everyone is rested and fully restored!'],
  },
  'wonsan-cafe': {
    title: '갈마 해변 카페 · Kalma Beach Café', npc: 'Barista', color: 0x2a8ab0, female: true,
    floor: 0xf0e4cc, wall: 0x3a6a8a, accent: 0x66b0e0, heal: true,
    lines: ['Barista: Welcome to Kalma Beach Café! Sea breeze, warm drinks, comfy cushions.',
            'You sip a sweet iced tea while your Pokémon nap in the sun. Everyone feels refreshed and fully healed!'],
  },
  'hamhung-bathhouse': {
    title: '함흥 대중목욕탕 · Hamhung Bathhouse', npc: 'Attendant', color: 0x8a5a6a, female: true,
    floor: 0xcfe0e8, wall: 0x6a7a8a, accent: 0x88ccff, heal: true,
    lines: ['Attendant: 어서오세요! A steaming soak washes the forge-soot right off. Take your team in.',
            'You and your Pokémon steam away the day\'s aches. Everyone emerges glowing — fully restored!'],
  },
  'chongjin-inn': {
    title: "뱃사람 여관 · Foggy Sailors' Inn", npc: 'Innkeeper', color: 0x4a5a6a, female: false,
    floor: 0xc4b090, wall: 0x3a3f4a, accent: 0x556678, heal: true,
    lines: ['Innkeeper: A room away from the fog, friend? You look like you\'ve seen a ghost.',
            'You rest until the foghorns fade to a lullaby. Your team wakes fully restored!'],
  },
  'sinuiju-post': {
    title: '압록강 국경 교역소 · Amrok Border Trading Post', npc: 'Trader', color: 0x8a6a3a, female: false,
    floor: 0xd8cca0, wall: 0x6a4a2a, accent: 0xbfe0f0,
    lines: ['Trader: Goods from across the frozen river — furs, jade, medicine, rumours.',
            'Trader: The bridge to the far bank is broken, but the trade never stops. Careful who you deal with here, Champion.'],
  },
  'samjiyon-lodge': {
    title: '삼지연 고원 산장 · Samjiyon Highland Lodge', npc: 'Lodge Keeper', color: 0xaab0d0, female: true,
    floor: 0xe8eef4, wall: 0x6a7590, accent: 0xaef0ff, heal: true,
    lines: ['Lodge Keeper: Come in from the cold! The larch fire\'s roaring and the tea is hot.',
            'You thaw out by the great stone hearth as snow drifts past the windows. Your team is warm and fully healed!'],
  },
};

export class NorthernBuildingScene extends BaseInteriorScene {
  private owner!: NPC;
  private cfg!: NBuilding;

  constructor() { super({ key: 'NorthernBuildingScene' }); }

  create() {
    const id = (this.registry.get('northBuildingId') as string) ?? 'nampo-tavern';
    this.cfg = NORTH_BUILDINGS[id] ?? NORTH_BUILDINGS['nampo-tavern'];
    this.returnSceneKey = (this.registry.get('northBuildingReturn') as string) ?? 'NampoCityScene';
    super.create();
  }

  protected drawRoom(): void {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, 1, this.cfg.wall);
    this.drawFloor(g, 0, 2, this.COLS - 1, this.ROWS - 1, this.cfg.floor);
    g.lineStyle(1, 0x000000, 0.08);
    for (let r = 3; r < this.ROWS; r++) { const p = this.tile(0, r); g.lineBetween(p.x, p.y, p.x + this.COLS * 32, p.y); }

    this.add.text(this.scale.width / 2, this.tile(0, 0).y + 16, tr(this.cfg.title), {
      fontSize: '12px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // Counter across the back
    this.drawRect(g, 2, 2, 12, 2, this.cfg.accent, 0x000000);
    this.addSolid(2, 2, 13, 3);
    for (const c of [3, 5, 10, 12]) { const p = this.tile(c, 2); g.fillStyle(0xf4f0e4, 1); g.fillEllipse(p.x + 16, p.y + 34, 18, 9); }

    // Tables (centre aisle clear)
    for (const [c, r] of [[2, 6], [12, 6], [2, 9], [12, 9]] as [number, number][]) {
      this.drawRect(g, c, r, 2, 2, this.cfg.accent, 0x000000);
      const p = this.tile(c, r); g.fillStyle(0xf4f0e4, 1); g.fillEllipse(p.x + 32, p.y + 34, 14, 7);
      this.addSolid(c, r, c + 1, r + 1);
    }

    // Door + perimeter walls
    this.drawRect(g, 7, this.ROWS - 1, 2, 1, 0x5a3a1a, 0x3a2410);
    this.label('▼', 7, this.ROWS - 1, 12, '#ffe44e'); this.label('▼', 8, this.ROWS - 1, 12, '#ffe44e');
    this.addSolid(0, 0, this.COLS - 1, 1);
    this.addSolid(0, 2, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 2, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs(): void {
    this.owner = this.createNPCGraphic(8, 4, this.cfg.color, 0x2a2622, this.cfg.female, 0);
    const p = this.tile(8, 4);
    this.add.text(p.x + 16, p.y - 18, speakerName(this.cfg.npc), {
      fontSize: '9px', color: '#ffd88a', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(16);
    this.npcs.push(this.owner);
  }

  protected placePlayer(): void { this.createPlayerGraphic(8, 10); }

  protected onInteract(_npc: NPC): void {
    this.dialog.show(this.cfg.lines);
    if (this.cfg.heal) { PartySystem.healAll(this.registry); playJingle(this, 'heal'); }
  }

  protected checkExit(): void {
    const doorY = this.tile(0, this.ROWS - 1).y;
    const nearDoor = this.px > this.tile(6, 0).x && this.px < this.tile(10, 0).x;
    if (nearDoor && this.py >= doorY + 8) this.exitToWorld();
  }
}
