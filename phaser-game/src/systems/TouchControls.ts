// ── On-screen touch controls (mobile) ────────────────────────────────────────
// The whole game reads the keyboard (arrows/SPACE/SHIFT/M/C/ESC). Rather than wire
// touch handling into every scene, this overlay draws a D-pad + action buttons in
// the DOM and synthesises the matching keyboard events on `window` — the same target
// Phaser's KeyboardPlugin listens on — so isDown / JustDown work everywhere unchanged.

const KEY = {
  left: 37, up: 38, right: 39, down: 40,
  space: 32, shift: 16, m: 77, c: 67, esc: 27,
} as const;

function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Fire a synthetic keyboard event that Phaser will read (keyCode-indexed). */
function dispatchKey(type: 'keydown' | 'keyup', code: number): void {
  const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => code });
  Object.defineProperty(ev, 'which', { get: () => code });
  window.dispatchEvent(ev);
}

const btnBase =
  'position:absolute;display:flex;align-items:center;justify-content:center;' +
  'pointer-events:auto;touch-action:none;user-select:none;-webkit-user-select:none;' +
  'color:#fff;font-weight:700;border-radius:50%;border:2px solid rgba(255,255,255,0.55);' +
  'background:rgba(20,26,48,0.55);box-shadow:0 2px 8px rgba(0,0,0,0.4);' +
  '-webkit-tap-highlight-color:transparent;';

/** Make a button that holds a key down while pressed (D-pad, run). */
function holdButton(label: string, size: number, extra: string, code: number): HTMLElement {
  const b = document.createElement('div');
  b.style.cssText = btnBase + `width:${size}px;height:${size}px;font-size:${size * 0.42}px;` + extra;
  b.textContent = label;
  let held = false;
  const press = (e: Event) => { e.preventDefault(); if (held) return; held = true; b.style.background = 'rgba(90,120,200,0.8)'; dispatchKey('keydown', code); };
  const release = (e: Event) => { e.preventDefault(); if (!held) return; held = false; b.style.background = 'rgba(20,26,48,0.55)'; dispatchKey('keyup', code); };
  b.addEventListener('pointerdown', press);
  b.addEventListener('pointerup', release);
  b.addEventListener('pointerleave', release);
  b.addEventListener('pointercancel', release);
  return b;
}

/** Make a button that taps a key (keydown then keyup a few frames later). */
function tapButton(label: string, size: number, extra: string, code: number): HTMLElement {
  const b = document.createElement('div');
  b.style.cssText = btnBase + `width:${size}px;height:${size}px;font-size:${size * 0.42}px;` + extra;
  b.textContent = label;
  const tap = (e: Event) => {
    e.preventDefault();
    b.style.background = 'rgba(90,120,200,0.8)';
    dispatchKey('keydown', code);
    setTimeout(() => { dispatchKey('keyup', code); b.style.background = 'rgba(20,26,48,0.55)'; }, 140);
  };
  b.addEventListener('pointerdown', tap);
  return b;
}

let installed = false;

/** Build the overlay and attach it to the page (idempotent; touch devices only). */
export function initTouchControls(force = false): void {
  if (installed || (!force && !isTouchDevice())) return;
  installed = true;

  const root = document.createElement('div');
  root.id = '__touch__';
  root.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:10000;' +
    'font-family:system-ui,-apple-system,sans-serif;touch-action:none;';

  // ── D-pad (bottom-left) — a plus of four directional pads ──
  const pad = document.createElement('div');
  pad.style.cssText = 'position:absolute;left:14px;bottom:16px;width:168px;height:168px;pointer-events:none;';
  const D = 56;
  const up    = holdButton('▲', D, `left:${D}px;top:0;`,          KEY.up);
  const down  = holdButton('▼', D, `left:${D}px;top:${D * 2}px;`, KEY.down);
  const left  = holdButton('◀', D, `left:0;top:${D}px;`,          KEY.left);
  const right = holdButton('▶', D, `left:${D * 2}px;top:${D}px;`, KEY.right);
  pad.append(up, down, left, right);

  // ── Action buttons (bottom-right) ──
  const a = tapButton('A',  74, 'right:20px;bottom:24px;background:rgba(60,120,80,0.7);', KEY.space);
  const b = holdButton('B', 60, 'right:96px;bottom:60px;background:rgba(140,70,70,0.7);', KEY.shift);

  // ── Small utility pills (top-right): menu, back, bike ──
  const pill = 'top:14px;background:rgba(20,26,48,0.7);border-radius:22px;';
  const menu = tapButton('☰', 44, `right:14px;${pill}`,  KEY.m);
  const back = tapButton('✕', 44, `right:66px;${pill}`,  KEY.esc);
  const bike = tapButton('🚲', 44, `right:118px;${pill}`, KEY.c);

  root.append(pad, a, b, menu, back, bike);
  document.body.appendChild(root);
}
