import Phaser from 'phaser';
import { Pokemon, Move } from '../battle/Pokemon';
import { STARTERS, TYPE_COLORS } from '../data/StarterData';
import { SaveManager } from '../utils/SaveManager';
import { PartySystem } from '../systems/PartySystem';
import { buildFromEntry } from '../systems/PartyBattle';
import { openSwitchPanel } from '../systems/SwitchPanel';

type BattleState = 'intro' | 'playerAction' | 'playerMove' | 'busy' | 'levelUp' | 'over';

export class RivalBattleScene extends Phaser.Scene {
  private player!: Pokemon;
  private rival!: Pokemon;
  private state: BattleState = 'intro';

  // UI
  private dialogText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private rivalHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private rivalHpText!: Phaser.GameObjects.Text;
  private playerLvText!: Phaser.GameObjects.Text;
  private rivalLvText!: Phaser.GameObjects.Text;
  private playerSprite!: Phaser.GameObjects.Image;
  private rivalSprite!: Phaser.GameObjects.Image;
  private actionPanel!: Phaser.GameObjects.Container;
  private movePanel!: Phaser.GameObjects.Container;
  private moveBtns: Phaser.GameObjects.Text[] = [];
  private spaceKey!: Phaser.Input.Keyboard.Key;
  // All battle-visible elements hidden until after the intro dialogue
  private hudGroup: Phaser.GameObjects.GameObject[] = [];

  private W = 1280;
  private H = 720;
  private readonly HP_BAR_W = 200;
  private activeSlot = 0;

  constructor() { super('RivalBattleScene'); }

  preload() {
    STARTERS.forEach(s => {
      if (!this.textures.exists(s.spriteKey))
        this.load.image(s.spriteKey, s.data.spriteUrl);
    });
  }

  create() {
    this.cameras.main.fadeIn(400);
    this.buildPokemon();
    this.drawBackground();
    this.createHUDs();
    this.createSprites();
    this.createDialogBox();
    this.createActionPanel();
    this.createMovePanel();
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.hideAllPanels();
    this.startIntro();
  }

  // ── Pokémon construction ──────────────────────────────────────────────────

  private buildPokemon() {
    const starterKey   = (this.registry.get('starterKey')   as string) ?? 'vipour';
    const starterLevel = (this.registry.get('starterLevel') as number) ?? 5;
    const rivalKey     = (this.registry.get('rivalKey')     as string) ?? 'onnurian';

    const playerDef = STARTERS.find(s => s.spriteKey === starterKey) ?? STARTERS[1];
    const rivalDef  = STARTERS.find(s => s.spriteKey === rivalKey)   ?? STARTERS[2];

    this.player = new Pokemon(playerDef.data, starterLevel, playerDef.startingMoves);
    this.player.exp = (this.registry.get('starterExp') as number) ?? 0;
    // First rival encounter: rival only knows Tackle to keep it fair
    this.rival  = new Pokemon(rivalDef.data, starterLevel, [rivalDef.startingMoves[0]]);
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground() {
    const g = this.add.graphics();
    // Sky gradient simulation
    g.fillStyle(0x87ceeb, 1); g.fillRect(0, 0, this.W, this.H * 0.55);
    // Distant hills
    g.fillStyle(0x7aaa55, 1);
    g.fillTriangle(0, 200, 120, 100, 240, 200);
    g.fillTriangle(160, 210, 320, 80, 480, 210);
    g.fillTriangle(380, 205, 560, 70, 740, 205);
    // Ground
    g.fillStyle(0x5a9a3a, 1); g.fillRect(0, 195, this.W, 110);
    // Dirt patch (player side)
    g.fillStyle(0xc8a870, 1); g.fillEllipse(220, 280, 160, 30);
    // Dirt patch (rival side)
    g.fillEllipse(580, 155, 130, 22);
    // Road between them
    g.fillStyle(0x888866, 0.4); g.fillRect(0, 295, this.W, 8);
    // Dialog box bg
    g.fillStyle(0x0d0d2e, 0.95); g.fillRect(0, this.H - 120, this.W, 120);
    g.lineStyle(2, 0x5577aa, 1); g.lineBetween(0, this.H - 120, this.W, this.H - 120);
  }

  // ── HUDs ──────────────────────────────────────────────────────────────────

  private createHUDs() {
    const track = <T extends Phaser.GameObjects.GameObject>(o: T): T => {
      this.hudGroup.push(o);
      (o as unknown as { setAlpha(n: number): void }).setAlpha(0);
      return o;
    };

    // Rival HUD — top left
    track(this.add.rectangle(130, 52, 248, 68, 0x0d0d2e, 0.9).setStrokeStyle(1, 0x5577aa));
    track(this.add.text(14, 24, `${this.rival.name.toUpperCase()}`, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }));
    this.rivalLvText = track(this.add.text(200, 24, `Lv.${this.rival.level}`, { fontSize: '13px', color: '#ffe44e' }));
    track(this.add.rectangle(130, 52, this.HP_BAR_W + 8, 12, 0x333355));
    this.rivalHpBar  = track(this.add.rectangle(30, 52, this.HP_BAR_W, 10, 0x44cc44).setOrigin(0, 0.5));
    this.rivalHpText = track(this.add.text(14, 62, `${this.rival.hp}/${this.rival.maxHp}`, { fontSize: '11px', color: '#aaa' }));

    // Player HUD — bottom right
    track(this.add.rectangle(670, 330, 248, 68, 0x0d0d2e, 0.9).setStrokeStyle(1, 0x5577aa));
    track(this.add.text(550, 302, `${this.player.name.toUpperCase()}`, { fontSize: '14px', color: '#fff', fontStyle: 'bold' }));
    this.playerLvText = track(this.add.text(730, 302, `Lv.${this.player.level}`, { fontSize: '13px', color: '#ffe44e' }).setOrigin(1, 0));
    track(this.add.rectangle(670, 330, this.HP_BAR_W + 8, 12, 0x333355));
    this.playerHpBar  = track(this.add.rectangle(570, 330, this.HP_BAR_W, 10, 0x44cc44).setOrigin(0, 0.5));
    this.playerHpText = track(this.add.text(550, 340, `${this.player.hp}/${this.player.maxHp}`, { fontSize: '11px', color: '#aaa' }));

    // Type badges
    this.drawTypeBadges(14, 76, this.player);
    this.drawTypeBadges(14, 76 - 280, this.rival);
  }

