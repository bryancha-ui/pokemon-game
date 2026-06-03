import Phaser from 'phaser';
import { Pokemon, Move } from '../battle/Pokemon';
import { STARTERS, TYPE_COLORS } from '../data/StarterData';
import { fetchPokemon, fetchMove } from '../data/PokeAPI';
import { PartySystem } from '../systems/PartySystem';
import { buildFromEntry } from '../systems/PartyBattle';
import { openSwitchPanel } from '../systems/SwitchPanel';
import { SaveManager } from '../utils/SaveManager';

type State = 'loading' | 'intro' | 'playerAction' | 'playerMove' | 'busy' | 'over';
const HP_W = 180;

export class TrainerBattleScene extends Phaser.Scene {
  private player!: Pokemon;
  private enemy!: Pokemon;
  private trainerName   = 'Trainer';
  private trainerKey    = '';
  private activeSlot    = 0;
  private _returnScene  = 'RouteScene';  // filled from registry in create()
  private enemyQueue: { id: number; level: number }[] = [];
  private enemyIdx = 0;
  private totalExp = 0;
  private state: State = 'loading';

  private dialogText!: Phaser.GameObjects.Text;
  private playerHpBar!: Phaser.GameObjects.Rectangle;
  private enemyHpBar!: Phaser.GameObjects.Rectangle;
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private playerLvText!: Phaser.GameObjects.Text;
  private enemyLvText!: Phaser.GameObjects.Text;
  private enemySprite!: Phaser.GameObjects.Image;
  private playerSprite!: Phaser.GameObjects.Image;
  private actionPanel!: Phaser.GameObjects.Container;
  private movePanel!: Phaser.GameObjects.Container;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private W = 1280;
  private H = 720;

  constructor() { super('TrainerBattleScene'); }

  preload() {
    STARTERS.forEach(s => {
      if (!this.textures.exists(s.spriteKey))
        this.load.image(s.spriteKey, s.data.spriteUrl);
    });
  }

  async create() {
    this.cameras.main.fadeIn(350);
    this.trainerName = (this.registry.get('trainerName')     as string) ?? 'Trainer';
    this.trainerKey  = (this.registry.get('trainerKey')      as string) ?? 'trainer';
    this.totalExp    = (this.registry.get('trainerExpPool')  as number) ?? 30;
    // Which scene to return to after the battle (route or gym)
    this._returnScene = (this.registry.get('trainerReturnScene') as string) ?? 'RouteScene';
    const raw = (this.registry.get('trainerPokemon') as string) ?? '[]';
    this.enemyQueue  = JSON.parse(raw) as { id: number; level: number }[];

    this.drawBackground();
    this.createDialogBox();
    this.typeDialog('Loading…');
    this.spaceKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    await this.loadPlayerPokemon();
    await this.loadEnemyPokemon(0);

    this.createSprites();
    this.createHUDs();
    this.createActionPanel();
    this.createMovePanel();
    this.hideAllPanels();

    // Intro
    this.enemySprite.setAlpha(0);
    this.tweens.add({
      targets: this.enemySprite, x: 560, y: 130, alpha: 1, duration: 400,
      onComplete: () => {
        this.typeDialog(`${this.trainerName} wants to battle!`, () => {
          this.typeDialog(`${this.trainerName} sent out ${this.enemy.name.toUpperCase()}!`, () => {
            this.playerSprite.setAlpha(1);
            this.tweens.add({
              targets: this.playerSprite, x: 180, y: 260, duration: 350,
              onComplete: () => {
                this.typeDialog(`Go! ${this.player.name.toUpperCase()}!`,
                  () => this.playerAction());
              },
            });
          });
        });
      },
    });
  }

  // ── Pokémon loading ───────────────────────────────────────────────────────

  private async loadPlayerPokemon() {
    const key   = (this.registry.get('starterKey')   as string) ?? 'vipour';
    const level = (this.registry.get('starterLevel') as number) ?? 5;
    const def   = STARTERS.find(s => s.spriteKey === key) ?? STARTERS[1];
    this.player = new Pokemon(def.data, level, def.startingMoves);
    this.player.exp = (this.registry.get('starterExp') as number) ?? 0;
    const party = PartySystem.get(this.registry);
    if (party.length > 0) this.player['hp'] = Math.min(party[0].hp, this.player.maxHp);
  }

  private async loadEnemyPokemon(idx: number) {
    const entry = this.enemyQueue[idx];
    if (!entry) return;
    const [data, tackle, growl] = await Promise.all([
      fetchPokemon(entry.id),
      fetchMove('tackle'),
      fetchMove('growl'),
    ]);
    const texKey = `te-${entry.id}`;
    if (!this.textures.exists(texKey)) {
      this.load.image(texKey, data.spriteUrl);
      await new Promise<void>(r => { this.load.once('complete', r); this.load.start(); });
    }
    data.spriteUrl = data.spriteUrl; // already set
    this.enemy = new Pokemon(data, entry.level, [tackle, growl]);
    this.enemy.data.spriteUrl = data.spriteUrl;
    // Store tex key for sprite creation
    this.registry.set('_teKey', texKey);
  }

