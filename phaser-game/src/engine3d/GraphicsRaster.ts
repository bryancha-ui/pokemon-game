import Phaser from 'phaser';

// ── Graphics command-buffer rasterizer ───────────────────────────────────────
// Every map, building, character and NPC in this game is drawn with Phaser
// Graphics calls. To lift them into 3D we re-execute the recorded command
// buffer onto an offscreen 2D canvas (synchronously, no GPU round-trip), then
// use that canvas as a texture for ground decals or extruded relief meshes.
//
// Opcode ids + argument counts match the installed Phaser 3.88 source
// (src/gameobjects/graphics/Commands.js and Graphics.js push sites).

const OP = {
  ARC: 0, BEGIN_PATH: 1, CLOSE_PATH: 2, FILL_RECT: 3, LINE_TO: 4, MOVE_TO: 5,
  LINE_STYLE: 6, FILL_STYLE: 7, FILL_PATH: 8, STROKE_PATH: 9,
  FILL_TRIANGLE: 10, STROKE_TRIANGLE: 11, LINE_FX_TO: 12, MOVE_FX_TO: 13,
  SAVE: 14, RESTORE: 15, TRANSLATE: 16, SCALE: 17, ROTATE: 18,
  SET_TEXTURE: 19, CLEAR_TEXTURE: 20, GRADIENT_FILL_STYLE: 21, GRADIENT_LINE_STYLE: 22,
} as const;

// Argument count per opcode (for safe skipping of ops we ignore).
const ARGC: Record<number, number> = {
  [OP.ARC]: 7, [OP.BEGIN_PATH]: 0, [OP.CLOSE_PATH]: 0, [OP.FILL_RECT]: 4,
  [OP.LINE_TO]: 2, [OP.MOVE_TO]: 2, [OP.LINE_STYLE]: 3, [OP.FILL_STYLE]: 2,
  [OP.FILL_PATH]: 0, [OP.STROKE_PATH]: 0, [OP.FILL_TRIANGLE]: 6,
  [OP.STROKE_TRIANGLE]: 6, [OP.LINE_FX_TO]: 4, [OP.MOVE_FX_TO]: 4,
  [OP.SAVE]: 0, [OP.RESTORE]: 0, [OP.TRANSLATE]: 2, [OP.SCALE]: 2, [OP.ROTATE]: 1,
  [OP.SET_TEXTURE]: 2, [OP.CLEAR_TEXTURE]: 0,
  // fillGradientStyle pushes 8 values (4 corner alphas + 4 corner colors) —
  // NOT 5. A wrong count desyncs the whole command stream, so measureCommands
  // bails early and a gradient-filled fullscreen backdrop is never detected/
  // hidden (it then covers the 3D battle stage). lineGradientStyle pushes 6.
  [OP.GRADIENT_FILL_STYLE]: 8, [OP.GRADIENT_LINE_STYLE]: 6,
};

export interface RasterResult {
  canvas: HTMLCanvasElement;
  /** Local-space bounds of the drawing (origin = the Graphics object's origin). */
  minX: number; minY: number; width: number; height: number;
  /** Supersampling factor used (canvas px per local unit). */
  scale: number;
}

function cssColor(color: number, alpha: number): string {
  const r = (color >> 16) & 0xff, g = (color >> 8) & 0xff, b = color & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

interface Mat { a: number; b: number; c: number; d: number; e: number; f: number }
const IDENT: Mat = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

function apply(m: Mat, x: number, y: number): [number, number] {
  return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}
function mul(m: Mat, n: Mat): Mat {
  return {
    a: m.a * n.a + m.c * n.b, b: m.b * n.a + m.d * n.b,
    c: m.a * n.c + m.c * n.d, d: m.b * n.c + m.d * n.d,
    e: m.a * n.e + m.c * n.f + m.e, f: m.b * n.e + m.d * n.f + m.f,
  };
}

/** Measure the local-space bounds of a command buffer (transform-aware). */
export function measureCommands(buf: unknown[]): { minX: number; minY: number; maxX: number; maxY: number } | null {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let m: Mat = { ...IDENT };
  const stack: Mat[] = [];
  let lineW = 1;
  const pt = (x: number, y: number, pad = 0) => {
    const [tx, ty] = apply(m, x, y);
    if (tx - pad < minX) minX = tx - pad;
    if (ty - pad < minY) minY = ty - pad;
    if (tx + pad > maxX) maxX = tx + pad;
    if (ty + pad > maxY) maxY = ty + pad;
  };
  let i = 0;
  while (i < buf.length) {
    const op = buf[i++] as number;
    const n = ARGC[op];
    if (n === undefined) break;                    // unknown stream — bail with what we have
    const a = buf.slice(i, i + n) as number[];
    i += n;
    switch (op) {
      case OP.FILL_RECT: pt(a[0], a[1]); pt(a[0] + a[2], a[1] + a[3]); break;
      case OP.FILL_TRIANGLE: case OP.STROKE_TRIANGLE:
        pt(a[0], a[1]); pt(a[2], a[3]); pt(a[4], a[5]); break;
      case OP.LINE_TO: case OP.MOVE_TO: pt(a[0], a[1], lineW); break;
      case OP.LINE_FX_TO: case OP.MOVE_FX_TO: pt(a[0], a[1], lineW); break;
      case OP.ARC: pt(a[0] - a[2], a[1] - a[2]); pt(a[0] + a[2], a[1] + a[2]); break;
      case OP.LINE_STYLE: lineW = a[0] || 1; break;
      case OP.SAVE: stack.push({ ...m }); break;
      case OP.RESTORE: m = stack.pop() ?? { ...IDENT }; break;
      case OP.TRANSLATE: m = mul(m, { ...IDENT, e: a[0], f: a[1] }); break;
      case OP.SCALE: m = mul(m, { a: a[0], b: 0, c: 0, d: a[1], e: 0, f: 0 }); break;
      case OP.ROTATE: {
        const c = Math.cos(a[0]), s = Math.sin(a[0]);
        m = mul(m, { a: c, b: s, c: -s, d: c, e: 0, f: 0 });
        break;
      }
      default: break;
    }
  }
  if (!isFinite(minX)) return null;
  return { minX, minY, maxX, maxY };
}

/**
 * Rasterize a Graphics object's command buffer to an offscreen canvas.
 * `ss` is the supersampling factor (canvas pixels per local unit).
 */
export function rasterizeGraphics(g: Phaser.GameObjects.Graphics, ss = 2): RasterResult | null {
  const buf = (g as unknown as { commandBuffer: unknown[] }).commandBuffer;
  if (!buf || buf.length === 0) return null;
  const b = measureCommands(buf);
  if (!b) return null;
  const pad = 2;
  const minX = Math.floor(b.minX) - pad, minY = Math.floor(b.minY) - pad;
  const w = Math.ceil(b.maxX) + pad - minX, h = Math.ceil(b.maxY) + pad - minY;
  if (w <= 0 || h <= 0 || w > 8192 || h > 8192) return null;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(w * ss));
  canvas.height = Math.max(1, Math.round(h * ss));
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.setTransform(ss, 0, 0, ss, -minX * ss, -minY * ss);
  drawCommands(ctx, buf);
  return { canvas, minX, minY, width: w, height: h, scale: ss };
}

