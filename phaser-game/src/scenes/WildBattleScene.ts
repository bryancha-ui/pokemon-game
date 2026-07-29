import Phaser from 'phaser';
import { pushBgm, popBgm } from '../systems/Music';
import { expMultiplierFor } from '../data/NorthernRegion';
import { deckShowMoves, deckHideMoves } from '../systems/TouchControls';
import { playMoveFX } from '../systems/BattleFX';
import { spriteScale } from '../data/SpriteScale';
import { runLevelUpLearning } from '../systems/MoveLearning';
import { Pokemon, Move } from '../battle/Pokemon';
import { STARTERS, TYPE_COLORS, findForm } from '../data/StarterData';
import { DISGUIJAR_DATA, DISGUIJAR_MOVES } from '../data/CustomPokemon';
import { customForm } from '../data/CustomBattle';
import { fetchPokemon, fetchMove } from '../data/PokeAPI';
import { PartySystem, PartyEntry } from '../systems/PartySystem';
import { blackoutToCenter, blackoutMessage } from '../systems/Blackout';
import { tr } from '../systems/i18n';
import { awardBenchExp } from '../systems/BattleExp';
import { buildFromEntry, persistMovePP } from '../systems/PartyBattle';
import { openSwitchPanel } from '../systems/SwitchPanel';
import { DexTracker } from '../systems/DexTracker';
import { ITEMS, Inventory, itemDef, useItemOnSlot } from '../systems/Items';
import { SaveManager } from '../utils/SaveManager';

type WildState = 'loading' | 'intro' | 'playerAction' | 'playerMove' | 'bag' | 'busy' | 'catching' | 'over';

const HP_W = 180;

export class WildBattleScene extends Phaser.Scene {
  private player!: Pokemon;
  private wild!: Pokemon;
  private wildCatchRate = 45;
  private ballRate = 1;
  private state: WildState = 'loading';

  // UI
  private dialogText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private wildHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private wildHpText!: Phaser.GameObjects.Text;
  private playerLvText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;
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
  private participants = new Set<number>([0]);   // all battlers share EXP

  constructor() { super('WildBattleScene'); }

  preload() {
    if (!this.textures.exists('disguijar'))
      this.load.image('disguijar', 'assets/disguijar.png');
    STARTERS.forEach(s => {
      if (!this.textures.exists(s.spriteKey))
        this.load.image(s.spriteKey, s.data.spriteUrl);
    });
    PartySystem.get(this.registry).forEach(e => {
      if (e.spriteKey && e.spriteUrl && !this.textures.exists(e.spriteKey))
        this.load.image(e.spriteKey, e.spriteUrl);
    });
  }

  async create() {
    this.cameras.main.fadeIn(300);
    Inventory.ensureInit(this.registry);   // sync legacy Pokéballs into the item system
    this.registry.set('wildOutcome', 'none');   // set to won/caught/fled on exit (callers may gate on it)

    // Battle theme: the roaming legendaries get their own encounter music; else the wild theme.
    const wid = String(this.registry.get('wildId') ?? '');
    const LEGEND: Record<string, string> = {
      nabihalmang: 'nabihalmang', hwanwoong: 'hwanung', cheonjisin: 'cheonji',
      poongbaek: 'poongbaek', woosa: 'woosa', woonsa: 'woonsa',
    };
    pushBgm(this, LEGEND[wid] ?? 'wild');
    this.events.once('shutdown', () => { popBgm(this); deckHideMoves(); });

    this.drawBackground();
    this.createDialogBox();
    this.typeDialog('Loading…');
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.aKey     = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);

