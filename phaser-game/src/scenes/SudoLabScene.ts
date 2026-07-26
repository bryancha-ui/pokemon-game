import Phaser from 'phaser';
import { playBgm } from '../systems/Music';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';

/**
 * CHAPTER 7 — Return to Sudo City: Professor Song's Revelation + Rival Battle #3.
 * A cutscene scene: Prof. Song explains the Team Suri vs. 노스단 plot and 나비할망,
 * then the Rival challenges you to one last battle with his fully-evolved starter.
 */
export class SudoLabScene extends Phaser.Scene {
  private dialog!: DialogBox;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private busy = false;

  constructor() { super('SudoLabScene'); }

  create() {

    playBgm(this, 'sudo');
    this.input.keyboard?.resetKeys();
    this.cameras.main.fadeIn(400);
    this.drawLab();
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const rivalDone = !!this.registry.get('trainerDefeated_rival-3');

    if (rivalDone) {
      // Returned from Rival Battle #3 → closing beat, then head onward.
      this.busy = true;
      this.registry.set('chapter7Done', true);
      SaveManager.save(this.registry, 0, 0, 'SudoLabScene');
      this.dialog.show([
        "Rival: ...You really are something. Okay. Let's go save a giant moth grandmother.",
        "Rival: A sentence I never thought I'd say.",
        "Prof. Song: 노스단 has already moved south, toward the Jeju vents. There's no time to lose.",
        "Prof. Song: Protect 나비할망 — and through her, the whole south. Go. Now.",
        "▶ Chapter 8 — Route 5 & the Ancient Forest — continues your journey south.",
      ], () => { this.busy = false; });
      return;
    }

    // First arrival → the revelation.
    this.busy = true;
    this.dialog.show([
      'You take the express boat back to Sudo City and hurry to Professor Song\'s lab.',
      '(Two maps cover the wall: red pins mark Team Suri digs, black pins mark 노스단 installations.)',
      "Prof. Song: Thank you for coming so fast. I finally understand what we're facing.",
      "Prof. Song: Team Suri wants to wake the Spirit of Cheonji and control it — to heal the region. Misguided, dangerous.",
      "Prof. Song: But 노스단 doesn't care about the Spirit. They want to be PRESENT when it wakes —",
      "Prof. Song: — to harvest the catastrophic awakening energy and weaponize it against the south.",
      "Prof. Song: Team Suri is unknowingly doing 노스단's work for them.",
      "(She unrolls a faded scroll painting of a vast, moth-like Pokémon.)",
      "Prof. Song: 나비할망 — the Grandmother Moth. Fairy/Steel. She sleeps near the Jeju volcanic vents.",
      "Prof. Song: Her metallic wings can ABSORB and neutralize enormous energy. 노스단 knows this.",
      "Prof. Song: If they can't harvest Cheonji directly, they'll use HER as a living battery instead.",
      "Rival: Then we protect her too. ...But first —",
      "Rival: Before we split up to cover ground, one more battle. I told you my starter would evolve.",
    ], () => this.startRivalBattle());
  }

