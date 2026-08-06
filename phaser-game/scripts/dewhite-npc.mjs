// Usage:  npm i --no-save pngjs  &&  node scripts/dewhite-npc.mjs  [file.png …]
// (no args = every portrait wired in BattlePortraits.ts). Re-run after adding new
// NPC art with a white background.
//
// Strips the white background from NPC battle portraits by flood-filling
// near-white pixels inward from the image edges (so interior white — clothing,
// hair, teeth — is preserved; only the connected background is removed).
import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NPC = path.join(root, 'public/assets/npc');
const THRESH = 232;                 // channel value above which a pixel counts as "white"
const isWhite = (d, i) => d[i + 3] > 8 && d[i] >= THRESH && d[i + 1] >= THRESH && d[i + 2] >= THRESH;

// Portrait files wired into the game (P('…') in BattlePortraits.ts), plus any png
// passed on the command line.
const src = fs.readFileSync(path.join(root, 'src/data/BattlePortraits.ts'), 'utf8');
const wired = [...new Set([...src.matchAll(/P\('([^']+\.png)'\)/g)].map(m => m[1]))];
const files = process.argv.length > 2 ? process.argv.slice(2) : wired;

let changed = 0, skipped = 0, missing = 0;
for (const f of files) {
  const p = path.join(NPC, f);
  if (!fs.existsSync(p)) { console.log('  MISSING', f); missing++; continue; }
  const png = PNG.sync.read(fs.readFileSync(p));
  const { width: W, height: H, data } = png;
  const idx = (x, y) => (y * W + x) * 4;
  const corner = (x, y) => isWhite(data, idx(x, y));
  if (!(corner(0, 0) || corner(W - 1, 0) || corner(0, H - 1) || corner(W - 1, H - 1))) {
    console.log('  skip (no white corner)', f); skipped++; continue;
  }
  const visited = new Uint8Array(W * H);
  const stack = [];
  const visit = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const c = y * W + x;
    if (visited[c]) return;
    visited[c] = 1;
    const i = c * 4;
    if (isWhite(data, i)) { data[i + 3] = 0; stack.push(x, y); }
  };
  for (let x = 0; x < W; x++) { visit(x, 0); visit(x, H - 1); }
  for (let y = 0; y < H; y++) { visit(0, y); visit(W - 1, y); }
  while (stack.length) {
    const y = stack.pop(), x = stack.pop();
    visit(x + 1, y); visit(x - 1, y); visit(x, y + 1); visit(x, y - 1);
  }
  // Soften the 1px anti-aliased halo left at the sprite border: any still-opaque
  // near-white pixel touching a now-transparent one gets partially faded.
  const alphaCopy = new Uint8Array(W * H);
  for (let c = 0; c < W * H; c++) alphaCopy[c] = data[c * 4 + 3];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = y * W + x, i = c * 4;
    if (alphaCopy[c] === 0) continue;
    const near = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (near < 205) continue;
    const nb = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < W && ny < H && alphaCopy[ny * W + nx] === 0;
    });
    if (nb) data[i + 3] = Math.round(data[i + 3] * (1 - (near - 205) / 50));
  }
  fs.writeFileSync(p, PNG.sync.write(png));
  console.log('  de-whited', f);
  changed++;
}
console.log(`\ndone: ${changed} changed, ${skipped} skipped, ${missing} missing`);
