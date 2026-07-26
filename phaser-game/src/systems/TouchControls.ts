// ── Mobile "dual-screen" shell + on-screen controls ──────────────────────────
// On touch devices the page is split like a Nintendo DS: the Phaser game canvas
// lives on the TOP screen, and a solid control DECK fills the BOTTOM screen so the
// buttons never sit on top of the game. The deck holds a D-pad + A/B + utility
// pills, and — during battle — a move-select bar (see deckShowMoves/deckHideMoves).
//
// Everything on the deck is sized in a single unit `--u` derived from the deck's
// ACTUAL box (a ResizeObserver recomputes it on rotate / fold / resize), so the
// controls always scale to fit and never overflow when the screen changes shape.
//
// The game reads the keyboard (arrows/SPACE/SHIFT/M/C/ESC); the D-pad/buttons
// synthesise those key events on `window` (the target Phaser listens on), so no
// per-scene wiring is needed. Battle move buttons instead call a JS callback the
// battle scene supplies, since the on-canvas move buttons are already tap-driven.

const KEY = {
  left: 37, up: 38, right: 39, down: 40,
  space: 32, shift: 16, m: 77, c: 67, esc: 27,
} as const;

export function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

/** Fire a synthetic keyboard event that Phaser will read (keyCode-indexed). */
function dispatchKey(type: 'keydown' | 'keyup', code: number): void {
  const ev = new KeyboardEvent(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => code });
  Object.defineProperty(ev, 'which', { get: () => code });
  window.dispatchEvent(ev);
}

const TYPE_COLORS: Record<string, string> = {
  normal: '#a8a878', fire: '#f08030', water: '#6890f0', electric: '#f8d030',
  grass: '#78c850', ice: '#98d8d8', fighting: '#c03028', poison: '#a040a0',
  ground: '#e0c068', flying: '#a890f0', psychic: '#f85888', bug: '#a8b820',
  rock: '#b8a038', ghost: '#705898', dragon: '#7038f8', dark: '#705848',
  steel: '#b8b8d0', fairy: '#ee99ac',
};

interface DeckMove { data: { name: string; type: string; pp: number }; pp: number }

const btnBase =
  'display:flex;align-items:center;justify-content:center;pointer-events:auto;' +
  'touch-action:none;user-select:none;-webkit-user-select:none;color:#fff;font-weight:700;' +
  'border:2px solid rgba(255,255,255,0.5);background:rgba(30,38,66,0.9);' +
  'box-shadow:0 2px 6px rgba(0,0,0,0.45);-webkit-tap-highlight-color:transparent;box-sizing:border-box;';

/** Button that holds a key down while pressed (D-pad, run). */
function holdButton(label: string, css: string, code: number): HTMLElement {
  const b = document.createElement('div');
  b.style.cssText = btnBase + css;
  b.textContent = label;
  let held = false;
  const press = (e: Event) => { e.preventDefault(); if (held) return; held = true; b.style.background = 'rgba(90,120,200,0.95)'; dispatchKey('keydown', code); };
  const release = (e: Event) => { e.preventDefault(); if (!held) return; held = false; b.style.background = 'rgba(30,38,66,0.9)'; dispatchKey('keyup', code); };
  b.addEventListener('pointerdown', press);
  b.addEventListener('pointerup', release);
  b.addEventListener('pointerleave', release);
  b.addEventListener('pointercancel', release);
  return b;
}

/** Button that taps a key (keydown then keyup shortly after). */
function tapButton(label: string, css: string, code: number): HTMLElement {
  const b = document.createElement('div');
  b.style.cssText = btnBase + css;
  b.textContent = label;
  b.addEventListener('pointerdown', (e: Event) => {
    e.preventDefault();
    b.style.background = 'rgba(90,120,200,0.95)';
    dispatchKey('keydown', code);
    setTimeout(() => { dispatchKey('keyup', code); b.style.background = 'rgba(30,38,66,0.9)'; }, 140);
  });
  return b;
}

let deckEl: HTMLElement | null = null;
let controlLayer: HTMLElement | null = null;
let moveLayer: HTMLElement | null = null;
let mobile = false;

/** Recompute the `--u` sizing unit from the deck's real box so nothing overflows. */
function updateUnit(): void {
  if (!deckEl) return;
  const r = deckEl.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return;
  // Fit the D-pad (~9u wide incl. the A/B cluster; ~11u tall incl. pills) into the deck.
  const u = Math.max(6, Math.min(72, Math.min(r.width / 16, r.height / 12)));
  deckEl.style.setProperty('--u', u.toFixed(2) + 'px');
}

