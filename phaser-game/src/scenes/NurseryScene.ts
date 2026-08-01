import { BaseInteriorScene, type NPC } from './interior/BaseInteriorScene';
import { BreedingSystem } from '../systems/BreedingSystem';
import { t } from '../systems/i18n';

/** Pine Needle Town Pokémon Nursery — a walkable ranch-style interior. */
export class NurseryScene extends BaseInteriorScene {
  protected bgmKey = 'pineneedle';

  constructor() { super({ key: 'NurseryScene' }); }

  create() {
    this.returnSceneKey = 'PineNeedleTownScene';
    this.solidRects = [];
    this.npcs = [];
    super.create();
  }

  protected drawRoom(): void {
    const g = this.add.graphics().setDepth(0);
    // Pine-beam walls and a warm ondol-style floor.
    this.drawFloor(g, 0, 0, this.COLS - 1, this.ROWS - 1, 0x6b4a2d);
    this.drawFloor(g, 1, 1, this.COLS - 2, this.ROWS - 2, 0xe0c58f);
    for (let r = 1; r < this.ROWS - 1; r++) {
      for (let c = 1; c < this.COLS - 1; c++) {
        const p = this.tile(c, r);
        g.lineStyle(1, 0xc2a66f, 0.45); g.strokeRect(p.x, p.y, 32, 32);
      }
    }

    // Reception desk.
    this.drawRect(g, 5, 3, 6, 2, 0x9b6038, 0x5e351f);
    this.label(t('NURSERY', '키우미집'), 7, 3, 11, '#fff0b5');
    this.addSolid(5, 4, 10, 4);

    // Two open pens with low fences, straw beds and water bowls.
    for (const x of [2, 11]) {
      this.drawRect(g, x, 6, 3, 3, 0x87b968, 0x476a38);
      const p = this.tile(x, 6);
      g.lineStyle(4, 0xb88752, 1);
      g.strokeRect(p.x, p.y, 3 * 32, 3 * 32);
      g.fillStyle(0xe5c65e, 0.8); g.fillEllipse(p.x + 47, p.y + 67, 48, 18);
      g.fillStyle(0x5ea7d8, 1); g.fillEllipse(p.x + 72, p.y + 78, 18, 8);
    }
    this.label('①', 3, 6, 16, '#ffffff');
    this.label('②', 12, 6, 16, '#ffffff');

    // Incubator display in the centre.
    this.drawRect(g, 7, 7, 2, 2, 0xe8f3ff, 0x5f88aa);
    this.label('🥚', 7, 7, 18);
    this.addSolid(7, 7, 8, 8);

    // Wide exit opening; no tiny door tile obstructs the player.
    this.drawRect(g, 7, 12, 2, 1, 0xcba86d, 0x8a673b);
    this.addSolid(0, 0, this.COLS - 1, 0);
    this.addSolid(0, 0, 0, this.ROWS - 1);
    this.addSolid(this.COLS - 1, 0, this.COLS - 1, this.ROWS - 1);
    this.addSolid(0, this.ROWS - 1, 6, this.ROWS - 1);
    this.addSolid(9, this.ROWS - 1, this.COLS - 1, this.ROWS - 1);
  }

  protected setupNPCs(): void {
    const keeper = this.createNPCGraphic(7, 4, 0xf4e6a8, 0x4a2e20, true, 0);
    (keeper as NPC & { role?: string }).role = 'keeper';
    this.add.text(this.tile(7, 4).x + 16, this.tile(7, 4).y - 8, t('Nursery Keeper', '키우미 할머니'), {
      fontSize: '10px', color: '#fff4b0', backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5, 1).setDepth(16);
    this.npcs.push(keeper);
  }

  protected placePlayer(): void { this.createPlayerGraphic(7, 11); }

  protected onInteract(_npc: NPC): void {
    const state = BreedingSystem.getState(this.registry);
    const status = state.eggReady
      ? t('Oh! We found an Egg while caring for them.', '어머! 포켓몬들을 돌보다가 알을 발견했단다.')
      : state.carriedEgg
        ? t('Keep walking with that Egg and it will hatch.', '그 알을 가지고 계속 걸으면 곧 부화할 거란다.')
        : t('Leave two compatible Pokémon with us and they may produce an Egg.', '서로 잘 맞는 포켓몬 두 마리를 맡기면 알이 생길 수 있단다.');
    this.dialog.show([
      t('Nursery Keeper: Welcome to Pine Needle Pokémon Nursery!', '키우미 할머니: 솔잎마을 포켓몬 키우미집에 잘 왔단다!'),
      status,
    ], () => {
      this.scene.launch('NurseryManageScene', { parentKey: this.scene.key });
      this.scene.pause();
    });
  }

  protected checkExit(): void {
    const { y } = this.tile(7, 12);
    if (this.py > y + 20) this.exitToWorld();
  }
}