/** Re-execute a command buffer onto a 2D context (transform already applied). */
export function drawCommands(ctx: CanvasRenderingContext2D, buf: unknown[]): void {
  let fill = 'rgba(255,255,255,1)';
  let stroke = 'rgba(255,255,255,1)';
  let lineW = 1;
  let i = 0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  while (i < buf.length) {
    const op = buf[i++] as number;
    const n = ARGC[op];
    if (n === undefined) return;                    // unknown op — stop safely
    const a = buf.slice(i, i + n) as number[];
    i += n;
    switch (op) {
      case OP.FILL_STYLE: fill = cssColor(a[0], a[1]); break;
      case OP.LINE_STYLE: lineW = a[0] || 1; stroke = cssColor(a[1], a[2]); break;
      case OP.GRADIENT_FILL_STYLE: fill = cssColor(a[1], a[0]); break;              // approx: top-left color
      case OP.GRADIENT_LINE_STYLE: lineW = a[0] || 1; stroke = cssColor(a[2], a[1]); break;
      case OP.FILL_RECT: ctx.fillStyle = fill; ctx.fillRect(a[0], a[1], a[2], a[3]); break;
      case OP.FILL_TRIANGLE:
        ctx.fillStyle = fill; ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(a[4], a[5]);
        ctx.closePath(); ctx.fill(); break;
      case OP.STROKE_TRIANGLE:
        ctx.strokeStyle = stroke; ctx.lineWidth = lineW; ctx.beginPath();
        ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(a[4], a[5]);
        ctx.closePath(); ctx.stroke(); break;
      case OP.BEGIN_PATH: ctx.beginPath(); break;
      case OP.CLOSE_PATH: ctx.closePath(); break;
      case OP.MOVE_TO: ctx.moveTo(a[0], a[1]); break;
      case OP.LINE_TO: ctx.lineTo(a[0], a[1]); break;
      case OP.MOVE_FX_TO: ctx.moveTo(a[0], a[1]); break;
      case OP.LINE_FX_TO: ctx.lineTo(a[0], a[1]); break;
      case OP.ARC: ctx.arc(a[0], a[1], a[2], a[3], a[4], !!a[5]); break;
      case OP.FILL_PATH: ctx.fillStyle = fill; ctx.fill(); break;
      case OP.STROKE_PATH: ctx.strokeStyle = stroke; ctx.lineWidth = lineW; ctx.stroke(); break;
      case OP.SAVE: ctx.save(); break;
      case OP.RESTORE: ctx.restore(); break;
      case OP.TRANSLATE: ctx.translate(a[0], a[1]); break;
      case OP.SCALE: ctx.scale(a[0], a[1]); break;
      case OP.ROTATE: ctx.rotate(a[0]); break;
      default: break;                               // SET_TEXTURE / CLEAR_TEXTURE ignored
    }
  }
}

/** Cheap content hash so we can tell when a Graphics object was redrawn. */
export function hashCommands(buf: unknown[]): number {
  let h = buf.length | 0;
  const step = Math.max(1, Math.floor(buf.length / 64));
  for (let i = 0; i < buf.length; i += step) {
    const v = buf[i];
    const x = typeof v === 'number' ? v : 0;
    h = ((h * 31) + ((x * 1000) | 0)) | 0;
  }
  return h;
}