/**
 * Build the DS-style split shell. Must run BEFORE the Phaser game is created so the
 * game can mount into the top `#game` pane. Returns the parent the game should use.
 * On non-touch (desktop) it does nothing and the game fills the window as before.
 */
export function setupMobileShell(force = false): { parent: HTMLElement | undefined; mobile: boolean } {
  mobile = force || isTouchDevice();
  if (!mobile) return { parent: undefined, mobile: false };

  // Body becomes a vertical split: game pane on top, control deck below.
  document.body.style.cssText =
    'margin:0;padding:0;background:#000;display:flex;flex-direction:column;' +
    'height:100vh;height:100dvh;width:100vw;overflow:hidden;' +
    'font-family:system-ui,-apple-system,sans-serif;touch-action:none;overscroll-behavior:none;';

  const gamePane = document.createElement('div');
  gamePane.id = 'game';
  // 16:9 game sits at full width; its height follows that aspect (capped) so the
  // canvas fills the top pane snugly and the rest of the screen is the deck. The
  // cap keeps the deck a usable size in landscape too.
  gamePane.style.cssText =
    'position:relative;width:100vw;height:min(56vh,calc(100vw*0.5625));' +
    'flex:0 0 auto;background:#000;overflow:hidden;';

  deckEl = document.createElement('div');
  deckEl.id = 'deck';
  deckEl.style.cssText =
    'position:relative;flex:1 1 auto;width:100vw;min-height:0;--u:24px;' +
    'background:linear-gradient(#141a2e,#0b0f1e);border-top:3px solid #33406a;' +
    'box-shadow:inset 0 3px 8px rgba(0,0,0,0.5);touch-action:none;';

  buildControlLayer();
  buildMoveLayer();
  deckEl.append(controlLayer!, moveLayer!);
  document.body.append(gamePane, deckEl);

  // Keep the sizing unit in step with the deck's real size across rotate / fold / resize.
  updateUnit();
  if ('ResizeObserver' in window) new ResizeObserver(updateUnit).observe(deckEl);
  window.addEventListener('resize', updateUnit);
  window.addEventListener('orientationchange', () => setTimeout(updateUnit, 150));
  return { parent: gamePane, mobile: true };
}

/** The persistent movement/action controls, shown whenever the move bar is hidden. */
function buildControlLayer(): void {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;';

  // D-pad — a 3×3 grid in the bottom-left; the four arrows sit in the plus cells so
  // the cluster scales as one block and can never spill outside the deck.
  const pad = document.createElement('div');
  pad.style.cssText =
    'position:absolute;left:var(--u);bottom:var(--u);' +
    'width:calc(var(--u)*7.6);height:calc(var(--u)*7.6);display:grid;' +
    'grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:calc(var(--u)*0.28);';
  const cell = 'border-radius:calc(var(--u)*0.55);font-size:calc(var(--u)*1.7);';
  const up    = holdButton('▲', cell + 'grid-column:2;grid-row:1;', KEY.up);
  const left  = holdButton('◀', cell + 'grid-column:1;grid-row:2;', KEY.left);
  const right = holdButton('▶', cell + 'grid-column:3;grid-row:2;', KEY.right);
  const down  = holdButton('▼', cell + 'grid-column:2;grid-row:3;', KEY.down);
  pad.append(up, left, right, down);

  // A / B — bottom-right cluster.
  const a = tapButton('A',  'position:absolute;right:var(--u);bottom:calc(var(--u)*1.6);width:calc(var(--u)*3.4);height:calc(var(--u)*3.4);border-radius:50%;font-size:calc(var(--u)*1.6);background:rgba(46,120,74,0.92);', KEY.space);
  const b = holdButton('B', 'position:absolute;right:calc(var(--u)*3.9);bottom:calc(var(--u)*3.1);width:calc(var(--u)*2.6);height:calc(var(--u)*2.6);border-radius:50%;font-size:calc(var(--u)*1.25);background:rgba(150,64,64,0.92);', KEY.shift);

  // Utility pills — top-right of the deck.
  const pill = 'top:calc(var(--u)*0.6);width:calc(var(--u)*1.95);height:calc(var(--u)*1.95);border-radius:calc(var(--u)*0.45);font-size:calc(var(--u)*1);';
  const menu = tapButton('☰',  `position:absolute;right:var(--u);${pill}`,              KEY.m);
  const back = tapButton('✕',  `position:absolute;right:calc(var(--u)*3.25);${pill}`,   KEY.esc);
  const bike = tapButton('🚲', `position:absolute;right:calc(var(--u)*5.5);${pill}`,    KEY.c);

  layer.append(pad, a, b, menu, back, bike);
  controlLayer = layer;
}

