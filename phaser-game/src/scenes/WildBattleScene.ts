import Phaser from 'phaser';
import { Pokemon, Move } from '../battle/Pokemon';
import { STARTERS, TYPE_COLORS } from '../data/StarterData';
import { DISGUIJAR_DATA, DISGUIJAR_MOVES } from '../data/CustomPokemon';
import { fetchPokemon, fetchMove } from '../data/PokeAPI';
import { PartySystem, PartyEntry } from '../systems/PartySystem';
import { buildFromEntry } from '../systems/PartyBattle';
import { openSwitchPanel } from '../systems/SwitchPanel';
import { SaveManager } from '../utils/SaveManager';

type WildState = 'loading' | 'intro' | 'playerAction' | 'playerMove' | 'bag' | 'busy' | 'catching' | 'over';

const HP_W = 180;

export class WildBattleScene extends Phaser.Scene {
  private player!: Pokemon;
  private wild!: Pokemon;
  private wildCatchRate = 45;
  private state: WildState = 'loading';

  // UI
  private dialogText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private wildHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private wildHpText!: Phaser.GameObjects.Text;
  private playerLvText!: Phaser.GameObjects.Text;
  private wildLvText!: Phaser.GameObjects.Text;
  private wildSprite!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private actionPanel!: Phaser.GameObjects.Container;
  private movePanel!: Phaser.GameObjects.Container;
  private bagPanel!: Phaser.GameObjects.Container;
  private ballGraphic!: Phaser.GameObjects.Graphics;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private aKey!: Phaser.Input.Keyboard.Key;

  private W = 1280;
  private H = 720;
  private activeSlot = 0;  // which party slot is currently battling

  constructor() { super('WildBattleScene'); }

  preload() {
    if (!this.textures.exists('disguijar'))
      this.load.image('disguijar', '/assets/disguijar.png');
    STARTERS.forEach(s => {
      if (!this.textures.exists(s.spriteKey))
        this.load.image(s.spriteKey, s.data.spriteUrl);
    });
  }

  async create() {
    this.cameras.main.fadeIn(300);
    this.drawBackground();
    this.createDialogBox();
    this.typeDialog('Loading…');
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.aKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // M or B opens the menu (party + bag) without interrupting the battle
    this.input.keyboard!.on('keydown-M', () => this.scene.launch('MenuScene'));
    this.input.keyboard!.on('keydown-B', () => this.scene.launch('MenuScene'));

    await this.buildPokemon();

    this.createSprites();
    this.createHUDs();
    this.createActionPanel();
    this.createMovePanel();
    this.createBagPanel();
    this.hideAllPanels();

    this.wildCatchRate = (this.registry.get('wildCatchRate') as number) ?? 45;

    // Intro: wild Pokémon slides in
    this.wildSprite.setAlpha(0);
    this.tweens.add({
      targets: this.wildSprite, x: 560, y: 130, alpha: 1, duration: 400, ease: 'Power2',
      onComplete: () => {
        this.typeDialog(`A wild ${this.wild.name.toUpperCase()} appeared!`, () => {
          this.playerSprite.setAlpha(1);
          this.tweens.add({
            targets: this.playerSprite, x: 180, y: 260, duration: 350, ease: 'Power2',
            onComplete: () => {
              this.typeDialog(`Go! ${this.player.name.toUpperCase()}!`, () => this.playerAction());
            },
          });
        });
      },
    });
  }

  // ── Pokémon setup ─────────────────────────────────────────────────────────

