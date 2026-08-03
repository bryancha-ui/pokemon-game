import Phaser from 'phaser';

// ── Global on-canvas font scaling ────────────────────────────────────────────
// The game renders at a fixed 1280×720 and uses Scale.FIT, so on a small phone
// the whole canvas (and every px-sized font) shrinks to fit — leaving text barely
// readable. To keep it playable on small screens we multiply EVERY on-canvas font
// by a global factor on touch devices, hooked once at the Phaser text factory so
// no individual scene needs to change. Desktop passes scale = 1 (a no-op).

let FONT_SCALE = 1;

/** The active on-canvas font multiplier (1 on desktop, >1 on mobile). UI that owns
 *  a fixed-size container (e.g. the dialog box) reads this to grow with the text. */
export function fontScale(): number { return FONT_SCALE; }

function scaleStyle(style: unknown): unknown {
  const s = style as { fontSize?: unknown } | undefined;
  if (!s || s.fontSize == null) return style;
  const fs = s.fontSize;
  let px: number | null = null;
  if (typeof fs === 'number') px = fs;
  else if (typeof fs === 'string') { const m = /^(\d+(?:\.\d+)?)\s*px$/.exec(fs.trim()); if (m) px = parseFloat(m[1]); }
  if (px == null) return style;
  return { ...s, fontSize: `${Math.round(px * FONT_SCALE)}px` };
}

/** Install the global font multiplier. MUST run before any scene creates text. */
export function installFontScaling(scale: number): void {
  FONT_SCALE = scale;
  if (scale === 1) return;

  const facProto = Phaser.GameObjects.GameObjectFactory.prototype as unknown as {
    text: (x: number, y: number, text: unknown, style: unknown) => unknown;
  };
  const origText = facProto.text;
  facProto.text = function (x: number, y: number, text: unknown, style: unknown) {
    return origText.call(this, x, y, text, scaleStyle(style));
  };

  // this.make.text({ ... }) bypasses the factory — patch the creator too.
  const crProto = Phaser.GameObjects.GameObjectCreator.prototype as unknown as {
    text?: (config: { style?: unknown }, addToScene?: boolean) => unknown;
  };
  const origCreate = crProto.text;
  if (origCreate) {
    crProto.text = function (config: { style?: unknown }, addToScene?: boolean) {
      if (config && config.style) config = { ...config, style: scaleStyle(config.style) };
      return origCreate.call(this, config, addToScene);
    };
  }
}
