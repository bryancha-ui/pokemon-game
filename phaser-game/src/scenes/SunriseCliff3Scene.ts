import Phaser from 'phaser';
import { CliffClimbScene, CliffTrainer, CLIFF_ENCOUNTERS } from './CliffClimbScene';
import { EncounterEntry } from '../data/CustomPokemon';

/**
 * Sunrise Cliffs — Field 3: the Summit. Commander Ryeo (a visible character)
 * waits at the seventh seal. Reaching her triggers the convergence:
 * Ryeo's 5-Pokémon battle → Chaeyeon shatters the array → Director Suri →
 * the seventh tablet.
 */
export class SunriseCliff3Scene extends CliffClimbScene {
  protected sceneKey = 'SunriseCliff3Scene';
  protected title = '🌅 Sunrise Cliffs — The Summit (3/3)';
  protected returnKey = 'sunCliff3Return';
  protected encounters: EncounterEntry[] = CLIFF_ENCOUNTERS;
  protected trainers: CliffTrainer[] = [];   // the only fights here are the convergence

  constructor() { super('SunriseCliff3Scene'); }

  protected exitSouth() {
    this.registry.set('sunCliff2ReturnX', 11 * this.TS + 16); this.registry.set('sunCliff2ReturnY', 2 * this.TS + 16);
    this.fade(() => this.scene.start('SunriseCliff2Scene'));
  }
  protected exitNorth() { return false; }   // the summit — nowhere higher

  // ── Visible characters at the summit ──────────────────────────────────────
  protected drawExtras() {
    if (this.registry.get('seventhTablet')) return;
    const dirDone = !!this.registry.get('trainerDefeated_suri-director');
    // Commander Ryeo (silver-trimmed black coat) at the seal, until she withdraws
    if (!dirDone) this.drawFigure(11, 2, 0x14141e, 0xaab0c0, '노스단 Commander Ryeo', '#aab8ff');
    // Director Suri stands apart (white-streaked coat)
    this.drawFigure(15, 2, 0x303040, 0xcc2233, 'Director Suri', '#ff8899');
  }