    // M or B opens the menu (party + bag) without interrupting the battle
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M).on('down', () => this.scene.launch('MenuScene'));
    this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.B).on('down', () => this.scene.launch('MenuScene'));

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

    // Pokédex: mark this wild Pokémon as seen
    DexTracker.markSeen(this.registry, wildId);

    // Build wild Pokémon
    if (wildCustom && wildId === 'disguijar') {
      this.wild = new Pokemon(DISGUIJAR_DATA, wildLevel, DISGUIJAR_MOVES);
      if (!this.textures.exists('disguijar')) {
        this.load.image('disguijar', 'assets/disguijar.png');
        await new Promise<void>(r => { this.load.once('complete', r); this.load.start(); });
      }
    } else if (wildCustom && customForm(wildId as string)) {
      // Any other custom Pokédex Pokémon
      const cf = customForm(wildId as string)!;
      this.wild = new Pokemon(cf.data, wildLevel, cf.moves);
      if (!this.textures.exists(wildId as string)) {
        this.load.image(wildId as string, cf.data.spriteUrl);
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

    // Build player Pokémon from party slot 0 (party entry is the source of truth)
    PartySystem.syncSlot0FromStarter(this.registry);
    const party = PartySystem.get(this.registry);
    // Lead with the first NON-fainted Pokémon so a fainted lead never enters battle.
    this.activeSlot = Math.max(0, party.findIndex(e => e && e.hp > 0));
    if (party.length > 0) {
      this.player = buildFromEntry(party[this.activeSlot]);
      this.participants = new Set<number>([this.activeSlot]);
    } else {
      const starterKey   = (this.registry.get('starterKey')  as string) ?? 'vipour';
      const starterLevel = (this.registry.get('starterLevel') as number) ?? 5;
      const def = (findForm(starterKey)) ?? STARTERS[1];
      this.player = new Pokemon(def.data, starterLevel, def.startingMoves);
      this.player.exp = (this.registry.get('starterExp') as number) ?? 0;
    }
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x6688bb, 1); g.fillRect(0, 0, this.W, 300);
    g.fillStyle(0x4a7a3a, 1); g.fillRect(0, 200, this.W, this.H - 320);   // green field down to the dialog box (no black gap)
    g.fillStyle(0x8a9a6a, 1);
    g.fillTriangle(0, 200, 150, 80, 300, 200);
    g.fillTriangle(200, 200, 400, 60, 600, 200);
    g.fillStyle(0xb09060, 1); g.fillEllipse(180, 280, 160, 28);
    g.fillEllipse(580, 155, 120, 22);
    g.fillStyle(0x0d0d2e, 0.96); g.fillRect(0, this.H - 120, this.W, 120);
    g.lineStyle(2, 0x5577aa, 1); g.lineBetween(0, this.H - 120, this.W, this.H - 120);
    this.add.text(this.W / 2, this.H - 108, tr('▶ SPACE to advance  |  A to throw Pokéball'), {
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
    this.playerNameText = this.add.text(552, 292, this.player.name.toUpperCase(), { fontSize: '13px', color: '#fff', fontStyle: 'bold' });
    this.playerLvText = this.add.text(730, 292, `Lv.${this.player.level}`, { fontSize: '12px', color: '#ffe44e' }).setOrigin(1, 0);
    this.add.rectangle(660, 320, HP_W + 6, 10, 0x333355);
    this.playerHpBar  = this.add.rectangle(570, 320, HP_W, 8, 0x44cc44).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(552, 330, `${this.player.hp}/${this.player.maxHp}`, { fontSize: '10px', color: '#aaa' });
  }

  // ── Sprites ───────────────────────────────────────────────────────────────

  private createSprites() {
    const wildId = this.registry.get('wildId') as string | number;
    const wKey = this.wild.data.id === 904
      ? 'disguijar'
      : customForm(wildId as string)
        ? (wildId as string)               // custom Pokédex key
        : `wild-${wildId}`;                 // PokéAPI
    const pKey = PartySystem.get(this.registry)[this.activeSlot]?.spriteKey
               ?? (this.registry.get('starterKey') as string) ?? 'vipour';

    this.wildSprite   = this.add.image(900, 60, this.textures.exists(wKey) ? wKey : 'disguijar')
      .setDepth(5).setAlpha(0);
    this.playerSprite = this.add.image(-80, 320, pKey).setDepth(5).setFlipX(true).setAlpha(0);

    const fitImg = (img: Phaser.GameObjects.Image, size: number) => {
      const tex = this.textures.get(img.texture.key).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      img.setScale((size * spriteScale(img.texture.key)) / dim);
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
    text = tr(text);
    this.dialogText.setText('');
    let i = 0;
    const ev = this.time.addEvent({
      delay: 12, repeat: text.length - 1,   // faster typewriter for snappier battles
      callback: () => {
        this.dialogText.setText(text.slice(0, ++i));
        if (i >= text.length) {
          ev.destroy();
          if (onDone) this.time.delayedCall(280, onDone);
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
      const t = this.add.text(a.x, a.y, tr(a.label), { fontSize: '19px', color: '#fff' })
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
    this.bagPanel = this.add.container(0, this.H - 120).setDepth(10).setVisible(false);
    this.rebuildBagPanel();
  }

  /** Rebuild the in-battle bag from the current inventory (balls + heals). */
  private rebuildBagPanel() {
    this.bagPanel.removeAll(true);
    const bg = this.add.rectangle(this.W / 2 - 60, 60, this.W * 0.76, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    this.bagPanel.add(bg);
    this.bagPanel.add(this.add.text(this.W - 30, 10, '← BACK', { fontSize: '12px', color: '#aaa' })
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.playerAction()));

    // Show owned balls + healing/status items
    const inv = Inventory.all(this.registry);
    const usable = ITEMS.filter(it => (inv[it.key] ?? 0) > 0 &&
      (it.category === 'ball' || it.category === 'heal' || it.category === 'status' || it.category === 'revive'));

    const cols = [20, 250, 480, 710];
    usable.slice(0, 8).forEach((def, i) => {
      const x = cols[i % 4], y = 18 + Math.floor(i / 4) * 50;
      const r = this.add.rectangle(x + 100, y + 14, 210, 40, def.category === 'ball' ? 0x1a2a4a : 0x1a3a2a)
        .setStrokeStyle(1, 0x3a5a8a).setInteractive({ useHandCursor: true });
      this.bagPanel.add(r);
      this.bagPanel.add(this.add.text(x + 8, y + 4, `${def.icon} ${def.name}`, { fontSize: '13px', color: '#fff', fontStyle: 'bold' }));
      this.bagPanel.add(this.add.text(x + 8, y + 20, `×${inv[def.key]}`, { fontSize: '11px', color: '#ffe44e' }));
      r.on('pointerover', () => r.setFillStyle(def.category === 'ball' ? 0x2a4a7a : 0x2a5a3a));
      r.on('pointerout',  () => r.setFillStyle(def.category === 'ball' ? 0x1a2a4a : 0x1a3a2a));
      r.on('pointerdown', () => {
        if (def.category === 'ball') this.throwBall(def.key);
        else this.useHealItem(def.key);
      });
    });
  }

  private useHealItem(itemKey: string) {
    if (this.state !== 'bag') return;
    const wantFainted = itemDef(itemKey)?.category === 'revive';
    this.hideAllPanels();
    openSwitchPanel(
      this, this.activeSlot,
      () => this.onBag(),                                   // cancel → back to the bag
      (slot) => this.useItemOnTarget(itemKey, slot),
      true,
      (entry) => wantFainted ? entry.hp <= 0 : entry.hp > 0,
      wantFainted ? 'Revive which Pokémon?' : 'Use on which Pokémon?',
    );
  }

  private useItemOnTarget(itemKey: string, slot: number) {
    const r = useItemOnSlot(this.registry, itemKey, slot);
    if (!r.ok) { this.typeDialog(r.message, () => this.onBag()); return; }
    if (slot === this.activeSlot) {
      const e = PartySystem.get(this.registry)[this.activeSlot];
      if (e) this.player.hp = e.hp;
    }
    this.hideAllPanels();
    this.state = 'busy';
    const finish = () => this.typeDialog(r.message, () => this.enemyTurn(null));   // using an item costs the turn
    if (slot === this.activeSlot) this.animateHpBar('player', finish); else finish();
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
    this.refreshMovePanel();   // rebuild so PP counts reflect moves used this battle
    this.showMovePanel();
    this.typeDialog('Choose a move!');
  }

  private onBag() {
    if (this.state !== 'playerAction' && this.state !== 'bag') return;
    this.state = 'bag';
    this.rebuildBagPanel();
    this.hideAllPanels();
    this.bagPanel.setVisible(true);
    this.typeDialog('Choose an item!');
  }

  private onMoveSelected(move: Move) {
    if (this.state !== 'playerMove') return;
    if (move.pp <= 0) { this.typeDialog('No PP left!', () => this.onFight()); return; }
    deckHideMoves();
    this.hideAllPanels();
    this.runTurn(move);
  }

  private onRun() {
    if (this.state !== 'playerAction') return;
    // Run success check (simplified: 50% + speed advantage)
    const runChance = 0.5 + (this.player.spd - this.wild.spd) / 200;
    if (Math.random() < runChance) {
      this.registry.set('wildOutcome', 'fled');
      this.typeDialog('Got away safely!', () => this.returnToRoute());
    } else {
      this.typeDialog("Can't escape!", () => {
        this.enemyTurn(null);
      });
    }
  }

  // ── Pokéball throw ────────────────────────────────────────────────────────

  private throwBall(ballKey = 'pokeball') {
    if (this.state !== 'bag' && this.state !== 'playerAction') return;
    if (Inventory.count(this.registry, ballKey) <= 0) {
      this.typeDialog('You have none of that ball!', () => this.onBag());
      return;
    }
    Inventory.remove(this.registry, ballKey, 1);
    this.ballRate = itemDef(ballKey)?.ballRate ?? 1;
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
    const catchProb = this.ballRate >= 255 ? 1 : Math.min(0.99,
      (this.wildCatchRate / 255) *
      ((3 * this.wild.maxHp - 2 * this.wild.hp) / (3 * this.wild.maxHp)) *
      this.ballRate,
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
            // A failed catch costs your turn — the wild Pokémon now attacks.
            this.typeDialog(`Oh no! ${this.wild.name.toUpperCase()} broke free!`, () => this.enemyTurn(null));
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
    this.registry.set('wildOutcome', 'caught');
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
    const wildId  = this.registry.get('wildId') as string | number;
    const isCust  = !!customForm(wildId as string) || this.wild.data.id === 904;
    const sprKey  = this.wild.data.id === 904 ? 'disguijar'
                  : isCust ? (wildId as string)
                  : `wild-${wildId}`;
    const entry: PartyEntry = {
      name:      this.wild.name,
      level:     this.wild.level,
      hp:        this.wild.hp,
      maxHp:     this.wild.maxHp,
      type1:     this.wild.data.type1,
      type2:     this.wild.data.type2,
      spriteKey: sprKey,
      spriteUrl: this.wild.data.spriteUrl,
      isCustom:  isCust,
      moves:     this.wild.moves.map(m => m.data.name),
      exp:       0,
    };

    DexTracker.markCaught(this.registry, this.registry.get('wildId') as string | number);
    const name = this.wild.name.toUpperCase();
    const captureExp = Math.round(this.wild.level * 12 * expMultiplierFor(this.registry));   // capture rewards EXP to all battlers too (northern boost applies)
    const finish = () => this.showExpAndLevelUp(captureExp, () => this.returnToRoute());

    if (!PartySystem.isFull(this.registry)) {
      PartySystem.add(this.registry, entry);
      this.saveAfterCatch();
      this.typeDialog(`✨ Gotcha! ${name} was caught!\nAdded to your party!`, finish);
    } else {
      // Party is full — let the player swap a Pokémon in or send the new one to the PC.
      this.typeDialog(`✨ Gotcha! ${name} was caught!\nBut your party is full.`,
        () => this.promptFullParty(entry, finish));
    }
  }

  /** Save against the resumable scene the player came from (not the WorldMap default). */
  private saveAfterCatch() {
    const sc = (this.registry.get('lastScene') as string)
      ?? (this.registry.get('wildReturnScene') as string) ?? 'WorldMapScene';
    const sx = (this.registry.get('lastX') as number) ?? this.px;
    const sy = (this.registry.get('lastY') as number) ?? this.py;
    SaveManager.save(this.registry, sx, sy, sc);
  }

  /** Party-full choice: swap a party member (it goes to the PC) or box the newcomer. */
  private promptFullParty(entry: PartyEntry, onDone: () => void) {
    const cx = this.W / 2, cy = this.H / 2;
    const layer = this.add.container(0, 0).setDepth(60);
    layer.add(this.add.rectangle(cx, cy, this.W, this.H, 0x000000, 0.62));
    layer.add(this.add.rectangle(cx, cy, 500, 200, 0x10142a, 0.99).setStrokeStyle(2, 0x5577aa));
    layer.add(this.add.text(cx, cy - 58, tr('Your party is full!'), { fontSize: '18px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5));
    layer.add(this.add.text(cx, cy - 26, `Swap a Pokémon for ${entry.name.toUpperCase()}, or send it to the PC?`, { fontSize: '13px', color: '#cde' }).setOrigin(0.5));

    const btn = (x: number, label: string, bg: string, onClick: () => void) => {
      const b = this.add.text(x, cy + 42, label, { fontSize: '15px', color: '#fff', backgroundColor: bg, padding: { x: 14, y: 9 } })
        .setOrigin(0.5).setInteractive({ useHandCursor: true });
      b.on('pointerdown', onClick);
      layer.add(b);
    };
    btn(cx - 120, '↔  Swap a Pokémon', '#2a5a8a', () => { layer.destroy(true); this.swapForCaught(entry, onDone); });
    btn(cx + 120, '📦  Send to PC', '#3a6a3a', () => {
      layer.destroy(true);
      PartySystem.boxAdd(this.registry, entry);
      this.saveAfterCatch();
      this.typeDialog(`${entry.name.toUpperCase()} was sent to the PC.`, onDone);
    });
  }

  /** Pick a party member to send to the PC; the caught Pokémon takes its place. */
  private swapForCaught(entry: PartyEntry, onDone: () => void) {
    openSwitchPanel(
      this, -1,
      () => this.promptFullParty(entry, onDone),   // cancel → back to the choice
      (idx) => {
        const party = PartySystem.get(this.registry);
        const out = party[idx];
        party[idx] = entry;
        PartySystem.set(this.registry, party);
        // If the newcomer took the lead slot, re-point the legacy starter mirror at it,
        // otherwise the old lead's level (in starterLevel) gets forced back onto it.
        if (idx === 0) PartySystem.syncStarterFromLead(this.registry);
        PartySystem.boxAdd(this.registry, out);
        this.saveAfterCatch();
        this.typeDialog(`${entry.name.toUpperCase()} joined the party!\n${out.name.toUpperCase()} was sent to the PC.`, onDone);
      },
      true,          // allow cancel
      () => true,    // any of the 6 can be sent out
      'Send which Pokémon to the PC?',
    );
  }

  // ── Turn logic ────────────────────────────────────────────────────────────

  private runTurn(playerMove: Move) {
    this.state = 'busy';
    // Turn order by Speed (ties broken randomly).
    const playerFirst = this.player.spd > this.wild.spd
      || (this.player.spd === this.wild.spd && Math.random() < 0.5);
    if (playerFirst) {
      this.doPlayerMove(playerMove, () => this.doWildMove(() => this.playerAction()));
    } else {
      this.doWildMove(() => this.doPlayerMove(playerMove, () => this.playerAction()));
    }
  }

  private doPlayerMove(playerMove: Move, onDone: () => void) {
    this.player.useMove(playerMove);
    persistMovePP(this.registry, this.activeSlot, this.player);   // remember PP spent this battle
    this.typeDialog(`${this.player.name.toUpperCase()} used ${playerMove.data.name}!`, () => {
      if (playerMove.data.power <= 0) { onDone(); return; }
      const { critical, effectiveness } = this.wild.takeDamage(playerMove, this.player);
      playMoveFX(this, this.playerSprite, this.wildSprite, playerMove.data, effectiveness, () => {});
      this.animateHpBar('wild', () => {
        let msg = '';
        if (critical)             msg = 'A critical hit! ';
        if (effectiveness > 1)    msg += 'Super effective!';
        if (effectiveness < 1 && effectiveness > 0) msg += 'Not very effective...';
        if (effectiveness === 0)  msg = 'It had no effect!';
        const after = () => {
          if (this.wild.isKO) {
            this.typeDialog(`${this.wild.name.toUpperCase()} fainted!`, () => {
              this.registry.set('wildOutcome', 'won');
              const gained = Math.round(this.wild.level * 15 * expMultiplierFor(this.registry));
              this.showExpAndLevelUp(gained, () => this.returnToRoute());
            });
            return;
          }
          onDone();
        };
        if (msg) this.typeDialog(msg, after); else after();
      });
    });
  }

  /** The wild Pokémon attacks (also used standalone after item use / a failed run). */
  private enemyTurn(_: null) { void _; this.doWildMove(() => this.playerAction()); }

  private doWildMove(onDone: () => void) {
    const available = this.wild.moves.filter(m => m.pp > 0);
    const move = available.length ? available[Math.floor(Math.random() * available.length)] : this.wild.moves[0];
    this.wild.useMove(move);

    this.typeDialog(`Wild ${this.wild.name.toUpperCase()} used ${move.data.name}!`, () => {
      if (move.data.power > 0) {
        const { effectiveness } = this.player.takeDamage(move, this.wild);
        playMoveFX(this, this.wildSprite, this.playerSprite, move.data, effectiveness, () => {});
        this.animateHpBar('player', () => {
          PartySystem.updateSlotHP(this.registry, this.activeSlot, this.player.hp);
          if (this.player.isKO) {
            this.typeDialog(`${this.player.name.toUpperCase()} fainted!`, () => this.sendNextOrLose());
          } else {
            onDone();
          }
        });
      } else {
        onDone();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private get px() { return (this.registry.get('routeReturnX') as number) ?? 0; }
  private get py() { return (this.registry.get('routeReturnY') as number) ?? 0; }

  private showActionPanel() { deckHideMoves(); this.actionPanel.setVisible(true); this.movePanel.setVisible(false); this.bagPanel.setVisible(false); }
  private showMovePanel()   { const onDeck = deckShowMoves(this.player.moves, i => this.onMoveSelected(this.player.moves[i]), () => this.playerAction()); this.movePanel.setVisible(!onDeck); this.actionPanel.setVisible(false); this.bagPanel.setVisible(false); }
  private hideAllPanels()   { this.actionPanel.setVisible(false); this.movePanel.setVisible(false); this.bagPanel.setVisible(false); }
  private refreshMovePanel() { this.movePanel.destroy(true); this.createMovePanel(); this.movePanel.setVisible(false); }

  private animateHpBar(who: 'player' | 'wild', onDone: () => void) {
    const mon   = who === 'player' ? this.player  : this.wild;
    const bar   = who === 'player' ? this.playerHpBar : this.wildHpBar;
    const label = who === 'player' ? this.playerHpText : this.wildHpText;
    const ratio = mon.hp / mon.maxHp;
    bar.fillColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddcc00 : 0xcc4444;
    this.tweens.add({
      targets: bar, width: Math.max(0, ratio * HP_W), duration: 260, ease: 'Linear',
      onComplete: () => { label.setText(`${mon.hp}/${mon.maxHp}`); onDone(); },
    });
  }

  protected showExpAndLevelUp(expGained: number, onDone: () => void) {
    // this.player.exp already carries the active Pokémon's EXP (from buildFromEntry)
    const levelsGained: number[] = [];
    let levelled = this.player.gainExp(expGained);
    while (levelled) {
      levelsGained.push(this.player.level);
      levelled = this.player.gainExp(0);  // check overflow
    }

    // Persist level + exp + hp to the active party slot (source of truth)
    PartySystem.updateSlotProgress(
      this.registry, this.activeSlot,
      this.player.level, this.player.exp, this.player.hp, this.player.maxHp,
    );

    // Every other Pokémon that participated also gains EXP.
    const benchLines = awardBenchExp(this.registry, this.participants, this.activeSlot, expGained);
    const after = () => this.playBenchLines(benchLines, onDone);

    // Show message
    const expMsg = `${this.player.name.toUpperCase()} gained ${expGained} EXP!`;
    if (levelsGained.length > 0) {
      const lv = levelsGained[levelsGained.length - 1];
      this.typeDialog(expMsg, () => {
        this.playerLvText.setText(`Lv.${lv}`);
        this.animateHpBar('player', () => {
          this.typeDialog(`✨ ${this.player.name.toUpperCase()} grew to Lv. ${lv}!\nMax HP: ${this.player.maxHp}`, () => {
            runLevelUpLearning(this, this.activeSlot, this.player, levelsGained[0] - 1, this.player.level,
              (t, cb) => this.typeDialog(t, cb), after);
          });
        });
      });
    } else {
      const needed = this.player.expToNextLevel() - this.player.exp;
      this.typeDialog(`${expMsg}  (${needed} to next level)`, after);
    }
  }

  private playBenchLines(lines: string[], onDone: () => void) {
    if (lines.length === 0) { onDone(); return; }
    this.typeDialog(lines[0], () => this.playBenchLines(lines.slice(1), onDone));
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
    this.participants.add(slotIdx);
    const party = PartySystem.get(this.registry);
    const entry = party[slotIdx];
    this.player = buildFromEntry(entry);
    this.refreshMovePanel();

    this.playerNameText.setText(this.player.name.toUpperCase());
    this.playerLvText.setText(`Lv.${this.player.level}`);
    this.playerHpBar.fillColor = 0x44cc44;
    this.playerHpBar.width     = HP_W;
    this.playerHpText.setText(`${this.player.hp}/${this.player.maxHp}`);

    if (this.textures.exists(entry.spriteKey)) {
      this.playerSprite.setTexture(entry.spriteKey);
      const tex = this.textures.get(entry.spriteKey).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      this.playerSprite.setScale((140 * spriteScale(entry.spriteKey)) / dim);
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

    // All Pokémon fainted → whiteout to the nearest Pokémon Center.
    if (!party.some((e, i) => i !== this.activeSlot && e.hp > 0)) {
      this.typeDialog('You have no more Pokémon!', () => {
        this.typeDialog(blackoutMessage(this.registry), () => blackoutToCenter(this));
      });
      return;
    }

    // Let the player choose the next Pokémon (forced switch — no cancel).
    this.state = 'busy';
    this.hideAllPanels();
    this.typeDialog('Choose your next Pokémon!');
    openSwitchPanel(this, this.activeSlot, () => {}, (idx) => this.sendInChosen(idx), false);
  }

  private sendInChosen(nextIdx: number) {
    this.state = 'busy';
    this.activeSlot = nextIdx;
    this.participants.add(nextIdx);
    const nextEntry = PartySystem.get(this.registry)[nextIdx];
    this.player = buildFromEntry(nextEntry);
    this.refreshMovePanel();

    // Update HUD
    this.playerNameText.setText(this.player.name.toUpperCase());
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
      this.playerSprite.setScale((140 * spriteScale(key)) / dim2);
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
    const back = (this.registry.get('wildReturnScene') as string) ?? 'RouteScene';
    SaveManager.save(this.registry, this.px, this.py, back);
    this.cameras.main.fadeOut(400, 255, 255, 255, () => this.scene.start(back));
  }
}
