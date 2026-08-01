import Phaser from 'phaser';
import { tr, speakerName } from '../systems/i18n';
import { playBgm } from '../systems/Music';
import { DialogBox } from '../ui/DialogBox';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem } from '../systems/PartySystem';
import { dexEntry } from '../data/Pokedex';
import { markRivalPortrait, markTrainerPortrait } from '../data/BattlePortraits';

// The mythological pantheon shown drifting through the ending credits.
const PANTHEON = ['hwanwoong', 'nabihalmang', 'poongbaek', 'woosa', 'woonsa'];

/**
 * CHAPTER 7 — Return to Sudo City: Professor Song's Revelation + Rival Battle #3.
 * A cutscene scene: Prof. Song explains the Team Suri vs. 노스단 plot and 나비할망,
 * then the Rival challenges you to one last battle with his fully-evolved starter.
 */
export class SudoLabScene extends Phaser.Scene {
  private dialog!: DialogBox;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private busy = false;
  private ending = false;

  constructor() { super('SudoLabScene'); }

  preload() {
    // Load the pantheon + the player's own party so the credits can parade them.
    const keys = new Set<string>(PANTHEON);
    for (const e of PartySystem.get(this.registry)) if (e.spriteKey) keys.add(e.spriteKey);
    for (const k of keys) {
      if (this.textures.exists(k)) continue;
      const url = dexEntry(k)?.spriteUrl;
      if (url) this.load.image(k, url);
    }
  }