  private drawTypeBadges(x: number, _y: number, pokemon: Pokemon) {
    const types = [pokemon.data.type1, pokemon.data.type2].filter(Boolean) as string[];
    const baseY = pokemon === this.player ? 345 : 65;
    types.forEach((t, i) => {
      const bx = x + i * 65;
      this.hudGroup.push(
        this.add.rectangle(bx + 26, baseY, 52, 14, TYPE_COLORS[t] ?? 0x888888).setStrokeStyle(1, 0x000000, 0.3).setAlpha(0),
        this.add.text(bx + 26, baseY, t.toUpperCase(), { fontSize: '8px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0),
      );
    });
  }

  // ── Sprites ───────────────────────────────────────────────────────────────

  private createSprites() {
    const rKey = (this.registry.get('rivalKey') as string) ?? 'onnurian';
    const pKey = (this.registry.get('starterKey') as string) ?? 'vipour';

    // Start off-screen: rival enters from top-right, player from bottom-left
    this.rivalSprite  = this.add.image(960, 60,  rKey).setDepth(5).setAlpha(0);
    this.playerSprite = this.add.image(-80, 320,  pKey).setDepth(5).setFlipX(true).setAlpha(0);
    this.fitSprite(this.rivalSprite, 130);
    this.fitSprite(this.playerSprite, 150);
  }

  private fitSprite(img: Phaser.GameObjects.Image, targetSize: number) {
    const tex = this.textures.get(img.texture.key).getSourceImage();
    const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
    img.setScale(targetSize / dim);
  }

  // ── Dialog ────────────────────────────────────────────────────────────────

  private createDialogBox() {
    this.dialogText = this.add.text(16, this.H - 112, '', {
      fontSize: '16px', color: '#ffffff', wordWrap: { width: this.W * 0.6 - 32 }, lineSpacing: 5,
    }).setDepth(10);
  }

  private typeDialog(text: string, onDone?: () => void) {
    this.dialogText.setText('');
    let i = 0;
    const ev = this.time.addEvent({
      delay: 28, repeat: text.length - 1,
      callback: () => {
        this.dialogText.setText(text.slice(0, ++i));
        if (i >= text.length) {
          ev.destroy();
          if (onDone) this.time.delayedCall(700, onDone);
        }
      },
    });
  }

  // ── Action panel ──────────────────────────────────────────────────────────

  private createActionPanel() {
    this.actionPanel = this.add.container(this.W * 0.62, this.H - 120).setDepth(10);
    const bg = this.add.rectangle(76, 60, 296, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    this.actionPanel.add(bg);

    const actions = [
      { label: 'FIGHT',      x: 20,  y: 18, cb: () => this.onFight() },
      { label: "CAN'T RUN",  x: 155, y: 18, cb: () => {
        this.typeDialog("You can't run from a trainer battle!", () => this.playerAction());
      }},
      { label: 'BAG', x: 20, y: 72, cb: () => {
        this.typeDialog('Minhyuk: No items in a fair fight!', () => this.playerAction());
      }},
      { label: 'POKÉMON',    x: 155, y: 72, cb: () => this.onSwitchPokemon() },
    ];

    for (const a of actions) {
      const t = this.add.text(a.x, a.y, a.label, {
        fontSize: '20px',
        color: a.label === "CAN'T RUN" ? '#666688' : '#ffffff',
      }).setInteractive({ useHandCursor: a.label !== "CAN'T RUN" })
        .on('pointerover',  () => { if (a.label !== "CAN'T RUN") t.setColor('#ffff00'); })
        .on('pointerout',   () => { if (a.label !== "CAN'T RUN") t.setColor('#ffffff'); })
        .on('pointerdown',  a.cb);
      this.actionPanel.add(t);
    }
  }

  // ── Move panel ────────────────────────────────────────────────────────────

  private createMovePanel() {
    this.movePanel = this.add.container(0, this.H - 120).setDepth(10).setVisible(false);
    const bg = this.add.rectangle(this.W / 2 - 80, 60, this.W * 0.78, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    this.movePanel.add(bg);

    const back = this.add.text(this.W - 36, 12, '← BACK', { fontSize: '13px', color: '#aaa' })
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.state = 'playerAction'; this.showActionPanel(); });
    this.movePanel.add(back);

    this.moveBtns = [];
    const cols = [16, 210, 404, 598];
    this.player.moves.forEach((move, i) => {
      const x = cols[i] ?? cols[3];
      const typeColor = TYPE_COLORS[move.data.type] ?? 0x888888;

      // Type pill bg
      const pill = this.add.rectangle(x + 80, 28, 158, 52, typeColor, 0.25)
        .setStrokeStyle(1, typeColor, 0.8).setOrigin(0.5);
      this.movePanel.add(pill);

      const btn = this.add.text(x + 6, 10, move.data.name.toUpperCase(), {
        fontSize: '15px', color: '#fff', fontStyle: 'bold',
      }).setInteractive({ useHandCursor: true })
        .on('pointerover',  () => btn.setColor('#ffe44e'))
        .on('pointerout',   () => btn.setColor('#ffffff'))
        .on('pointerdown',  () => this.onMoveSelected(move));
      this.movePanel.add(btn);

      const ppTxt = this.add.text(x + 6, 32, `PP ${move.pp}/${move.data.pp}`, { fontSize: '11px', color: '#cccccc' });
      const typeTxt = this.add.text(x + 6, 48, move.data.type.toUpperCase(), { fontSize: '10px', color: '#aaaaaa' });
      this.movePanel.add([ppTxt, typeTxt]);
      this.moveBtns.push(btn);
    });
  }

  // ── Battle flow ───────────────────────────────────────────────────────────

  private startIntro() {
    const sName = this.player.name;
    const rName = this.rival.name;   // dynamic — matches actual rival Pokémon
    // Phase 1 — pre-battle dialogue, no Pokémon visible yet
    this.typeDialog(`Minhyuk: Hey! Stop right there.`, () => {
      this.typeDialog(`Minhyuk: You think you can just leave town with ${sName}?`, () => {
        this.typeDialog(`Minhyuk: I chose ${rName}.\nWe have both been waiting for this.`, () => {
          this.typeDialog(`Minhyuk: We battle. Right here, right now!`, () => {
            // Phase 2 — battle begins: reveal Pokémon and HUDs
            this.revealBattle();
          });
        });
      });
    });
  }

  private revealBattle() {
    // Rival Pokémon slides in from top-right
    this.rivalSprite.setAlpha(1);
    this.tweens.add({
      targets: this.rivalSprite,
      x: 580, y: 130,
      duration: 500, ease: 'Power2',
      onComplete: () => {
        this.typeDialog(`Minhyuk sent out ${this.rival.name}!`, () => {
          // Player Pokémon slides in from bottom-left
          this.playerSprite.setAlpha(1);
          this.tweens.add({
            targets: this.playerSprite,
            x: 200, y: 258,
            duration: 500, ease: 'Power2',
            onComplete: () => {
              // Fade in HUDs
              this.tweens.add({
                targets: this.hudGroup,
                alpha: 1,
                duration: 350,
                onComplete: () => {
                  this.typeDialog(`Go! ${this.player.name}!`, () => this.playerAction());
                },
              });
            },
          });
        });
      },
    });
  }

  private playerAction() {
    this.state = 'playerAction';
    this.typeDialog('What will you do?');
    this.showActionPanel();
  }

  private onFight() {
    if (this.state !== 'playerAction') return;
    this.state = 'playerMove';
    this.refreshMovePP();
    this.showMovePanel();
    this.typeDialog('Choose a move!');
  }

  private onMoveSelected(move: Move) {
    if (this.state !== 'playerMove') return;
    if (move.pp <= 0) { this.typeDialog('No PP left!', () => this.onFight()); return; }
    this.hideAllPanels();
    this.runTurn(move);
  }

  private runTurn(playerMove: Move) {
    this.state = 'busy';
    this.player.useMove(playerMove);

    // Player attacks first (simplified — speed comparison could be added later)
    this.typeDialog(`${this.player.name} used ${playerMove.data.name}!`, () => {
      if (playerMove.data.power > 0) {
        const { dmg, critical, effectiveness } = this.rival.takeDamage(playerMove, this.player);
        let msg = '';
        if (critical)          msg += "A critical hit!  ";
        if (effectiveness > 1) msg += "It's super effective!";
        if (effectiveness < 1 && effectiveness > 0) msg += "It's not very effective...";
        if (effectiveness === 0) msg += "It had no effect!";

        this.animateHpBar('rival', () => {
          if (msg) {
            this.typeDialog(msg, () => this.afterPlayerAttack(dmg));
          } else {
            this.afterPlayerAttack(dmg);
          }
        });
      } else {
        // Status move
        this.typeDialog(`${this.player.name} used ${playerMove.data.name}!`, () => this.afterPlayerAttack(0));
      }
    });
  }

  private afterPlayerAttack(_dmg: number) {
    if (this.rival.isKO) {
      this.typeDialog(`${this.rival.name} fainted!`, () => this.handleWin());
      return;
    }
    // Rival attacks back — pick random move with PP
    const availableMoves = this.rival.moves.filter(m => m.pp > 0);
    const rivalMove = availableMoves.length > 0
      ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
      : this.rival.moves[0];

    this.rival.useMove(rivalMove);
    this.typeDialog(`Minhyuk's ${this.rival.name} used ${rivalMove.data.name}!`, () => {
      if (rivalMove.data.power > 0) {
        this.player.takeDamage(rivalMove, this.rival);
        this.animateHpBar('player', () => {
          if (this.player.isKO) {
            this.typeDialog(`${this.player.name} fainted...`, () => this.rivalSendNextOrLose());
          } else {
            this.playerAction();
          }
        });
      } else {
        this.playerAction();
      }
    });
  }

  // ── Party switching ───────────────────────────────────────────────────────

  private onSwitchPokemon() {
    if (this.state !== 'playerAction') return;
    this.hideAllPanels();
    openSwitchPanel(
      this, this.activeSlot,
      () => { this.showActionPanel(); this.typeDialog(`What will ${this.player.name} do?`); },
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
    this.animateHpBar('player', () => {});

    if (this.textures.exists(entry.spriteKey)) {
      this.playerSprite.setTexture(entry.spriteKey);
      this.fitSprite(this.playerSprite, 150);
    }
    this.playerSprite.setAlpha(0);
    this.tweens.add({
      targets: this.playerSprite, alpha: 1, x: 200, y: 258, duration: 400,
      onComplete: () => {
        // Voluntary switch costs the turn — rival gets to attack
        this.typeDialog(`Go, ${this.player.name}!`, () => this.afterPlayerAttack(0));
      },
    });
  }

  private rivalSendNextOrLose() {
    const party = PartySystem.get(this.registry);
    if (party[this.activeSlot]) { party[this.activeSlot].hp = 0; PartySystem.set(this.registry, party); }

    const nextIdx = party.findIndex((e, i) => i !== this.activeSlot && e.hp > 0);
    if (nextIdx === -1) { this.handleLoss(); return; }

    this.activeSlot = nextIdx;
    const entry = party[nextIdx];
    this.player = buildFromEntry(entry);
    this.playerLvText.setText(`Lv.${this.player.level}`);
    this.animateHpBar('player', () => {});

    const key = entry.spriteKey;
    if (this.textures.exists(key)) {
      this.playerSprite.setTexture(key);
      this.fitSprite(this.playerSprite, 150);
    }
    this.playerSprite.setAlpha(0);
    this.tweens.add({
      targets: this.playerSprite, alpha: 1, x: 200, y: 258, duration: 400,
      onComplete: () => {
        this.typeDialog(`Go, ${this.player.name}!`, () => this.playerAction());
      },
    });
  }

  // ── Win / Loss ────────────────────────────────────────────────────────────

  private handleWin() {
    this.state = 'over';
    this.hideAllPanels();
    this.registry.set('rivalBattleDone', true);

    const expGained  = this.rival.level * 25;  // generous: ensures level-up at level 5
    const levelledUp = this.player.gainExp(expGained);
    this.registry.set('starterLevel', this.player.level);
    this.registry.set('starterExp',   this.player.exp);
    PartySystem.updateSlotHP(this.registry, this.activeSlot, this.player.hp);

    let text = `Minhyuk: Tch. You got me this time.\n${this.player.name} gained ${expGained} EXP!`;
    if (levelledUp) {
      this.playerLvText.setText(`Lv.${this.player.level}`);
      text += `\n✨ ${this.player.name} grew to Lv. ${this.player.level}!`;
    }
    text += '\nReturning to Waterfall City...';

    this.dialogText.setText(text);

    const px = 22 * 32 + 16, py = 50 * 32 + 16;
    this.registry.set('returnX', px);
    this.registry.set('returnY', py);
    SaveManager.save(this.registry, px, py);

    this.time.delayedCall(3000, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0, () => {
        this.scene.start('WorldMapScene');
      });
    });
  }

  private handleLoss() {
    this.state = 'over';
    this.hideAllPanels();

    this.dialogText.setText(
      "You lost...\nMinhyuk: Don't give up. Come back stronger!\nMom healed your Pokémon at home.",
    );

    this.registry.set('playerHealed', true);
    this.registry.set('rivalBattleDone', false);
    PartySystem.healAll(this.registry);

    // Return to home — safely above the rival trigger zone (row 46)
    // so checkTownExit() won't immediately re-trigger the rival cutscene
    this.registry.set('returnX', 10 * 32 + 16);   // inside player's home door
    this.registry.set('returnY', 36 * 32 + 16);

    this.time.delayedCall(3000, () => {
      this.cameras.main.fadeOut(600, 0, 0, 0, () => {
        this.scene.start('WorldMapScene');
      });
    });
  }

  // ── UI helpers ────────────────────────────────────────────────────────────

  private showActionPanel() { this.actionPanel.setVisible(true); this.movePanel.setVisible(false); }
  private showMovePanel()   { this.movePanel.setVisible(true);   this.actionPanel.setVisible(false); }
  private hideAllPanels()   { this.actionPanel.setVisible(false); this.movePanel.setVisible(false); }

  private refreshMovePP() {
    this.player.moves.forEach((move, i) => {
      const ppTxt = this.movePanel.list.find(
        (o, idx) => idx > 0 && o instanceof Phaser.GameObjects.Text &&
          (o as Phaser.GameObjects.Text).text.startsWith('PP') &&
          Math.floor((idx - 1) / 4) === i
      ) as Phaser.GameObjects.Text | undefined;
      if (ppTxt) ppTxt.setText(`PP ${move.pp}/${move.data.pp}`);
    });
  }

  private animateHpBar(who: 'player' | 'rival', onDone: () => void) {
    const pokemon = who === 'player' ? this.player : this.rival;
    const bar     = who === 'player' ? this.playerHpBar : this.rivalHpBar;
    const hpText  = who === 'player' ? this.playerHpText : this.rivalHpText;
    const ratio   = pokemon.hp / pokemon.maxHp;

    bar.fillColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddcc00 : 0xcc4444;
    this.tweens.add({
      targets: bar,
      width: Math.max(0, ratio * this.HP_BAR_W),
      duration: 500,
      ease: 'Linear',
      onComplete: () => {
        hpText.setText(`${pokemon.hp}/${pokemon.maxHp}`);
        onDone();
      },
    });
  }
}