  // ── Background ────────────────────────────────────────────────────────────

  private drawBackground() {
    const g = this.add.graphics();
    g.fillStyle(0x6688bb); g.fillRect(0, 0, this.W, 300);
    g.fillStyle(0x4a7a3a); g.fillRect(0, 200, this.W, 110);
    g.fillStyle(0x8a9a6a);
    g.fillTriangle(0, 200, 150, 80, 300, 200);
    g.fillTriangle(200, 200, 400, 60, 600, 200);
    g.fillStyle(0xb09060);
    g.fillEllipse(180, 280, 160, 28); g.fillEllipse(580, 155, 120, 22);
    g.fillStyle(0x0d0d2e, 0.96); g.fillRect(0, this.H - 120, this.W, 120);
    g.lineStyle(2, 0x5577aa); g.lineBetween(0, this.H - 120, this.W, this.H - 120);
    this.add.text(this.W / 2, this.H - 108, '▶ SPACE to advance',
      { fontSize: '11px', color: '#5577aa' }).setOrigin(0.5).setDepth(2);
  }

  // ── HUDs ──────────────────────────────────────────────────────────────────

  private createHUDs() {
    this.add.rectangle(115, 50, 220, 60, 0x0d0d2e, 0.92).setStrokeStyle(1, 0x5577aa);
    this.add.text(12, 24, this.enemy.name.toUpperCase(), { fontSize: '13px', color: '#fff', fontStyle: 'bold' });
    this.enemyLvText  = this.add.text(180, 24, `Lv.${this.enemy.level}`, { fontSize: '12px', color: '#ffe44e' });
    this.add.rectangle(115, 52, HP_W + 6, 10, 0x333355);
    this.enemyHpBar   = this.add.rectangle(25, 52, HP_W, 8, 0x44cc44).setOrigin(0, 0.5);
    this.enemyHpText  = this.add.text(12, 60, `${this.enemy.hp}/${this.enemy.maxHp}`, { fontSize: '10px', color: '#aaa' });

    this.add.rectangle(660, 318, 220, 60, 0x0d0d2e, 0.92).setStrokeStyle(1, 0x5577aa);
    this.add.text(552, 292, this.player.name.toUpperCase(), { fontSize: '13px', color: '#fff', fontStyle: 'bold' });
    this.playerLvText = this.add.text(730, 292, `Lv.${this.player.level}`, { fontSize: '12px', color: '#ffe44e' }).setOrigin(1, 0);
    this.add.rectangle(660, 320, HP_W + 6, 10, 0x333355);
    this.playerHpBar  = this.add.rectangle(570, 320, HP_W, 8, 0x44cc44).setOrigin(0, 0.5);
    this.playerHpText = this.add.text(552, 330, `${this.player.hp}/${this.player.maxHp}`, { fontSize: '10px', color: '#aaa' });
  }

  private createSprites() {
    const pKey  = (this.registry.get('starterKey') as string) ?? 'vipour';
    const teKey = (this.registry.get('_teKey') as string) ?? 'vipour';

    this.enemySprite  = this.add.image(900, 60, this.textures.exists(teKey) ? teKey : pKey).setDepth(5).setAlpha(0);
    this.playerSprite = this.add.image(-80, 320, pKey).setDepth(5).setFlipX(true).setAlpha(0);

    const fit = (img: Phaser.GameObjects.Image, size: number) => {
      const t = this.textures.get(img.texture.key).getSourceImage();
      img.setScale(size / Math.max((t.width as number) || size, (t.height as number) || size));
    };
    fit(this.enemySprite, 130);
    fit(this.playerSprite, 140);
  }

  // ── Dialog ────────────────────────────────────────────────────────────────

  private createDialogBox() {
    this.dialogText = this.add.text(16, this.H - 108, '', {
      fontSize: '16px', color: '#fff', wordWrap: { width: this.W * 0.58 }, lineSpacing: 5,
    }).setDepth(10);
  }

  private typeDialog(text: string, onDone?: () => void) {
    this.dialogText.setText('');
    let i = 0;
    const ev = this.time.addEvent({
      delay: 26, repeat: text.length - 1,
      callback: () => {
        this.dialogText.setText(text.slice(0, ++i));
        if (i >= text.length) { ev.destroy(); if (onDone) this.time.delayedCall(600, onDone); }
      },
    });
  }

  // ── Panels ────────────────────────────────────────────────────────────────