  private drawFigure(col: number, row: number, coat: number, trim: number, label: string, labelColor: string) {
    const g = this.add.graphics().setDepth(8);
    g.setPosition(col * this.TS + 16, row * this.TS + 16);
    g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 16, 5);
    g.fillStyle(coat); g.fillRect(-7, -8, 14, 12);
    g.fillStyle(trim); g.fillRect(-7, -8, 14, 2);
    g.fillStyle(0x222222); g.fillRect(-6, 4, 5, 8); g.fillRect(1, 4, 5, 8);
    g.fillStyle(0xffcc99); g.fillRect(-6, -20, 12, 11);
    g.fillStyle(0x0a0a10); g.fillRect(-6, -21, 12, 5);
    g.fillStyle(0x88ccff); g.fillRect(-3, -15, 2, 2); g.fillRect(1, -15, 2, 2);
    this.add.text(col * this.TS + 16, row * this.TS - 12, label, {
      fontSize: '8px', color: labelColor, backgroundColor: '#00000099', padding: { x: 3, y: 1 },
    }).setOrigin(0.5).setDepth(9);
  }

  // ── The convergence (staged) ──────────────────────────────────────────────
  protected checkSpecial(): boolean {
    if (this.registry.get('seventhTablet')) return false;
    if (this.py > 5 * this.TS) return false;   // only at the very summit
    const ryeoDone = !!this.registry.get('trainerDefeated_nosdan-ryeo-cliff');
    const dirDone  = !!this.registry.get('trainerDefeated_suri-director');
    this.cutsceneActive = true;

    if (!ryeoDone) {
      const launch = () => {
        this.registry.set('trainerName', 'Commander Ryeo');
        this.registry.set('trainerKey', 'nosdan-ryeo-cliff');
        this.registry.set('trainerPokemon', JSON.stringify([
          { id: 0,   level: 54, custom: 'corrpanda' },     // Dark
          { id: 0,   level: 55, custom: 'palmcockatoo' },  // Dark/Flying
          { id: 0,   level: 56, custom: 'martbadger' },    // Dark/Steel
          { id: 553, level: 56 },                           // Krookodile (Ground/Dark, Earthquake)
          { id: 635, level: 58 },                           // Hydreigon (Dark/Dragon ace, Draco Meteor)
        ]));
        this.registry.set('trainerExpPool', 2600);
        this.registry.set('trainerReturnScene', 'SunriseCliff3Scene');
        this.registry.set('sunCliff3ReturnX', 5 * this.TS + 16); this.registry.set('sunCliff3ReturnY', 9 * this.TS + 16);
        this.fade(() => this.scene.start('TrainerBattleScene'));
      };
      if (!this.registry.get('cliffsConvergeSeen')) {
        this.registry.set('cliffsConvergeSeen', true);
        this.dialog.show([
          'At the summit, three forces meet at the seventh seal at once: Director Suri, Commander Ryeo, and you.',
          "Director Suri: 노스단. So the rumors were true.",
          "Commander Ryeo: You've been very useful. Unknowingly.",
          "Director Suri: (horror) You never wanted the Spirit at all. You wanted the WEAPON. You used us.",
          "Commander Ryeo: I'll take the tablet now, child. Try to stop me.",
        ], launch);
      } else {
        this.dialog.show(["Commander Ryeo: Still standing? Then we settle it here."], launch);
      }
      return true;
    }

    if (!dirDone) {
      const launch = () => {
        this.registry.set('trainerName', 'Director Suri');
        this.registry.set('trainerKey', 'suri-director');
        this.registry.set('trainerPokemon', JSON.stringify([
          { id: 461, level: 56 },                          // Weavile
          { id: 0,   level: 57, custom: 'tokkigongju' },    // Dark/Fairy
          { id: 0,   level: 57, custom: 'chattyscream' },   // Normal/Dark (Night Daze flavour)
          { id: 248, level: 58 },                           // Tyranitar (Rock/Dark, Stone Edge)
          { id: 727, level: 60 },                           // Incineroar (Fire/Dark ace, Darkest Lariat)
        ]));
        this.registry.set('trainerExpPool', 3000);
        this.registry.set('trainerReturnScene', 'SunriseCliff3Scene');
        this.registry.set('sunCliff3ReturnX', 5 * this.TS + 16); this.registry.set('sunCliff3ReturnY', 9 * this.TS + 16);
        this.fade(() => this.scene.start('TrainerBattleScene'));
      };
      if (!this.registry.get('directorSeen')) {
        this.registry.set('directorSeen', true);
        this.dialog.show([
          "Chaeyeon charges past with her Bisharp and SHATTERS 노스단's energy-collection array. Sparks rain over the cliff.",
          "Commander Ryeo: ...Perhaps you've doomed your region. Or perhaps I was wrong about everything. I no longer know. (She leaves.)",
          "Director Suri: Then it falls to me. I've come too far to stop now. Both of you — together, if you must.",
          "Rival: Gladly. (steps up beside you) Let's finish this, partner.",
          "(Chaeyeon steps back, refusing to fight. You and the Rival face Director Suri.)",
        ], launch);
      } else {
        this.dialog.show(["Director Suri: Come then. Thirty years of work will not end quietly."], launch);
      }
      return true;
    }

    // Both beaten → the seventh tablet, then back down to the city.
    this.registry.set('seventhTablet', true);
    this.dialog.show([
      "Director Suri kneels, her team spent. The fight goes out of her.",
      "Director Suri: ...Thirty years. (She presses the seventh tablet into your hand.) Don't let the Spirit suffer.",
      "🗿 You received the SEVENTH CHEONJI TABLET!",
      "Prof. Song (comms): That's all seven. With 나비할망 at your side, you can finally face what waits at Cheonji.",
      "Rival: Let's get down, earn the Stormwatcher Badge, then climb Baekdu and end this. ▶ Chapter 11 awaits.",
    ], () => {
      this.registry.set('sunriseCityReturnX', 15 * this.TS); this.registry.set('sunriseCityReturnY', 3 * this.TS);
      this.fade(() => this.scene.start('SunriseCityScene'));
    });
    return true;
  }
}