  create() {

    playBgm(this, 'sudo');
    this.input.keyboard?.resetKeys();
    this.cameras.main.fadeIn(400);
    this.drawLab();
    this.dialog = new DialogBox(this, this.scale.width, this.scale.height);
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    const rivalDone = !!this.registry.get('trainerDefeated_rival-3');
    const partyPending = !!this.registry.get('sudoPartyPending');
    const finalePending = !!this.registry.get('finalePartyPending');

    if (finalePending) {
      // THE ENDING — one last celebration in Sudo City after catching 환웅, then credits.
      this.busy = true;
      this.registry.remove('finalePartyPending');
      SaveManager.save(this.registry, 0, 0, 'SudoLabScene');
      this.dialog.show([
        'You beat 노스단 to the summit, defeated Sovereign Clemont, and 환웅 itself descended to your side. The threat is over.',
        'You come home to a hero\'s welcome — and the party the alarm cut short picks up right where it left off, louder than ever.',
        'The whole region floods the streets. Lanterns, music, confetti; north and south celebrating as one people for the first time in living memory.',
        'Prof. Song: 노스단 is finished. 환웅, 풍백, 우사, 운사, 나비할망 — the entire pantheon, at peace and in your care.',
        'Prof. Song: Whatever legend they tell of this region a thousand years from now, it starts with you. Thank you, Champion.',
        '🎉 The city celebrates deep into the night in your honour.',
        '— Later, when the lanterns have burned low, the Rival finds you alone. —',
        'Rival: ...We really did it. Every gym, both leagues, a whole syndicate, and a god at the end of it.',
        'Rival: So — what now? Are you going to keep adventuring from here?',
        '(You look out over the sleeping region — north and south, whole at last. Wherever the road goes next... it\'s yours to walk.)',
      ], () => { this.busy = false; this.rollCredits(); });
      return;
    }

    if (partyPending) {
      // Northern League victory celebration party
      this.busy = true;
      this.registry.remove('sudoPartyPending');
      this.registry.set('sudoPartyDone', true);
      // This IS the post-league celebration — skip the alternate Capitol reunion party
      // so the player heads straight for the Ancient Altar shortcut to the Sacred Peak.
      this.registry.set('northReunionSeen', true);
      SaveManager.save(this.registry, 0, 0, 'SudoLabScene');
      this.dialog.show([
        'The Northern League throws a party in your honour — the whole city out in the streets, cheering the Champion who united north and south.',
        'Rival: I never thought anyone would beat Taewang. But it\'s you — so of course you did.',
        '📟 Then, mid-celebration, your Pokédex screams an alarm. Prof. Song\'s face drains of colour.',
        'Prof. Song: It\'s 노스단. They\'re moving on the Rangrim Mountains — RIGHT NOW — racing to reach 환웅 (Hwanwoong), the Sovereign Who Descended, before anyone can stop them.',
        'Prof. Song: They\'ve sealed the whole range behind their lines. But there is another way in — the 고대 제단 (Ancient Altar) opens a hidden stair straight to the Sacred Peak.',
        'Rival: The party can wait. Go — we\'ll hold things here. Beat them to the top, Champion!',
        '🎉 The music fades behind you as you race for the Rangrim Mountains...',
      ], () => {
        this.busy = false;
        this.cameras.main.fadeOut(500, 0, 0, 0, () => {
          this.registry.set('capitalReturnX', 24 * 32 + 16);
          this.registry.set('capitalReturnY', 31 * 32 + 16);
          this.scene.start('CapitolCityScene');
        });
      });
      return;
    }

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

    this.add.text(W / 2, 28, tr("🔬 Professor Song's Lab — Sudo City (수도 시티)"), {
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
    markTrainerPortrait(k, 'prof-song');
    this.add.text(W * 0.36, H * 0.6 - 76, speakerName('Prof. Song'), {
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
    markRivalPortrait(r, this.registry);
    this.add.text(W * 0.6, H * 0.62 - 70, speakerName('Rival'), {
      fontSize: '11px', color: '#88ccff', backgroundColor: '#00000099', padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(7);

    this.add.text(W / 2, H - 12, tr('SPACE to continue'), {
      fontSize: '11px', color: '#7f93b5',
    }).setOrigin(0.5).setDepth(8);
  }

  update() {
    if (this.ending) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) this.endGame();
      return;
    }
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

  /** Scroll the ending credits over a starfield, then return to the title. */
  private rollCredits() {
    const W = this.scale.width, H = this.scale.height;
    this.cameras.main.fadeOut(1000, 0, 0, 0, () => {
      this.children.removeAll();
      this.ending = true;
      playBgm(this, 'endingcredits');   // dedicated credits theme
      this.cameras.main.fadeIn(1000);
      this.add.rectangle(W / 2, H / 2, W, H, 0x05070f, 1).setDepth(200);
      const stars = this.add.graphics().setDepth(201);
      for (let i = 0; i < 130; i++) { stars.fillStyle(0xffffff, Math.random() * 0.7 + 0.2); stars.fillCircle(Math.random() * W, Math.random() * H, Math.random() < 0.15 ? 2 : 1); }

      // Parade the pantheon + the player's party drifting up through the starfield.
      const showcase = [...PANTHEON, ...PartySystem.get(this.registry).map(e => e.spriteKey)]
        .filter((k, i, a) => k && this.textures.exists(k) && a.indexOf(k) === i);
      showcase.forEach((k, i) => {
        const x = (W / (showcase.length + 1)) * (i + 1);
        const img = this.add.image(x, H + 100 + Math.random() * H, k).setDepth(202).setAlpha(0.9);
        const src = this.textures.get(k).getSourceImage();
        img.setScale(120 / Math.max((src.width as number) || 1, (src.height as number) || 1));
        this.tweens.add({ targets: img, y: -140, duration: 13000 + Math.random() * 9000, delay: i * 500, repeat: -1, ease: 'Linear' });
        this.tweens.add({ targets: img, x: x + (Math.random() * 50 - 25), duration: 2600 + Math.random() * 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
        this.tweens.add({ targets: img, angle: Math.random() * 8 - 4, duration: 3200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      });

      const credits = [
        '🌟  POKÉMON  KOREA  🌟', '', '', 'THE COMPLETE PANTHEON', '환웅 · 풍백 · 우사 · 운사 · 나비할망', '', '— TRUE END —', '', '',
        'You crossed all of Onnuri —', 'south and north, sea and summit —', 'and united a broken peninsula', 'under a single Champion.', '', '',
        'Thank you for playing.', '', '', 'Press SPACE to return to the title.',
      ].join('\n');
      const text = this.add.text(W / 2, H + 40, credits, {
        fontSize: '20px', color: '#ffe88a', align: 'center', fontStyle: 'bold', stroke: '#000', strokeThickness: 4, lineSpacing: 12,
      }).setOrigin(0.5, 0).setDepth(204);
      this.tweens.add({
        targets: text, y: -text.height - 40, duration: 20000, ease: 'Linear',
        onComplete: () => this.time.delayedCall(800, () => this.endGame()),
      });
    });
  }

  private endGame() {
    if (!this.ending) return;
    this.ending = false;
    this.cameras.main.fadeOut(1000, 0, 0, 0, () => this.scene.start('TitleScene'));
  }
}