  private createActionPanel() {
    this.actionPanel = this.add.container(this.W * 0.60, this.H - 120).setDepth(10);
    const bg = this.add.rectangle(80, 60, 316, 120, 0x111133).setStrokeStyle(1, 0x5577aa);
    this.actionPanel.add(bg);

    const actions = [
      { label: 'FIGHT',       x: 16,  y: 16, cb: () => this.onFight() },
      { label: 'BAG',         x: 170, y: 16, cb: () => this.typeDialog("Can't use items here!", () => this.playerAction()) },
      { label: "CAN'T\nRUN",  x: 16,  y: 68, cb: () => this.typeDialog("Can't run from a trainer!", () => this.playerAction()) },
      { label: 'POKÉMON',     x: 170, y: 68, cb: () => this.onSwitchPokemon() },
    ];
    actions.forEach(a => {
      const t = this.add.text(a.x, a.y, a.label, { fontSize: '18px', color: '#fff' })
        .setInteractive({ useHandCursor: a.label === 'FIGHT' })
        .on('pointerover',  () => { if (a.label === 'FIGHT') t.setColor('#ffe44e'); })
        .on('pointerout',   () => t.setColor('#ffffff'))
        .on('pointerdown',  a.cb);
      this.actionPanel.add(t);
    });
  }

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
      this.movePanel.add([pill, btn,
        this.add.text(x + 6, 30, `PP ${move.pp}/${move.data.pp}`, { fontSize: '10px', color: '#ccc' }),
        this.add.text(x + 6, 46, move.data.type.toUpperCase(), { fontSize: '9px', color: '#aaa' }),
      ]);
    });
  }

  private showActionPanel() { this.actionPanel.setVisible(true); this.movePanel.setVisible(false); }
  private showMovePanel()   { this.movePanel.setVisible(true);   this.actionPanel.setVisible(false); }
  private hideAllPanels()   { this.actionPanel.setVisible(false); this.movePanel.setVisible(false); }

  // ── Battle flow ───────────────────────────────────────────────────────────

  private playerAction() {
    this.state = 'playerAction';
    this.typeDialog(`What will ${this.player.name.toUpperCase()} do?`);
    this.showActionPanel();
  }

  private onFight() {
    if (this.state !== 'playerAction') return;
    this.state = 'playerMove';
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

    this.typeDialog(`${this.player.name.toUpperCase()} used ${playerMove.data.name}!`, () => {
      if (playerMove.data.power > 0) {
        const { dmg, critical, effectiveness } = this.enemy.takeDamage(playerMove, this.player);
        void dmg;
        this.animateHpBar('enemy', () => {
          const msg = critical ? 'A critical hit! ' :
            effectiveness > 1 ? 'Super effective!' :
            effectiveness < 1 && effectiveness > 0 ? 'Not very effective...' : '';
          const next = () => {
            if (this.enemy.isKO) { this.typeDialog(`${this.enemy.name.toUpperCase()} fainted!`, () => this.afterEnemyKO()); return; }
            this.enemyTurn();
          };
          if (msg) this.typeDialog(msg, next); else next();
        });
      } else {
        this.enemyTurn();
      }
    });
  }

  private enemyTurn() {
    const moves = this.enemy.moves.filter(m => m.pp > 0);
    const move  = moves.length ? moves[Math.floor(Math.random() * moves.length)] : this.enemy.moves[0];
    this.enemy.useMove(move);

    this.typeDialog(`${this.enemy.name.toUpperCase()} used ${move.data.name}!`, () => {
      if (move.data.power > 0) {
        this.player.takeDamage(move, this.enemy);
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

  private afterEnemyKO() {
    this.enemyIdx++;
    if (this.enemyIdx < this.enemyQueue.length) {
      // Send out next Pokémon
      this.loadEnemyPokemon(this.enemyIdx).then(() => {
        const teKey = (this.registry.get('_teKey') as string);
        this.enemySprite.setTexture(this.textures.exists(teKey) ? teKey : 'vipour');
        this.animateHpBar('enemy', () => {});
        this.enemyLvText.setText(`Lv.${this.enemy.level}`);
        this.enemyHpBar.width  = HP_W;
        this.enemyHpText.setText(`${this.enemy.hp}/${this.enemy.maxHp}`);
        this.typeDialog(`${this.trainerName} sent out ${this.enemy.name.toUpperCase()}!`,
          () => this.playerAction());
      });
    } else {
      this.handleWin();
    }
  }

  private handleWin() {
    this.state = 'over';
    const trainerLines: Record<string, string> = {
      'bug-catcher': "Bug Catcher: Whoa! Your Pokémon is so strong!",
      'hiker':       "Hiker: You've got real mountain spirit, kid.",
      'youngster':   "Youngster: No way! I just polished my sneakers…",
    };
    const defeatLine = trainerLines[this.trainerKey] ??
      `${this.trainerName}: You battled well…`;

    this.typeDialog(defeatLine, () => {
      // Grant EXP
      this.player.exp = (this.registry.get('starterExp') as number) ?? 0;
      const levelled  = this.player.gainExp(this.totalExp);
      this.registry.set('starterLevel', this.player.level);
      this.registry.set('starterExp',   this.player.exp);
      PartySystem.updateSlotHP(this.registry, this.activeSlot, this.player.hp);

      const expMsg = `${this.player.name.toUpperCase()} gained ${this.totalExp} EXP!\n(Total: ${this.player.exp}/${this.player.expToNextLevel()} to next level)`;
      if (levelled) {
        this.playerLvText.setText(`Lv.${this.player.level}`);
        this.typeDialog(expMsg, () => {
          this.animateHpBar('player', () => {
            this.typeDialog(`✨ ${this.player.name.toUpperCase()} grew to Lv. ${this.player.level}!`, () => {
              this.registry.set('trainerDefeated_' + this.trainerKey, true);
              SaveManager.save(this.registry, this.returnPx, this.returnPy);
              this.returnToRoute();
            });
          });
        });
      } else {
        const needed = this.player.expToNextLevel() - this.player.exp;
        this.typeDialog(`${expMsg}  (${needed} to next level)`, () => {
          this.registry.set('trainerDefeated_' + this.trainerKey, true);
          SaveManager.save(this.registry, this.returnPx, this.returnPy);
          this.returnToRoute();
        });
      }
    });
  }

  private get returnPx() { return (this.registry.get('routeReturnX') as number) ?? 0; }
  private get returnPy() { return (this.registry.get('routeReturnY') as number) ?? 0; }

  // ── Party switching ───────────────────────────────────────────────────────

  private onSwitchPokemon() {
    if (this.state !== 'playerAction') return;
    this.hideAllPanels();
    openSwitchPanel(
      this, this.activeSlot,
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
    this.animateHpBar('player', () => {});

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
        this.typeDialog(`Go, ${this.player.name.toUpperCase()}!`, () => this.enemyTurn());
      },
    });
  }

  private sendNextOrLose() {
    const party = PartySystem.get(this.registry);

    // Mark current slot as fainted
    if (party[this.activeSlot]) {
      party[this.activeSlot].hp = 0;
      PartySystem.set(this.registry, party);
    }

    // Find next healthy Pokémon
    const nextIdx = party.findIndex((e, i) => i !== this.activeSlot && e.hp > 0);

    if (nextIdx === -1) {
      // All fainted → trainer wins — return to wherever the battle was triggered from
      this.typeDialog(`${this.trainerName}: You're out of Pokémon! Better luck next time.`, () => {
        PartySystem.healAll(this.registry);
        this.cameras.main.fadeOut(500, 0, 0, 0, () => this.scene.start(this._returnScene));
      });
      return;
    }

    // Send in next Pokémon
    this.activeSlot  = nextIdx;
    const entry      = party[nextIdx];
    this.player      = buildFromEntry(entry);

    // Update HUD
    this.playerLvText.setText(`Lv.${this.player.level}`);
    this.playerHpBar.fillColor = 0x44cc44;
    this.playerHpBar.width     = HP_W;
    this.playerHpText.setText(`${this.player.hp}/${this.player.maxHp}`);

    // Swap sprite
    const key = entry.spriteKey;
    if (this.textures.exists(key)) {
      this.playerSprite.setTexture(key);
      const tex = this.textures.get(key).getSourceImage();
      const dim = Math.max((tex.width as number) || 1, (tex.height as number) || 1);
      this.playerSprite.setScale(140 / dim);
    }
    this.playerSprite.setAlpha(0);
    this.tweens.add({
      targets: this.playerSprite, alpha: 1, x: 180, y: 260, duration: 400,
      onComplete: () => {
        this.typeDialog(`Go, ${this.player.name.toUpperCase()}!`, () => this.playerAction());
      },
    });
  }

  private returnToRoute() {
    this.cameras.main.fadeOut(400, 255, 255, 255, () => this.scene.start(this._returnScene));
  }

  // ── Shared HP animation ───────────────────────────────────────────────────

  private animateHpBar(who: 'player' | 'enemy', onDone: () => void) {
    const mon   = who === 'player' ? this.player  : this.enemy;
    const bar   = who === 'player' ? this.playerHpBar  : this.enemyHpBar;
    const label = who === 'player' ? this.playerHpText : this.enemyHpText;
    const ratio = mon.hp / mon.maxHp;
    bar.fillColor = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddcc00 : 0xcc4444;
    this.tweens.add({
      targets: bar, width: Math.max(0, ratio * HP_W), duration: 450, ease: 'Linear',
      onComplete: () => { label.setText(`${mon.hp}/${mon.maxHp}`); onDone(); },
    });
  }
}
