import { BaseInteriorScene, NPC } from './BaseInteriorScene';
import { Inventory, formatMoney } from '../../systems/Items';
import { PartySystem } from '../../systems/PartySystem';
import { playJingle } from '../../systems/Music';
import { tr } from '../../systems/i18n';

// ── 강철도냉면 (Gangcheoldo Naengmyeon restaurant) ─────────────────────────────────────
// A little noodle house off the steel-city square. Order a bowl of the famous
// chewy sweet-potato-starch cold noodles (₩700) — a hearty meal fully restores
// the whole party, a cheap and cheerful alternative to the Pokémon Center.

const BOWL_COST = 700;

export class HamhungNaengmyeonScene extends BaseInteriorScene {
  private owner!: NPC;

  constructor() { super({ key: 'HamhungNaengmyeonScene' }); }

  create() {
    this.returnSceneKey = 'HamhungCityScene';   // exit back into Gangcheoldo, at the restaurant door
    super.create();
  }

  protected drawRoom(): void {
    const g = this.add.graphics().setDepth(0);
    // Walls + warm wooden floor
    this.drawFloor(g, 0, 0, this.COLS - 1, 1, 0x7a2a24);          // top wall (red)
    this.drawFloor(g, 0, 2, this.COLS - 1, this.ROWS - 1, 0xd8b884); // floor
    g.lineStyle(1, 0xc4a672, 0.6);
    for (let r = 3; r < this.ROWS; r++) { const p = this.tile(0, r); g.lineBetween(p.x, p.y, p.x + this.COLS * 32, p.y); }

    // Sign
    this.add.text(this.scale.width / 2, this.tile(0, 0).y + 16, tr('🍜  강철도냉면  ·  HAMHUNG NAENGMYEON  🍜'), {
      fontSize: '13px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);

    // ── Kitchen counter across the back ──
    this.drawRect(g, 2, 2, 12, 2, 0x8a4a2a, 0x5a2e18);
    this.addSolid(2, 2, 13, 3);
    // steaming bowls on the counter
    for (const c of [3, 5, 10, 12]) { const p = this.tile(c, 2); g.fillStyle(0xf0f0f0, 1); g.fillEllipse(p.x + 16, p.y + 34, 20, 10); g.fillStyle(0x8a2a2a, 1); g.fillEllipse(p.x + 16, p.y + 32, 14, 6); }
    this.add.text(this.tile(4, 2).x, this.tile(4, 2).y + 6, '♨', { fontSize: '12px' });
    this.add.text(this.tile(11, 2).x, this.tile(11, 2).y + 6, '♨', { fontSize: '12px' });
    // menu board
    this.drawRect(g, 6, 0, 4, 1, 0x2a1a12, 0x000000);
    this.add.text(this.tile(8, 0).x, this.tile(8, 0).y + 16, `강철도냉면  ${formatMoney(BOWL_COST)}`, { fontSize: '9px', color: '#ffe44e' }).setOrigin(0.5).setDepth(10);

    // ── Dining tables (leave the centre aisle clear) ──
    for (const [c, r] of [[2, 6], [12, 6], [2, 9], [12, 9]] as [number, number][]) {
      this.drawRect(g, c, r, 2, 2, 0xa8763e, 0x6d4a24);
      const p = this.tile(c, r); g.fillStyle(0xf2f2f2, 1); g.fillEllipse(p.x + 32, p.y + 34, 16, 8);   // a bowl
      this.addSolid(c, r, c + 1, r + 1);
    }

    // ── Door (bottom centre) ──
    this.drawRect(g, 7, this.ROWS - 1, 2, 1, 0x5a3a1a, 0x3a2410);
    this.label('▼', 7, this.ROWS - 1, 12, '#ffe44e');
    this.label('▼', 8, this.ROWS - 1, 12, '#ffe44e');

    // Perimeter walls (door open)
    this.addSolid(0, 0, this.COLS - 1, 1);
    this.addSolid(0, 2, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 2, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs(): void {
    // The owner — an apron-wearing 아주머니 — greets you on the floor.
    this.owner = this.createNPCGraphic(8, 4, 0xcc4444, 0x2a2622, true, 0);
    const p = this.tile(8, 4);
    this.add.text(p.x + 16, p.y - 18, '🍜 사장님', {
      fontSize: '9px', color: '#ffd88a', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(16);
    this.npcs.push(this.owner);
  }

  protected placePlayer(): void {
    this.createPlayerGraphic(8, 10);
  }

  protected onInteract(_npc: NPC): void {
    this.dialog.show([
      '사장님: 어서 오세요! Welcome to the finest 강철도냉면 house in the city!',
      `사장님: A bowl of our famous 강철도냉면 — chewy sweet-potato noodles in a fiery cold broth. ${formatMoney(BOWL_COST)} a bowl. Care for one?`,
    ], () => {
      this.dialog.showChoice(
        () => this.order(),
        () => this.dialog.show(['사장님: Take your time! The broth stays nice and cold.']),
      );
    });
  }

  private order(): void {
    if (!Inventory.spend(this.registry, BOWL_COST)) {
      this.dialog.show([`사장님: Ah — a little short, are we? A bowl is ${formatMoney(BOWL_COST)}. Come back soon, friend!`]);
      return;
    }
    PartySystem.healAll(this.registry);
    playJingle(this, 'heal');
    this.dialog.show([
      'You slurp the icy, springy noodles in spicy broth — 시원하고 쫄깃하다! 😋',
      'You share the big bowl with your team, and everyone eats their fill.',
      'Your Pokémon are refreshed and fully restored!',
      '사장님: 맛있게 드셨어요? 또 오세요 — come again, Champion!',
    ]);
  }

  protected checkExit(): void {
    const doorY = this.tile(0, this.ROWS - 1).y;
    const nearDoor = this.px > this.tile(6, 0).x && this.px < this.tile(10, 0).x;
    if (nearDoor && this.py >= doorY + 8) this.exitToWorld();
  }
}