  private startRivalBattle() {
    // Rival's team is built around his OWN fully-evolved starter (the opposite type
    // the rival chose at the lab). Use rivalKey — starterKey can be changed by setLead.
    const rivalKey = (this.registry.get('rivalKey') as string) ?? 'vipour';
    const rivalFinal = rivalKey === 'munkain' ? 'banderado'    // rival Grass → Banderado
      : rivalKey === 'vipour' ? 'feldaconda'                    // rival Fire  → Feldaconda
      : 'thanatoat';                                            // rival Water → Thanatoat

    this.registry.set('trainerName', 'Rival');
    this.registry.set('trainerKey', 'rival-3');
    this.registry.set('trainerPokemon', JSON.stringify([
      { id: 0, level: 38, custom: 'martbadger' },   // Dark/Steel (evolved)
      { id: 0, level: 39, custom: 'squirrel2' },     // Soarrel — Normal/Flying (evolved)
      { id: 0, level: 40, custom: 'tokkigongju' },   // Dark/Fairy ace support
      { id: 0, level: 41, custom: rivalFinal },       // Starter FINAL evo (opposite type)
    ]));
    this.registry.set('trainerExpPool', 1500);
    this.registry.set('trainerReturnScene', 'SudoLabScene');
    this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('TrainerBattleScene'));
  }

  private drawLab() {
    const W = this.scale.width, H = this.scale.height;
    const g = this.add.graphics();
    // Lab walls / floor
    g.fillStyle(0x1a2233, 1); g.fillRect(0, 0, W, H);
    g.fillStyle(0x223047, 1); g.fillRect(0, H * 0.62, W, H * 0.38);
    // Map boards with red + black pins
    g.fillStyle(0x0e1626, 1); g.fillRect(W * 0.10, H * 0.12, W * 0.34, H * 0.34);
    g.fillStyle(0x0e1626, 1); g.fillRect(W * 0.56, H * 0.12, W * 0.34, H * 0.34);
    g.fillStyle(0xdd3333, 1);
    for (let i = 0; i < 9; i++) g.fillCircle(W * 0.12 + Math.random() * W * 0.30, H * 0.14 + Math.random() * H * 0.30, 4);
    g.fillStyle(0x111111, 1);
    for (let i = 0; i < 9; i++) g.fillCircle(W * 0.58 + Math.random() * W * 0.30, H * 0.14 + Math.random() * H * 0.30, 4);
    // Lab bench
    g.fillStyle(0x33415a, 1); g.fillRect(0, H * 0.58, W, 14);

    this.add.text(W / 2, 28, "🔬 Professor Song's Lab — Sudo City (수도 시티)", {
      fontSize: '15px', color: '#cfe3ff', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    // Professor Song (white-coat figure)
    const k = this.add.graphics().setDepth(6);
    k.setPosition(W * 0.36, H * 0.6);
    k.fillStyle(0x000000, 0.2); k.fillEllipse(0, 30, 40, 12);
    k.fillStyle(0xf0f0f0); k.fillRect(-18, -20, 36, 50);   // lab coat
    k.fillStyle(0xffcc99); k.fillRect(-14, -54, 28, 30);   // head
    k.fillStyle(0x553311); k.fillRect(-14, -54, 28, 12);   // hair
    k.fillStyle(0x000000); k.fillRect(-8, -42, 5, 5); k.fillRect(3, -42, 5, 5);
    this.add.text(W * 0.36, H * 0.6 - 76, 'Prof. Song', {
      fontSize: '11px', color: '#cfe3ff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(7);

    // Rival
    const r = this.add.graphics().setDepth(6);
    r.setPosition(W * 0.6, H * 0.62);
    r.fillStyle(0x000000, 0.2); r.fillEllipse(0, 28, 36, 11);
    r.fillStyle(0x2255cc); r.fillRect(-16, -18, 32, 46);
    r.fillStyle(0xffcc99); r.fillRect(-12, -48, 24, 28);
    r.fillStyle(0x221100); r.fillRect(-12, -48, 24, 10);
    r.fillStyle(0x000000); r.fillRect(-7, -38, 4, 4); r.fillRect(3, -38, 4, 4);
    this.add.text(W * 0.6, H * 0.62 - 70, 'Rival', {
      fontSize: '11px', color: '#88ccff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(7);

    this.add.text(W / 2, H - 12, 'SPACE to continue', {
      fontSize: '11px', color: '#7f93b5',
    }).setOrigin(0.5).setDepth(8);
  }

  update() {
    if (this.busy) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.dialog.advance();
      return;
    }
    // After the closing beat, SPACE leaves the lab and returns south.
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.cameras.main.fadeOut(400, 0, 0, 0, () => {
        this.registry.set('haeanCityReturnX', 3 * 32);
        this.registry.set('haeanCityReturnY', 12 * 32);
        this.scene.start('HaeanCityScene');
      });
    }
  }
}