/** The battle move-select bar (2×2), shown only while a move choice is offered. */
function buildMoveLayer(): void {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:absolute;inset:0;display:none;flex-direction:column;padding:calc(var(--u)*0.5);box-sizing:border-box;pointer-events:none;';
  const title = document.createElement('div');
  title.textContent = 'CHOOSE A MOVE';
  title.style.cssText = 'color:#ffe44e;font-weight:800;font-size:clamp(13px,calc(var(--u)*1),24px);text-align:center;letter-spacing:2px;margin:clamp(2px,calc(var(--u)*0.3),10px) 0 clamp(3px,calc(var(--u)*0.4),12px);flex:0 0 auto;';
  const grid = document.createElement('div');
  grid.className = '__movegrid';
  grid.style.cssText = 'flex:1;min-height:0;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:calc(var(--u)*0.5);pointer-events:auto;';
  const back = document.createElement('div');
  back.textContent = '← BACK';
  back.style.cssText = btnBase + 'flex:0 0 auto;margin-top:clamp(3px,calc(var(--u)*0.5),12px);height:clamp(30px,calc(var(--u)*2.2),60px);border-radius:calc(var(--u)*0.4);font-size:clamp(13px,calc(var(--u)*0.9),22px);pointer-events:auto;background:rgba(60,70,100,0.9);';
  back.dataset.role = 'back';
  layer.append(title, grid, back);
  moveLayer = layer;
}

/**
 * Show the move-select bar on the bottom deck. Battle scenes call this from
 * showMovePanel; it returns true when the deck handled it (touch/mobile), so the
 * scene can hide its on-canvas move panel and keep the top screen clean.
 */
export function deckShowMoves(moves: DeckMove[], onPick: (i: number) => void, onBack: () => void): boolean {
  if (!mobile || !moveLayer || !controlLayer) return false;
  const grid = moveLayer.querySelector('.__movegrid') as HTMLElement;
  grid.textContent = '';
  moves.slice(0, 4).forEach((m, i) => {
    const col = TYPE_COLORS[m.data.type] ?? '#556';
    const cell = document.createElement('div');
    const dim = m.pp <= 0;
    cell.style.cssText = btnBase +
      `flex-direction:column;border-radius:calc(var(--u)*0.5);border-color:${col};min-width:0;` +
      `background:${dim ? 'rgba(40,40,50,0.85)' : 'rgba(24,30,54,0.95)'};opacity:${dim ? 0.5 : 1};` +
      // Fonts are clamped so they never blow up on big/unfolded screens; the name wraps
      // instead of overflowing, and nothing gets clipped.
      'line-height:1.1;padding:clamp(3px,calc(var(--u)*0.3),12px);text-align:center;overflow:visible;';
    cell.innerHTML =
      `<div style="font-weight:800;font-size:clamp(13px,calc(var(--u)*0.85),22px);line-height:1.05;word-break:break-word;overflow-wrap:anywhere">${m.data.name.toUpperCase()}</div>` +
      `<div style="font-size:clamp(9px,calc(var(--u)*0.6),14px);color:${col};margin-top:clamp(2px,calc(var(--u)*0.2),8px)">${m.data.type.toUpperCase()}</div>` +
      `<div style="font-size:clamp(9px,calc(var(--u)*0.6),14px);color:#cbd3e6;margin-top:clamp(1px,calc(var(--u)*0.1),5px)">PP ${m.pp}/${m.data.pp}</div>`;
    cell.addEventListener('pointerdown', (e) => { e.preventDefault(); onPick(i); });
    grid.append(cell);
  });
  const back = moveLayer.querySelector('[data-role="back"]') as HTMLElement;
  back.onpointerdown = (e) => { e.preventDefault(); onBack(); };

  controlLayer.style.display = 'none';
  moveLayer.style.display = 'flex';
  return true;
}

/** Hide the move bar and restore the movement/action controls. */
export function deckHideMoves(): void {
  if (!mobile || !moveLayer || !controlLayer) return;
  moveLayer.style.display = 'none';
  controlLayer.style.display = 'block';
}

/** Back-compat shim: the old entry point. The shell is now built in setupMobileShell. */
export function initTouchControls(_force = false): void { /* handled by setupMobileShell */ }
