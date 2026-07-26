import Phaser from 'phaser';

export class DialogBox {
  private bg!: Phaser.GameObjects.Rectangle;
  private msgText!: Phaser.GameObjects.Text;
  private arrow!: Phaser.GameObjects.Text;
  private choiceBg!: Phaser.GameObjects.Rectangle;
  private choiceItems!: Phaser.GameObjects.Text[];

  private queue: string[] = [];
  private onDone?: () => void;
  private typing = false;
  private fullLine = '';
  private charIdx = 0;
  private typeTimer?: Phaser.Time.TimerEvent;
  private arrowTween?: Phaser.Tweens.Tween;

  private inChoice = false;
  private choiceIdx = 0;
  private onYes?: () => void;
  private onNo?: () => void;

  private root!: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene, private W: number, private H: number) {
    const bx = W / 2, by = H - 68;
    // All objects are placed at absolute screen-design coordinates, then parented
    // into a container that counteracts the camera zoom so the dialog is always
    // fully visible at the bottom of the screen (see applyZoomCompensation()).
    this.bg = scene.add.rectangle(bx, by, W - 16, 112, 0x0d0d2e, 0.96)
      .setStrokeStyle(2, 0xffffff).setVisible(false);

    this.msgText = scene.add.text(16, H - 124, '', {
      fontSize: '15px', color: '#ffffff', wordWrap: { width: W - 32 }, lineSpacing: 6,
    }).setVisible(false);

    this.arrow = scene.add.text(W - 24, H - 20, '▼', { fontSize: '13px', color: '#ffe44e' })
      .setVisible(false);

    this.choiceBg = scene.add.rectangle(W - 80, H - 168, 130, 68, 0x0d0d2e, 0.96)
      .setStrokeStyle(2, 0xffffff).setVisible(false);

    this.choiceItems = [
      scene.add.text(W - 110, H - 192, '▶ YES', { fontSize: '15px', color: '#ffffff' }).setVisible(false),
      scene.add.text(W - 110, H - 168, '  NO',  { fontSize: '15px', color: '#aaaaaa' }).setVisible(false),
    ];

    this.root = scene.add.container(0, 0, [
      this.bg, this.msgText, this.arrow, this.choiceBg, ...this.choiceItems,
    ]).setScrollFactor(0).setDepth(300);

    this.applyZoomCompensation();
  }

  /** Make the container render at exact screen coords regardless of camera zoom. */
  private applyZoomCompensation() {
    const zoom = this.scene.cameras.main?.zoom ?? 1;
    const cx = this.W / 2, cy = this.H / 2;
    const s = 1 / zoom;
    this.root.setScale(s);
    this.root.setPosition(cx * (1 - s), cy * (1 - s));
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  show(lines: string[], onDone?: () => void) {
    this.queue = [...lines];
    this.onDone = onDone;
    this.inChoice = false;
    this.bg.setVisible(true);
    this.msgText.setVisible(true);
    this.typeNext();
  }

  showChoice(onYes: () => void, onNo: () => void) {
    this.onYes = onYes;
    this.onNo  = onNo;
    this.inChoice = true;
    this.choiceIdx = 0;
    // Keep the main dialog bg visible so isOpen() stays true
    this.bg.setVisible(true);
    this.choiceBg.setVisible(true);
    this.choiceItems.forEach(t => t.setVisible(true));
    this.refreshChoice();
  }

  // Call this on SPACE / ENTER keydown
  advance() {
    if (!this.isOpen()) return;
    if (this.inChoice) return;

    if (this.typing) {
      this.typeTimer?.destroy();
      this.msgText.setText(this.fullLine);
      this.typing = false;
      this.showArrow();
      return;
    }
    this.typeNext();
  }

  // Call this on UP / DOWN keydown when choice is open
  navigateChoice(dir: 1 | -1) {
    if (!this.inChoice) return;
    this.choiceIdx = (this.choiceIdx + dir + 2) % 2;
    this.refreshChoice();
  }

  // Call this on SPACE / ENTER when choice is open
  confirmChoice() {
    if (!this.inChoice) return;
    const yes = this.choiceIdx === 0;
    this.choiceBg.setVisible(false);
    this.choiceItems.forEach(t => t.setVisible(false));
    this.inChoice = false;
    this.hide();
    if (yes) this.onYes?.();
    else     this.onNo?.();
  }

  isOpen()     { return this.bg.visible || this.inChoice; }
  isInChoice() { return this.inChoice; }

  // ── Private ────────────────────────────────────────────────────────────────

  private typeNext() {
    this.hideArrow();
    if (this.queue.length === 0) {
      this.hide();
      this.onDone?.();
      return;
    }
    this.fullLine = this.queue.shift()!;
    this.charIdx  = 0;
    this.typing   = true;
    this.msgText.setText('');

    this.typeTimer?.destroy();
    this.typeTimer = this.scene.time.addEvent({
      delay: 28,
      repeat: this.fullLine.length - 1,
      callback: () => {
        this.msgText.setText(this.fullLine.slice(0, ++this.charIdx));
        if (this.charIdx >= this.fullLine.length) {
          this.typing = false;
          this.showArrow();
        }
      },
    });
  }

  private showArrow() {
    this.arrow.setVisible(true).setAlpha(1);
    this.arrowTween?.destroy();
    this.arrowTween = this.scene.tweens.add({
      targets: this.arrow, alpha: 0, duration: 420, yoyo: true, repeat: -1,
    });
  }

  private hideArrow() {
    this.arrowTween?.destroy();
    this.arrow.setVisible(false);
  }

  private refreshChoice() {
    this.choiceItems[0].setText(this.choiceIdx === 0 ? '▶ YES' : '  YES')
      .setColor(this.choiceIdx === 0 ? '#ffffff' : '#888888');
    this.choiceItems[1].setText(this.choiceIdx === 1 ? '▶ NO'  : '  NO')
      .setColor(this.choiceIdx === 1 ? '#ffffff' : '#888888');
  }

  hide() {
    this.typeTimer?.destroy();
    this.hideArrow();
    [this.bg, this.msgText, this.choiceBg].forEach(o => o.setVisible(false));
    this.choiceItems.forEach(t => t.setVisible(false));
    this.typing = false;
    this.inChoice = false;
  }
}
