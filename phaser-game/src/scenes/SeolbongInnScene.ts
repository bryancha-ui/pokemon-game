import { BaseInteriorScene, NPC } from './interior/BaseInteriorScene';
import { PartySystem } from '../systems/PartySystem';
import { tr } from '../systems/i18n';

// ── ♨ 온천여관 (Seolbong Hot-Spring Inn) interior ─────────────────────────────
// A warm wooden mountain inn built over a natural hot spring: a large steaming
// bath ringed with stone, a reception desk with the innkeeper (who lets weary
// climbers soak to fully heal their party), tatami rest mats and paper lanterns.
// The painted 2D layout extrudes into a cosy 3D room.
export class SeolbongInnScene extends BaseInteriorScene {
  protected readonly COLS = 16; protected readonly ROWS = 12;
  private healed = false;
  constructor() { super({ key: 'SeolbongInnScene' }); }

  create() {
    this.returnSceneKey = 'BaekduCityScene';
    this.bgmKey = 'baekdu';
    super.create();
  }

  protected drawRoom() {
    const g = this.add.graphics().setDepth(0);
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x4a382a);   // dark timber skirting
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0x9a7550);   // warm wood floor
    // Plank seams
    g.lineStyle(1, 0x6a4f36, 0.5);
    for (let c = 1; c < this.COLS - 1; c++) g.lineBetween(this.tile(c, 1).x, this.tile(c, 1).y, this.tile(c, this.ROWS - 1).x, this.tile(c, 1).y + (this.ROWS - 2) * 32);

    // ── Hot-spring bath (right side): stone rim + steaming teal water ──
    this.drawRect(g, 8, 2, 6, 7, 0x6a6258, 0x4a443a);        // stone surround
    this.drawRect(g, 9, 3, 4, 5, 0x3aa0a6, 0x2a7a80);        // water
    for (const [c, r] of [[9, 3], [11, 4], [10, 6], [12, 5], [9, 7]] as [number, number][]) {
      const p = this.tile(c, r);
      g.fillStyle(0xdff2f4, 0.5); g.fillCircle(p.x + 16, p.y + 14, 6);   // steam wisps
    }
    this.addSolid(8, 2, 13, 8);                              // can't walk into the bath
    this.label('♨ 온천', 10, 2, 10, '#eafcff');

    // ── Reception desk (top-left) with the inn's paper lantern sign ──
    this.drawRect(g, 2, 1, 3, 1, 0x7a4a2a, 0x5a3418);
    this.addSolid(2, 1, 4, 1);
    this.label('온천여관\nInn', 3, 3, 9, '#ffe0b0');

    // Tatami rest mats (lower-left)
    for (const [c, r] of [[2, 8], [4, 8], [2, 9], [4, 9]] as [number, number][]) {
      this.drawRect(g, c, r, 1, 1, 0xb8a06a, 0x8a7a4a);
    }
    // Paper lanterns flanking the door
    for (const c of [6, 10]) { const p = this.tile(c, this.ROWS - 2); g.fillStyle(0xff9a5a, 0.9); g.fillCircle(p.x + 16, p.y + 6, 7); }

    // Door
    const dp = this.tile(8, this.ROWS - 1);
    g.fillStyle(0x5a3418); g.fillRect(dp.x + 4, dp.y, 56, 32);

    // Walls (door gap at cols 8-9)
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 7, this.ROWS - 1);
    this.addSolid(10, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs() {
    const keeper = this.createNPCGraphic(3, 2, 0x8a3a4a, 0x2a1420, true, 0);
    this.add.text(this.tile(3, 2).x + 16, this.tile(3, 2).y - 6, tr('Innkeeper'),
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(keeper);

    const bather = this.createNPCGraphic(10, 4, 0xd8b48a, 0x5a3a2a, false, 1);
    this.add.text(this.tile(10, 4).x + 16, this.tile(10, 4).y - 6, tr('Bathing Climber'),
      { fontSize: '9px', color: '#ffe44e', backgroundColor: '#00000088', padding: { x: 3, y: 1 } }
    ).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(bather);
  }

  protected placePlayer() { this.createPlayerGraphic(8, 10); }

  protected onInteract(npc: NPC) {
    if (npc.facing === 0) {
      // Innkeeper — a soak in the spring fully restores the party.
      PartySystem.healAll(this.registry);
      this.healed = true;
      this.dialog.show([
        'Innkeeper: Welcome to the 온천여관 — warm your bones after the cold pass.',
        'Innkeeper: Soak a while... there. Your Pokémon look right as rain now.',
        'Innkeeper: The mountain is kinder to the rested. Come back any time.',
      ]);
    } else {
      this.dialog.show([
        'Bathing Climber: Aaah... this spring bubbles straight up from under Baekdu.',
        this.healed
          ? 'Bathing Climber: Feels like a full night\'s sleep in one soak, doesn\'t it?'
          : 'Bathing Climber: Ask the innkeeper for a soak — it heals your whole team.',
      ]);
    }
  }

  protected checkExit() {
    const { y } = this.tile(8, this.ROWS - 1);
    if (this.py > y + 20) this.exitToWorld();
  }
  protected exitToWorld() {
    this.cameras.main.fadeOut(400, 0, 0, 0, () => this.scene.start('BaekduCityScene'));
  }
}