  private async buildPokemon() {
    const wildId     = this.registry.get('wildId') as string | number;
    const wildLevel  = (this.registry.get('wildLevel')  as number) ?? 5;
    const wildCustom = !!(this.registry.get('wildCustom'));

    // Build wild Pokémon
    if (wildCustom && wildId === 'disguijar') {
      this.wild = new Pokemon(DISGUIJAR_DATA, wildLevel, DISGUIJAR_MOVES);
      if (!this.textures.exists('disguijar')) {
        this.load.image('disguijar', '/assets/disguijar.png');
        await new Promise<void>(r => { this.load.once('complete', r); this.load.start(); });
      }
    } else {
      const [data, ...moves] = await Promise.all([
        fetchPokemon(wildId as number),
        fetchMove('tackle'),
        fetchMove('growl'),
      ]);
      // Load sprite from PokéAPI
      if (!this.textures.exists(`wild-${wildId}`)) {
        this.load.image(`wild-${wildId}`, data.spriteUrl);
        await new Promise<void>(r => { this.load.once('complete', r); this.load.start(); });
      }
      data.spriteUrl = `//${data.spriteUrl.split('//')[1]}`;
      this.wild = new Pokemon(data, wildLevel, moves);
    }

    // Build player Pokémon from party slot 0
    const starterKey   = (this.registry.get('starterKey')  as string) ?? 'vipour';
    const starterLevel = (this.registry.get('starterLevel') as number) ?? 5;
    const def = STARTERS.find(s => s.spriteKey === starterKey) ?? STARTERS[1];
    this.player = new Pokemon(def.data, starterLevel, def.startingMoves);
    // Restore current HP from party
    const party = PartySystem.get(this.registry);
    if (party.length > 0) this.player['hp'] = Math.min(party[0].hp, this.player.maxHp);
    this.player.exp = (this.registry.get('starterExp') as number) ?? 0;
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x6688bb, 1); g.fillRect(0, 0, this.W, 300);
    g.fillStyle(0x4a7a3a, 1); g.fillRect(0, 200, this.W, 110);
    g.fillStyle(0x8a9a6a, 1);
    g.fillTriangle(0, 200, 150, 80, 300, 200);
    g.fillTriangle(200, 200, 400, 60, 600, 200);
    g.fillStyle(0xb09060, 1); g.fillEllipse(180, 280, 160, 28);
    g.fillEllipse(580, 155, 120, 22);
    g.fillStyle(0x0d0d2e, 0.96); g.fillRect(0, this.H - 120, this.W, 120);
    g.lineStyle(2, 0x5577aa, 1); g.lineBetween(0, this.H - 120, this.W, this.H - 120);
    this.add.text(this.W / 2, this.H - 108, '▶ SPACE to advance  |  A to throw Pokéball', {
      fontSize: '11px', color: '#5577aa',
    }).setOrigin(0.5).setDepth(2);
  }

  // ── HUDs ──────────────────────────────────────────────────────────────────

  private createHUDs() {
    // Wild HUD — top left
    this.add.rectangle(115, 50, 220, 60, 0x0d0d2e, 0.92).setStrokeStyle(1, 0x5577aa);
    this.add.text(12, 24, this.wild.name.toUpperCase(), { fontSize: '13px', color: '#fff', fontStyle: 'bold' });
    this.wildLvText = this.add.text(180, 24, `Lv.${this.wild.level}`, { fontSize: '12px', color: '#ffe44e' });
    this.add.rectangle(115, 52, HP_W + 6, 10, 0x333355);
    this.wildHpBar  = this.add.rectangle(25, 52, HP_W, 8, 0x44cc44).setOrigin(0, 0.5);
    this.wildHpText = this.add.text(12, 60, `${this.wild.hp}/${this.wild.maxHp}`, { fontSize: '10px', color: '#aaa' });

    // Player HUD — right
    this.add.rectangle(660, 318, 220, 60, 0x0d0d2e, 0.92).setStrokeStyle(1, 0x5577aa);
    this.add.text(552, 292, this.player.name.toUpperCase(), { fontSize: '13px', color: '#fff', fontStyle: 'bold' });
    this.playerLvText = this.add.text(730, 292, `Lv.${this.player.level}`, { fontSize: '12px', color: '#ffe44e' }).setOrigin(1, 0);
    this.add.rectangle(660, 320, HP_W + 6, 10, 0x333355);
    this.playerHpBar  = this.add.rectangle(570, 320, HP_W, 8, 0x44cc44).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(552, 330, `${this.player.hp}/${this.player.maxHp}`, { fontSize: '10px', color: '#aaa' });
  }

  // ── Sprites ───────────────────────────────────────────────────────────────

  private createSprites() {
    const wKey = this.wild.data.id === 904
      ? 'disguijar'
      : `wild-${this.registry.get('wildId')}`;
    const pKey = (this.registry.get('starterKey') as string) ?? 'vipour';

    this.wildSprite   = this.add.image(900, 60, this.textures.exists(wKey) ? wKey : 'disguijar')
      .setDepth(5).setAlpha(0);
    this.playerSprite = this.add.image(-80, 320, pKey).setDepth(5).setFlipX(true).setAlpha(0);

    const fitImg = (img: Phaser.GameObjects.Image, size: number) => {
      const tex = this.textures.get(img.texture.key).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      img.setScale(size / dim);
    };
    fitImg(this.wildSprite, 130);
    fitImg(this.playerSprite, 140);
  }

  // ── Dialog ────────────────────────────────────────────────────────────────

  private createDialogBox() {
    this.dialogText = this.add.text(16, this.H - 108, '', {
      fontSize: '16px', color: '#fff',
      wordWrap: { width: this.W * 0.58 }, lineSpacing: 5,
    }).setDepth(10);
  }

  private typeDialog(text: string, onDone?: () => void) {
    this.dialogText.setText('');
    let i = 0;
    const ev = this.time.addEvent({
      delay: 26, repeat: text.length - 1,
      callback: () => {
        this.dialogText.setText(text.slice(0, ++i));
        if (i >= text.length) {
          ev.destroy();
          if (onDone) this.time.delayedCall(600, onDone);
        }
      },
    });
  }

  // ── Action panel ──────────────────────────────────────────────────────────

  private createActionPanel() {
    this.actionPanel = this.add.container(this.W * 0.60, this.H - 120).setDepth(10);
    const bg = this.add.rectangle(80, 60, 316, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    this.actionPanel.add(bg);

    const actions = [
      { label: 'FIGHT',     x: 16, y: 16, cb: () => this.onFight() },
      { label: '🔴 BAG',    x: 170, y: 16, cb: () => this.onBag() },
      { label: 'POKÉMON',  x: 16, y: 68, cb: () => this.onSwitchPokemon() },
      { label: 'RUN',      x: 170, y: 68, cb: () => this.onRun() },
    ];
    actions.forEach(a => {
      const t = this.add.text(a.x, a.y, a.label, { fontSize: '19px', color: '#fff' })
        .setInteractive({ useHandCursor: true })
        .on('pointerover',  () => t.setColor('#ffe44e'))
        .on('pointerout',   () => t.setColor('#ffffff'))
        .on('pointerdown',  a.cb);
      this.actionPanel.add(t);
    });
  }

  // ── Move panel ────────────────────────────────────────────────────────────

  private createMovePanel() {
    this.movePanel = this.add.container(0, this.H - 120).setDepth(10).setVisible(false);
    const bg = this.add.rectangle(this.W / 2 - 60, 60, this.W * 0.76, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    this.movePanel.add(bg);
    this.movePanel.add(
      this.add.text(this.W - 30, 10, '← BACK', { fontSize: '12px', color: '#aaa' })
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.playerAction()),
    );

    const cols = [14, 200, 390, 576];
    this.player.moves.forEach((move, i) => {
      const x = cols[i] ?? cols[3];
      const pill = this.add.rectangle(x + 80, 28, 164, 50, TYPE_COLORS[move.data.type] ?? 0x444466, 0.25)
        .setStrokeStyle(1, TYPE_COLORS[move.data.type] ?? 0x444466, 0.8).setOrigin(0.5);
      const btn = this.add.text(x + 6, 10, move.data.name.toUpperCase(), { fontSize: '14px', color: '#fff', fontStyle: 'bold' })
        .setInteractive({ useHandCursor: true })
        .on('pointerover',  () => btn.setColor('#ffe44e'))
        .on('pointerout',   () => btn.setColor('#ffffff'))
        .on('pointerdown',  () => this.onMoveSelected(move));
      const pp  = this.add.text(x + 6, 30, `PP ${move.pp}/${move.data.pp}`, { fontSize: '10px', color: '#ccc' });
      const typ = this.add.text(x + 6, 46, move.data.type.toUpperCase(), { fontSize: '9px', color: '#aaa' });
      this.movePanel.add([pill, btn, pp, typ]);
    });
  }

  // ── Bag panel ─────────────────────────────────────────────────────────────

  private createBagPanel() {
    this.bagPanel = this.add.container(this.W * 0.60, this.H - 120).setDepth(10).setVisible(false);
    const bg = this.add.rectangle(80, 60, 316, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    const back = this.add.text(220, 10, '← BACK', { fontSize: '12px', color: '#aaa' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.playerAction());

    const ballRow = this.add.container(0, 0);
    const ballBg  = this.add.rectangle(80, 60, 280, 70, 0x1a1a3a).setStrokeStyle(1, 0x3355aa);
    const ballLbl = this.add.text(16, 36, '🔴 Pokéball', { fontSize: '16px', color: '#fff' });
    const ballCnt = this.add.text(200, 36, `×${(this.registry.get('pokeballs') as number) ?? 0}`,
      { fontSize: '16px', color: '#ffe44e' });
    const throwBtn = this.add.text(120, 76, 'THROW (A)', { fontSize: '14px', color: '#ffe44e' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.throwBall());
    ballRow.add([ballBg, ballLbl, ballCnt, throwBtn]);

    this.bagPanel.add([bg, back, ballRow]);
    this.bagPanel.setData('ballCnt', ballCnt);
  }

  // ── Battle flow ───────────────────────────────────────────────────────────

  private playerAction() {
    this.state = 'playerAction';
    const balls = (this.registry.get('pokeballs') as number) ?? 0;
    this.typeDialog(`What will ${this.player.name.toUpperCase()} do?  🔴×${balls}`);
    this.showActionPanel();
  }

  private onFight() {
    if (this.state !== 'playerAction') return;
    this.state = 'playerMove';
    this.showMovePanel();
    this.typeDialog('Choose a move!');
  }

  private onBag() {
    if (this.state !== 'playerAction') return;
    this.state = 'bag';
    // Update ball count display
    const cnt = (this.bagPanel.getData('ballCnt') as Phaser.GameObjects.Text);
    cnt.setText(`×${(this.registry.get('pokeballs') as number) ?? 0}`);
    this.hideAllPanels();
    this.bagPanel.setVisible(true);
    this.typeDialog('Choose an item!');
  }

  private onMoveSelected(move: Move) {
    if (this.state !== 'playerMove') return;
    if (move.pp <= 0) { this.typeDialog('No PP left!', () => this.onFight()); return; }
    this.hideAllPanels();
    this.runTurn(move);
  }

  private onRun() {
    if (this.state !== 'playerAction') return;
    // Run success check (simplified: 50% + speed advantage)
    const runChance = 0.5 + (this.player.spd - this.wild.spd) / 200;
    if (Math.random() < runChance) {
      this.typeDialog('Got away safely!', () => this.returnToRoute());
    } else {
      this.typeDialog("Can't escape!", () => {
        this.enemyTurn(null);
      });
    }
  }

  // ── Pokéball throw ────────────────────────────────────────────────────────

  private throwBall() {
    if (this.state !== 'bag') return;
    const balls = (this.registry.get('pokeballs') as number) ?? 0;
    if (balls <= 0) { this.typeDialog('No Pokéballs left!', () => this.playerAction()); return; }

    this.registry.set('pokeballs', balls - 1);
    this.state = 'catching';
    this.hideAllPanels();

    // Ball animation
    if (!this.ballGraphic) {
      this.ballGraphic = this.add.graphics().setDepth(20);
    }
    const ballG = this.ballGraphic;
    const startX = 200, startY = 260;
    const endX   = this.wildSprite.x;
    const endY   = this.wildSprite.y;

    // Draw ball
    const drawBall = (x: number, y: number) => {
      ballG.clear();
      ballG.fillStyle(0xdd2222); ballG.fillCircle(x, y, 10);
      ballG.fillStyle(0xffffff); ballG.fillRect(x - 10, y, 20, 10);
      ballG.lineStyle(2, 0x222222); ballG.strokeCircle(x, y, 10);
      ballG.fillStyle(0xffffff); ballG.fillCircle(x, y, 3);
    };
    drawBall(startX, startY);

    this.typeDialog(`${this.player.name.toUpperCase()} threw a Pokéball!`);

    // Throw tween
    this.tweens.add({
      targets: { t: 0 },
      t: 1,
      duration: 500,
      ease: 'Power1',
      onUpdate: (_, obj: { t: number }) => {
        const t = obj.t;
        const bx = startX + (endX - startX) * t;
        const by = startY + (endY - startY) * t - Math.sin(t * Math.PI) * 80;
        drawBall(bx, by);
      },
      onComplete: () => {
        // Wild Pokémon disappears
        this.wildSprite.setVisible(false);
        ballG.clear();
        drawBall(endX, endY);

        // Shake sequence
        this.doCatchShakes(endX, endY);
      },
    });
  }

  private doCatchShakes(bx: number, by: number) {
    const catchProb = Math.min(0.95,
      (this.wildCatchRate / 255) *
      ((3 * this.wild.maxHp - 2 * this.wild.hp) / (3 * this.wild.maxHp)),
    );
    const caught = Math.random() < catchProb;
    const shakes = caught ? 3 : Math.floor(Math.random() * 3);

    let s = 0;
    const doShake = () => {
      if (s >= shakes) {
        this.time.delayedCall(400, () => {
          if (caught) {
            this.onCaught(bx, by);
          } else {
            this.ballGraphic.clear();
            this.wildSprite.setVisible(true);
            this.typeDialog(`Oh no! ${this.wild.name.toUpperCase()} broke free!`, () => this.playerAction());
          }
        });
        return;
      }
      this.tweens.add({
        targets: { t: 0 }, t: 1, duration: 350,
        onUpdate: (_, obj: { t: number }) => {
          const angle = Math.sin(obj.t * Math.PI * 2) * 0.25;
          this.ballGraphic.clear();
          this.ballGraphic.fillStyle(0xdd2222);
          this.ballGraphic.fillCircle(bx + Math.sin(angle) * 8, by, 10);
          this.ballGraphic.fillStyle(0xffffff);
          this.ballGraphic.fillRect(bx + Math.sin(angle) * 8 - 10, by, 20, 10);
          this.ballGraphic.lineStyle(2, 0x222222);
          this.ballGraphic.strokeCircle(bx + Math.sin(angle) * 8, by, 10);
        },
        onComplete: () => { s++; this.time.delayedCall(200, doShake); },
      });
    };
    doShake();
  }

  private onCaught(bx: number, by: number) {
    // Sparkle effect
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const star = this.add.text(bx, by, '✨', { fontSize: '14px' }).setDepth(25);
      this.tweens.add({
        targets: star,
        x: bx + Math.cos(angle) * 40,
        y: by + Math.sin(angle) * 40,
        alpha: 0, duration: 800,
        onComplete: () => star.destroy(),
      });
    }
    this.ballGraphic.clear();

    // Add to party
    const entry: PartyEntry = {
      name:      this.wild.name,
      level:     this.wild.level,
      hp:        this.wild.hp,
      maxHp:     this.wild.maxHp,
      type1:     this.wild.data.type1,
      type2:     this.wild.data.type2,
      spriteKey: this.wild.data.id === 904 ? 'disguijar' : `wild-${this.registry.get('wildId')}`,
      spriteUrl: this.wild.data.spriteUrl,
      isCustom:  this.wild.data.id === 904,
      moves:     this.wild.moves.map(m => m.data.name),
    };

    const added = PartySystem.add(this.registry, entry);
    SaveManager.save(this.registry, this.px, this.py);

    this.typeDialog(
      added
        ? `✨ Gotcha! ${this.wild.name.toUpperCase()} was caught!\nAdded to your party!`
        : `${this.wild.name.toUpperCase()} was caught!\nParty full — stored in the box.`,
      () => this.returnToRoute(),
    );
  }

  // ── Turn logic ────────────────────────────────────────────────────────────

  private runTurn(playerMove: Move) {
    this.state = 'busy';
    this.player.useMove(playerMove);

    this.typeDialog(`${this.player.name.toUpperCase()} used ${playerMove.data.name}!`, () => {
      if (playerMove.data.power > 0) {
        const { dmg, critical, effectiveness } = this.wild.takeDamage(playerMove, this.player);
        this.animateHpBar('wild', () => {
          let msg = '';
          if (critical)             msg = 'A critical hit! ';
          if (effectiveness > 1)    msg += "Super effective!";
          if (effectiveness < 1 && effectiveness > 0) msg += "Not very effective...";
          if (effectiveness === 0)  msg = "It had no effect!";
          void dmg;

          const next = () => {
            if (this.wild.isKO) {
              this.typeDialog(`${this.wild.name.toUpperCase()} fainted!`, () => {
                const gained = this.wild.level * 15;  // 3× increase
                this.showExpAndLevelUp(gained, () => this.returnToRoute());
              });
              return;
            }
            this.enemyTurn(null);
          };
          if (msg) this.typeDialog(msg, next); else next();
        });
      } else {
        this.typeDialog(`${this.player.name.toUpperCase()} used ${playerMove.data.name}!`,
          () => this.enemyTurn(null));
      }
    });
  }

  private enemyTurn(_: null) {
    const available = this.wild.moves.filter(m => m.pp > 0);
    const move = available.length ? available[Math.floor(Math.random() * available.length)] : this.wild.moves[0];
    this.wild.useMove(move);

    this.typeDialog(`Wild ${this.wild.name.toUpperCase()} used ${move.data.name}!`, () => {
      if (move.data.power > 0) {
        this.player.takeDamage(move, this.wild);
        this.animateHpBar('player', () => {
          PartySystem.updateSlotHP(this.registry, this.activeSlot, this.player.hp);
          if (this.player.isKO) {
            this.typeDialog(`${this.player.name.toUpperCase()} fainted!`, () => {
              this.sendNextOrLose();
            });
          } else {
            this.playerAction();
          }
        });
      } else {
        this.playerAction();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private get px() { return (this.registry.get('routeReturnX') as number) ?? 0; }
  private get py() { return (this.registry.get('routeReturnY') as number) ?? 0; }

  private showActionPanel() { this.actionPanel.setVisible(true); this.movePanel.setVisible(false); this.bagPanel.setVisible(false); }
  private showMovePanel()   { this.movePanel.setVisible(true);   this.actionPanel.setVisible(false); this.bagPanel.setVisible(false); }
  private hideAllPanels()   { this.actionPanel.setVisible(false); this.movePanel.setVisible(false); this.bagPanel.setVisible(false); }

  private animateHpBar(who: 'player' | 'wild', onDone: () => void) {
    const mon   = who === 'player' ? this.player  : this.wild;
    const bar   = who === 'player' ? this.playerHpBar : this.wildHpBar;
    const label = who === 'player' ? this.playerHpText : this.wildHpText;
    const ratio = mon.hp / mon.maxHp;
    bar.fillColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddcc00 : 0xcc4444;
    this.tweens.add({
      targets: bar, width: Math.max(0, ratio * HP_W), duration: 450, ease: 'Linear',
      onComplete: () => { label.setText(`${mon.hp}/${mon.maxHp}`); onDone(); },
    });
  }

  protected showExpAndLevelUp(expGained: number, onDone: () => void) {
    // Restore EXP from registry
    this.player.exp = (this.registry.get('starterExp') as number) ?? 0;
    const levelsGained: number[] = [];
    let levelled = this.player.gainExp(expGained);
    while (levelled) {
      levelsGained.push(this.player.level);
      levelled = this.player.gainExp(0);  // check overflow
    }

    // Persist
    this.registry.set('starterLevel', this.player.level);
    this.registry.set('starterExp',   this.player.exp);
    PartySystem.updateSlotHP(this.registry, this.activeSlot, this.player.hp);

    // Show message
    const expMsg = `${this.player.name.toUpperCase()} gained ${expGained} EXP!`;
    if (levelsGained.length > 0) {
      const lv = levelsGained[levelsGained.length - 1];
      this.typeDialog(expMsg, () => {
        this.playerLvText.setText(`Lv.${lv}`);
        this.animateHpBar('player', () => {
          this.typeDialog(`✨ ${this.player.name.toUpperCase()} grew to Lv. ${lv}!\nMax HP: ${this.player.maxHp}`, onDone);
        });
      });
    } else {
      const needed = this.player.expToNextLevel() - this.player.exp;
      this.typeDialog(`${expMsg}  (${needed} to next level)`, onDone);
    }
  }

  // ── Party switching ───────────────────────────────────────────────────────

  private onSwitchPokemon() {
    if (this.state !== 'playerAction') return;
    this.hideAllPanels();
    openSwitchPanel(
      this,
      this.activeSlot,
      () => { this.showActionPanel(); this.typeDialog(`What will ${this.player.name.toUpperCase()} do?`); },
      (idx) => this.voluntarySwitch(idx),
    );
  }

  private voluntarySwitch(slotIdx: number) {
    this.state = 'busy';
    this.activeSlot = slotIdx;
    const party = PartySystem.get(this.registry);
    const entry = party[slotIdx];
    this.player = buildFromEntry(entry);

    this.playerLvText.setText(`Lv.${this.player.level}`);
    this.playerHpBar.fillColor = 0x44cc44;
    this.playerHpBar.width     = HP_W;
    this.playerHpText.setText(`${this.player.hp}/${this.player.maxHp}`);

    if (this.textures.exists(entry.spriteKey)) {
      this.playerSprite.setTexture(entry.spriteKey);
      const tex = this.textures.get(entry.spriteKey).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      this.playerSprite.setScale(140 / dim);
    }
    this.playerSprite.setAlpha(0);
    this.tweens.add({
      targets: this.playerSprite, alpha: 1, x: 180, y: 260, duration: 400,
      onComplete: () => {
        this.typeDialog(`Go, ${this.player.name.toUpperCase()}!`, () => {
          // Voluntary switch costs the turn — enemy attacks
          this.enemyTurn(null);
        });
      },
    });
  }

  private sendNextOrLose() {
    const party = PartySystem.get(this.registry);

    // Mark current slot fainted
    if (party[this.activeSlot]) {
      party[this.activeSlot].hp = 0;
      PartySystem.set(this.registry, party);
    }

    // Find next healthy Pokémon after the active slot
    const nextIdx = party.findIndex((e, i) => i !== this.activeSlot && e.hp > 0);

    if (nextIdx === -1) {
      // All Pokémon fainted → loss
      this.typeDialog('You have no more Pokémon!', () => {
        PartySystem.healAll(this.registry);
        this.registry.set('returnX', 10 * 32 + 16);
        this.registry.set('returnY', 35 * 32 + 16);
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start('WorldMapScene'));
      });
      return;
    }

    // Send in the next Pokémon
    this.activeSlot = nextIdx;
    const nextEntry = party[nextIdx];
    this.player = buildFromEntry(nextEntry);

    // Update HUD
    this.playerLvText.setText(`Lv.${this.player.level}`);
    this.playerHpBar.fillColor = 0x44cc44;
    this.playerHpBar.width     = HP_W;
    this.playerHpText.setText(`${this.player.hp}/${this.player.maxHp}`);

    // Swap sprite
    const key = nextEntry.spriteKey;
    if (this.textures.exists(key)) {
      this.playerSprite.setTexture(key);
      const tex2 = this.textures.get(key).getSourceImage();
      const dim2 = Math.max((tex2.width as number) || 1, (tex2.height as number) || 1);
      this.playerSprite.setScale(140 / dim2);
    }
    this.playerSprite.setAlpha(0);
    this.tweens.add({
      targets: this.playerSprite, alpha: 1, x: 180, y: 260, duration: 400, ease: 'Power2',
      onComplete: () => {
        this.typeDialog(`Go, ${this.player.name.toUpperCase()}!`, () => this.playerAction());
      },
    });
  }

  private returnToRoute() {
    SaveManager.save(this.registry, this.px, this.py);
    this.cameras.main.fadeOut(400, 255, 255, 255, () => this.scene.start('RouteScene'));
  }
}
