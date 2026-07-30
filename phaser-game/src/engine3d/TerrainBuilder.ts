import * as THREE from 'three';
import {
  InstancedProp, WallBuilder, makeFlowers, makeGrassTufts, makePines,
  makeRocks, makeTrees, makeWater, toonRamp,
} from './Props';
import { getProp, hasProps, pickProp, primeProps, propById, propFailed, propsFor } from './PropModels';
import type { EnvProfile } from './ThreeStage';

// ── Terrain builder ──────────────────────────────────────────────────────────
// The composited map painting (rasterized from the scene's own Graphics) is
// projected onto the 3D ground plane — guaranteeing the exact original layout
// in every scene — and then each 32px tile is classified by color so real 3D
// volume grows out of it: cliff/cave walls rise as blocks, dark-green cells
// become trees, saturated green becomes tall-grass tufts, blue water gets an
// animated surface, flower tones get blossoms, grey gets boulders.

export const PX = 32;            // game pixels per tile == world units per tile: 1 tile = 1 unit

export interface TerrainResult {
  group: THREE.Group;
  env: EnvProfile;
  update(t: number): void;
  /** world size in tiles */
  cols: number; rows: number;
  /** detected building plots (debug/inspection) */
  plots: { x: number; z: number; w: number; d: number }[];
  /** occluders the camera may need to see through (buildings/props) */
  blockers: { node: THREE.Object3D; r: number; fade: number }[];
  /** environment classifier inputs (debug) */
  envStats: { dark: number; vivid: number; light: number };
}

interface HSL { h: number; s: number; l: number }

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return { h, s, l };
}

type Cell =
  | 'flat' | 'wall-high' | 'wall-low' | 'tree' | 'pine' | 'grass' | 'flower'
  | 'water' | 'rock' | 'building';

// ── Facade texture (generated asset with procedural fallback) ───────────────
// Drop a tileable facade at public/assets/textures3d/facade.png (e.g. generated
// with Higgsfield) and every extruded building picks it up automatically.
let facadeLoaded: THREE.Texture | null = null;
let facadeTried = false;
const facadeWaiters: THREE.MeshToonMaterial[] = [];

function proceduralFacade(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#f2ede4'; ctx.fillRect(0, 0, 96, 96);
  ctx.fillStyle = '#d8d2c6'; ctx.fillRect(0, 88, 96, 8);         // base course
  for (let ry = 0; ry < 2; ry++) {
    for (let rx = 0; rx < 2; rx++) {
      const x = 14 + rx * 44, y = 14 + ry * 38;
      ctx.fillStyle = '#5f7f9f'; ctx.fillRect(x - 2, y - 2, 28, 26);
      ctx.fillStyle = '#bcd8ee'; ctx.fillRect(x, y, 24, 22);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(x + 2, y + 2, 8, 18);
    }
  }
  return c;
}

function facadeMaterial(tint: number, repX: number, repY: number): THREE.MeshToonMaterial {
  const base = new THREE.CanvasTexture(proceduralFacade());
  base.colorSpace = THREE.SRGBColorSpace;
  base.wrapS = base.wrapT = THREE.RepeatWrapping;
  base.repeat.set(repX, repY);
  const mat = new THREE.MeshToonMaterial({ map: base, color: tint, gradientMap: toonRamp() });
  if (facadeLoaded) {
    swapFacade(mat, facadeLoaded);
  } else {
    facadeWaiters.push(mat);
    if (!facadeTried) {
      facadeTried = true;
      new THREE.TextureLoader().load(
        'assets/textures3d/facade.png',
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          facadeLoaded = t;
          for (const w of facadeWaiters) swapFacade(w, t);
          facadeWaiters.length = 0;
        },
        undefined,
        () => { facadeWaiters.length = 0; },     // keep procedural fallback
      );
    }
  }
  return mat;
}

function swapFacade(mat: THREE.MeshToonMaterial, tex: THREE.Texture): void {
  const rep = mat.map ? mat.map.repeat.clone() : new THREE.Vector2(1, 1);
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.copy(rep);
  t.needsUpdate = true;
  mat.map = t;
  mat.needsUpdate = true;
}

// ── Roof texture (generated asset; falls back to the painted footprint) ─────
let roofLoaded: THREE.Texture | null = null;
let roofTried = false;
const roofWaiters: { mat: THREE.MeshBasicMaterial; w: number; d: number }[] = [];

function roofMaterial(
  groundTex: THREE.Texture,
  b: { x: number; z: number; w: number; d: number },
  cols: number, rows: number,
): THREE.MeshBasicMaterial {
  // Default: the building's own painted footprint (keeps the original design).
  const crop = groundTex.clone();
  crop.repeat.set(b.w / cols, b.d / rows);
  crop.offset.set(b.x / cols, (rows - (b.z + b.d)) / rows);
  crop.needsUpdate = true;
  // Unlit for the same reason as the ground: the roof IS the original painting.
  const mat = new THREE.MeshBasicMaterial({ map: crop });

  if (roofLoaded) {
    applyRoof(mat, roofLoaded, b.w, b.d);
  } else {
    roofWaiters.push({ mat, w: b.w, d: b.d });
    if (!roofTried) {
      roofTried = true;
      new THREE.TextureLoader().load(
        'assets/textures3d/roof.png',
        (t) => {
          t.colorSpace = THREE.SRGBColorSpace;
          roofLoaded = t;
          for (const w of roofWaiters) applyRoof(w.mat, t, w.w, w.d);
          roofWaiters.length = 0;
        },
        undefined,
        () => { roofWaiters.length = 0; },
      );
    }
  }
  return mat;
}

function applyRoof(mat: THREE.MeshBasicMaterial, tex: THREE.Texture, w: number, d: number): void {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(Math.max(1, Math.round(w / 3)), Math.max(1, Math.round(d / 3)));
  t.needsUpdate = true;
  mat.map = t;
  mat.needsUpdate = true;
}

function classify(hsl: HSL, snowy: boolean, variance = 0, cavey = false): Cell {
  const { h, s, l } = hsl;
  if (l < 0.10) return 'wall-high';                                   // cave walls / voids
  // In a cave/mine the entire floor is dark brown/grey, so the dark low-sat
  // buckets below would extrude the whole walkable floor into a field of low
  // walls that swallow the player. There, only the very darkest tiles are true
  // walls (caught by wall-high above); everything mid-dark is floor.
  const caveFloor = cavey && l >= 0.18;
  // Blue-roofed buildings would read as water, so only calm (low-detail) blue
  // counts as a water surface — window grids and roof tiling are busy.
  // (l ≥ 0.32: dark navy building roofs must not read as water)
  if (h >= 185 && h <= 255 && s > 0.28 && l >= 0.32 && l < 0.75 && variance < 420) return 'water';
  if (h >= 60 && h <= 170) {                                          // green family
    if (l < 0.26) return snowy ? 'pine' : 'tree';
    if (s > 0.42 && l < 0.46) return 'grass';
    return 'flat';
  }
  if (h >= 25 && h <= 55 && s > 0.55 && l > 0.52 && l < 0.78) return 'flower'; // warm blossom tones (wood floors are duller)
  if (s < 0.22 && l >= 0.10 && l < 0.34) return caveFloor ? 'flat' : 'wall-low';  // dark grey rock walls
  if (s < 0.25 && l >= 0.34 && l < 0.52) return 'rock';               // mid grey — boulders
  if (h >= 15 && h <= 45 && s > 0.18 && s < 0.5 && l < 0.42) return caveFloor ? 'flat' : 'wall-low'; // brown cliffs
  return 'flat';
}

/** Target 3D height (world units) for a building on a `w`×`d`-tile plot. Bigger
 *  plots get taller buildings so a landmark GLB fills its footprint instead of
 *  sitting as a small box on a large lot (e.g. the palace / gym / dept store). */
function plotHeight(w: number, d: number): number {
  return Math.max(2.0, Math.min(10, 1.2 + Math.sqrt(w * d) * 0.72));
}

/**
 * Build terrain from the painted world canvas.
 * `worldW/worldH` are the world's pixel dimensions (from camera bounds).
 * `interior` suppresses outdoor-only props (flowers/tall grass) on indoor floors.
 */
export function buildTerrain(
  ground: HTMLCanvasElement, worldW: number, worldH: number, interior = false,
  tileMap: number[][] | null = null,
  knownPlots: { x: number; y: number; w: number; h: number; model?: string }[] = [],
  sceneKey = '',
  // When set, only footprints the scene explicitly named (knownPlots with a
  // `model`) are built as 3D volumes — every other detected building is left as
  // clean ground (its flat 2D art still gets erased). Declutters towns whose
  // generic residential blocks looked like stray brick boxes in 3D.
  onlyNamedBuildings = false,
  // Vehicles the scene pins to an exact tile (e.g. the express bus at its stop),
  // placed with a specific model instead of the random road scatter.
  placedVehicles: { x: number; y: number; model: string; rot?: number }[] = [],
  // Mixed scenes (an outdoor route with a cave section) that aren't dark enough
  // to auto-detect as a cave, but whose dark walkable floor must NOT extrude
  // into walls that bury the player, set this. Only the classifier's cave-floor
  // rule is affected — lighting stays daylight.
  caveFloorHint = false,
  // Suppress the random road-scatter of vehicles (buses) — for scenes like the
  // coastal Route 4 whose flat road tiles otherwise sprout buses.
  noVehicles = false,
  // Place free CC0 city-building GLBs (KayKit, tagged 'cityfree' in props.json)
  // on every detected building that has no named model, instead of the
  // procedural facade — for towns we haven't authored custom models for.
  freeBuildings = false,
): TerrainResult {
  const group = new THREE.Group();
  const cols = Math.max(1, Math.round(worldW / PX));
  const rows = Math.max(1, Math.round(worldH / PX));

  // ── Ground plane with the painted map ──
  const tex = new THREE.CanvasTexture(ground);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  // Unlit: the painted map must read EXACTLY as the 2D game authored it —
  // toon shading multiplies dark palettes (basalt Jeju, caves) into black.
  const groundMat = new THREE.MeshBasicMaterial({ map: tex });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(cols, rows), groundMat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(cols / 2, 0, rows / 2);
  group.add(plane);

  // Skirt below the map edge so the world reads like a floating diorama slab.
  const skirtMat = new THREE.MeshToonMaterial({ color: 0x6b5a44, gradientMap: toonRamp() });
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(cols, 1.6, rows), skirtMat);
  skirt.position.set(cols / 2, -0.82, rows / 2);
  group.add(skirt);

  // ── Sample average color per tile ──
  const sctx = ground.getContext('2d', { willReadFrequently: true })!;
  const sx = ground.width / cols, sy = ground.height / rows;
  let img: Uint8ClampedArray;
  try { img = sctx.getImageData(0, 0, ground.width, ground.height).data; }
  catch { img = new Uint8ClampedArray(4); }
  const gw = ground.width;

  const avg = (c: number, r: number): [number, number, number, number] => {
    let rr = 0, gg = 0, bb = 0, n = 0;
    let sr = 0, sg = 0, sb = 0;
    const x0 = Math.floor(c * sx), y0 = Math.floor(r * sy);
    const x1 = Math.min(ground.width, Math.floor((c + 1) * sx)), y1 = Math.min(ground.height, Math.floor((r + 1) * sy));
    const step = Math.max(1, Math.floor((x1 - x0) / 4));
    for (let y = y0; y < y1; y += step) {
      for (let x = x0; x < x1; x += step) {
        const i = (y * gw + x) * 4;
        if (img[i + 3] < 10) continue;
        rr += img[i]; gg += img[i + 1]; bb += img[i + 2]; n++;
        sr += img[i] * img[i]; sg += img[i + 1] * img[i + 1]; sb += img[i + 2] * img[i + 2];
      }
    }
    if (!n) return [0, 0, 0, 0];
    const mr = rr / n, mg = gg / n, mb = bb / n;
    const variance = (sr / n - mr * mr + sg / n - mg * mg + sb / n - mb * mb) / 3;
    return [mr, mg, mb, variance];
  };

  // Snow detection: overall very light, low-sat map → use pines + snow env.
  let lightCells = 0, darkCells = 0, vividCells = 0, total = 0;
  const cellColors: [number, number, number][] = new Array(cols * rows);
  const cellVar = new Float32Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const [mr, mg, mb, variance] = avg(c, r);
      cellColors[r * cols + c] = [mr, mg, mb];
      cellVar[r * cols + c] = variance;
      const hsl = rgbToHsl(mr, mg, mb);
      total++;
      if (hsl.l > 0.78 && hsl.s < 0.3) lightCells++;
      if (hsl.l < 0.16) darkCells++;
      if (hsl.s > 0.35 && hsl.l > 0.25) vividCells++;
    }
  }
  const snowy = lightCells / total > 0.4;
  const caveNamed = /cave|mine|vent|cavern|tunnel|grotto|hideout|ruins/i.test(sceneKey);
  const cavey = caveNamed
    ? darkCells / total > 0.3
    : darkCells / total > 0.45 && vividCells / total < 0.02;   // dark-toned outdoor towns (basalt Jeju: vivid≈5%) stay daylight; true caves have almost no vivid color
  const env: EnvProfile = cavey ? 'cave' : snowy ? 'snow' : 'day';
  // The cave-floor rule (don't extrude dark walkable floor) applies to real dark
  // caves AND to mixed scenes that ask for it via caveFloorHint — without
  // turning the whole scene's lighting to cave mode.
  const classifyCavey = cavey || caveFloorHint;

  // ── Classify + spawn ──
  const cells: Cell[] = new Array(cols * rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const [rr, gg, bb] = cellColors[i];
      cells[i] = classify(rgbToHsl(rr, gg, bb), snowy, cellVar[i], classifyCavey);
    }
  }

  // ── Building detection (exterior scenes) ──
  // Painted building footprints are busy (window grids, roof tiling) — high
  // per-cell color variance — while roads/grass/water paint flat. Contiguous
  // high-variance regions of walkable-classified cells become extruded
  // buildings: facade walls + the original painted footprint as the roof.
  const buildings: { x: number; z: number; w: number; d: number; tint: number; model?: string }[] = [];

  // Authoritative plots first: scenes that know their building rectangles
  // (e.g. a LOCATIONS table) publish them via `scene.buildingPlots`, so
  // landmark buildings like gyms never depend on color heuristics.
  if (!interior) {
    for (const p of knownPlots) {
      if (p.w < 1 || p.h < 1 || p.x < 0 || p.y < 0 || p.x + p.w > cols || p.y + p.h > rows) continue;
      let mr = 0, mg = 0, mb = 0, n = 0;
      for (let zz = p.y; zz < p.y + p.h; zz++) {
        for (let xx = p.x; xx < p.x + p.w; xx++) {
          const cc = cellColors[zz * cols + xx];
          mr += cc[0]; mg += cc[1]; mb += cc[2]; n++;
          cells[zz * cols + xx] = 'building';
        }
      }
      const tint = new THREE.Color(mr / n / 255, mg / n / 255, mb / n / 255)
        .lerp(new THREE.Color(0xffffff), 0.45).getHex();
      buildings.push({ x: p.x, z: p.y, w: p.w, d: p.h, tint, model: p.model });
    }
  }

  // Preferred path: the scene's own tile grid. Buildings are rectangular blocks
  // of a dedicated tile id, so components of the discrete grid identify plots
  // exactly — far more reliable than reading the painted pixels.
  const usedTileMap = !interior && !!tileMap && tileMap.length === rows && (tileMap[0]?.length ?? 0) === cols;
  if (usedTileMap && tileMap) {
    const freq = new Map<number, number>();
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const t = tileMap[r][c];
      freq.set(t, (freq.get(t) ?? 0) + 1);
    }
    const seen = new Uint8Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (seen[idx]) continue;
        if (cells[idx] === 'building') { seen[idx] = 1; continue; }   // claimed by a known plot
        const id = tileMap[r][c];
        // Skip terrain classes we already render (ground, water, foliage) and
        // any tile that unambiguously blankets the map (roads, grass, pavement).
        const cell = cells[idx];
        if (cell === 'water' || cell === 'tree' || cell === 'pine' || cell === 'grass' || cell === 'flower') continue;
        // Only skip tiles that cover a huge share of the map outright — several
        // buildings sharing one tile id (a dense town) can legitimately total
        // ~15-20% of tiles, so the real road/plaza vs building distinction is
        // made per-connected-component below (a road is one sprawling blob; a
        // building is a compact rectangle), not by this coarse total.
        if ((freq.get(id) ?? 0) > cols * rows * 0.34) continue;
        const queue = [idx];
        const comp: number[] = [];
        seen[idx] = 1;
        while (queue.length) {
          const i2 = queue.pop()!;
          comp.push(i2);
          const cx = i2 % cols, cz = (i2 / cols) | 0;
          for (const [nx, nz] of [[cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]] as const) {
            if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
            const ni = nz * cols + nx;
            if (!seen[ni] && tileMap[nz][nx] === id && cells[ni] !== 'building') { seen[ni] = 1; queue.push(ni); }
          }
        }
        if (comp.length < 6) continue;
        // A single connected blob covering a big slice of the map is ground
        // (a plaza, a road network, a courtyard) — not a building footprint.
        if (comp.length > cols * rows * 0.10) continue;
        let x0 = cols, z0 = rows, x1 = -1, z1 = -1;
        for (const i2 of comp) {
          const cx = i2 % cols, cz = (i2 / cols) | 0;
          if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
          if (cz < z0) z0 = cz; if (cz > z1) z1 = cz;
        }
        const bw = x1 - x0 + 1, bd = z1 - z0 + 1;
        if (bw < 2 || bd < 2 || bw > 26 || bd > 26) continue;
        if (comp.length / (bw * bd) < 0.75) continue;          // must be a solid block
        // Rock outcrops and cliff blocks on wild routes form solid tile
        // rectangles too — but they paint in wall/rock tones. That's terrain,
        // not architecture: leave them to the cliff extruder.
        let wallish = 0;
        for (const i2 of comp) {
          const cl = cells[i2];
          if (cl === 'wall-low' || cl === 'wall-high' || cl === 'rock') wallish++;
        }
        if (wallish / comp.length >= 0.78) continue;   // grey-roofed houses stay; pure rock goes
        let mr = 0, mg = 0, mb = 0;
        for (const i2 of comp) { const cc = cellColors[i2]; mr += cc[0]; mg += cc[1]; mb += cc[2]; }
        const n = comp.length;
        // Tiny 3×2 patches (flowerbeds, planters) aren't buildings — real
        // structures in this game are at least 3×3.
        if (comp.length < 9 || bw < 3 || bd < 3) continue;
        const tint = new THREE.Color(mr / n / 255, mg / n / 255, mb / n / 255)
          .lerp(new THREE.Color(0xffffff), 0.45).getHex();
        for (let zz = z0; zz <= z1; zz++) {
          for (let xx = x0; xx <= x1; xx++) cells[zz * cols + xx] = 'building';
        }
        buildings.push({ x: x0, z: z0, w: bw, d: bd, tint });
      }
    }
  }

  // Second pass: buildings painted as scene overlays never reach the tile grid,
  // so also scan the artwork for busy blocks that aren't already plots.
  // OPT-IN: only where there is evidence of a town (authoritative plots or
  // tile-grid buildings) — wild routes' busy mountain/cave shading otherwise
  // sprouts phantom buildings all over the field.
  const urbanEvidence = knownPlots.length > 0 || buildings.length >= 2;
  if (!interior && !cavey && urbanEvidence) {
    // Seeds: busy cells (window grids, roof tiling, signage) sitting on
    // otherwise walkable ground.
    const cand = new Uint8Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      const cell = cells[i];
      if ((cell === 'flat' || cell === 'rock') && cellVar[i] > 620) cand[i] = 1;
    }
    const seen = new Uint8Array(cols * rows);
    const colorDist = (a: [number, number, number], b: [number, number, number]) =>
      Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        if (!cand[idx] || seen[idx]) continue;
        // BFS over seed cells first…
        const queue = [idx];
        const comp: number[] = [];
        seen[idx] = 1;
        while (queue.length) {
          const i2 = queue.pop()!;
          comp.push(i2);
          const cx = i2 % cols, cz = (i2 / cols) | 0;
          for (const [nx, nz] of [[cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]] as const) {
            if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
            const ni = nz * cols + nx;
            if (cand[ni] && !seen[ni]) { seen[ni] = 1; queue.push(ni); }
          }
        }

        // …then grow into the building's uniform wall interior: neighbouring
        // cells whose colour matches the component's average. Without this a
        // facade is detected only where its windows are, splitting one
        // building into thin strips.
        let ar = 0, ag = 0, ab = 0;
        for (const i2 of comp) { const cc = cellColors[i2]; ar += cc[0]; ag += cc[1]; ab += cc[2]; }
        const mean: [number, number, number] = [ar / comp.length, ag / comp.length, ab / comp.length];
        const grow = [...comp];
        let guard = 0;
        while (grow.length && guard++ < 4000) {
          const i2 = grow.pop()!;
          const cx = i2 % cols, cz = (i2 / cols) | 0;
          for (const [nx, nz] of [[cx + 1, cz], [cx - 1, cz], [cx, cz + 1], [cx, cz - 1]] as const) {
            if (nx < 0 || nz < 0 || nx >= cols || nz >= rows) continue;
            const ni = nz * cols + nx;
            if (seen[ni]) continue;
            const cell = cells[ni];
            if (cell !== 'flat' && cell !== 'rock') continue;
            if (colorDist(cellColors[ni], mean) > 70) continue;
            seen[ni] = 1;
            comp.push(ni);
            grow.push(ni);
          }
        }
        // bbox + fill gate
        let x0 = cols, z0 = rows, x1 = -1, z1 = -1;
        for (const i2 of comp) {
          const cx = i2 % cols, cz = (i2 / cols) | 0;
          if (cx < x0) x0 = cx; if (cx > x1) x1 = cx;
          if (cz < z0) z0 = cz; if (cz > z1) z1 = cz;
        }
        const bw = x1 - x0 + 1, bd = z1 - z0 + 1;
        if (bw >= 3 && bd >= 3 && bw <= 24 && bd <= 24 && comp.length / (bw * bd) >= 0.5) {
          let mr = 0, mg = 0, mb = 0;
          for (const i2 of comp) { const cc = cellColors[i2]; mr += cc[0]; mg += cc[1]; mb += cc[2]; }
          const n = comp.length;
          const tint = new THREE.Color(mr / n / 255, mg / n / 255, mb / n / 255)
            .lerp(new THREE.Color(0xffffff), 0.45).getHex();
          for (let zz = z0; zz <= z1; zz++) {
            for (let xx = x0; xx <= x1; xx++) cells[zz * cols + xx] = 'building';
          }
          buildings.push({ x: x0, z: z0, w: bw, d: bd, tint });
        }
      }
    }
  }

  // ── Erase the flat 2D building art under every plot ──
  // The painted map bakes buildings (walls, roofs, windows) into the ground.
  // Once a plot becomes a real 3D volume, that flat artwork would still show
  // around/through it, so we repaint each footprint with the ground tone
  // sampled just outside it (pavement/plaza), padded upward to also wipe the
  // roof art that overhangs the footprint in the 2D projection.
  if (buildings.length) {
    const gctx = ground.getContext('2d');
    if (gctx) {
      const sampleGround = (b: { x: number; z: number; w: number; d: number }): string => {
        const cands: [number, number][] = [];
        for (let k = 1; k <= 3; k++) {
          cands.push([b.x - k, b.z + b.d + k], [b.x + b.w + k, b.z + b.d + k],
                     [b.x + (b.w >> 1), b.z + b.d + k], [b.x - k, b.z + (b.d >> 1)]);
        }
        for (const [cx, cz] of cands) {
          if (cx < 0 || cz < 0 || cx >= cols || cz >= rows) continue;
          if (cells[cz * cols + cx] === 'building') continue;
          const [r0, g0, b0] = cellColors[cz * cols + cx];
          return `rgb(${Math.round(r0)},${Math.round(g0)},${Math.round(b0)})`;
        }
        return '#9a9484';
      };
      for (const b of buildings) {
        const fillStyle = sampleGround(b);
        const padTop = 2.2;                       // 2D roofs overhang upward
        const x0 = b.x * sx, y0 = Math.max(0, (b.z - padTop) * sy);
        const w0 = b.w * sx, h0 = (b.d + padTop) * sy;
        gctx.fillStyle = fillStyle;
        gctx.fillRect(x0, y0, w0, h0);
      }
      tex.needsUpdate = true;
    }
  }

  // Suppress overlapping plots — known plots come first, so heuristic
  // re-detections of the same building (or fragments inside it) are dropped.
  {
    const kept: typeof buildings = [];
    for (const b of buildings) {
      let overlapped = false;
      for (const k of kept) {
        const ix = Math.max(0, Math.min(b.x + b.w, k.x + k.w) - Math.max(b.x, k.x));
        const iz = Math.max(0, Math.min(b.z + b.d, k.z + k.d) - Math.max(b.z, k.z));
        if ((ix * iz) / (b.w * b.d) > 0.35) { overlapped = true; break; }
      }
      if (!overlapped) kept.push(b);
    }
    buildings.length = 0;
    buildings.push(...kept);
  }

  let nTree = 0, nGrass = 0, nFlower = 0, nRock = 0;
  for (let i = 0; i < cols * rows; i++) {
    const cell = cells[i];
    if (cell === 'tree' || cell === 'pine') nTree++;
    else if (cell === 'grass') nGrass++;
    else if (cell === 'flower') nFlower++;
    else if (cell === 'rock') nRock++;
  }

  const trees: InstancedProp = snowy ? makePines(nTree + 8) : makeTrees(nTree + 8);
  const grass = makeGrassTufts(nGrass * 2 + 8);
  const flowers = makeFlowers(nFlower * 2 + 8);
  const rocks = makeRocks(nRock + 8);
  const walls = new WallBuilder();
  const waterRects: { x: number; z: number; w: number; d: number }[] = [];

  const rnd = mulberry(12345);

  // Merge horizontal runs of wall cells into single blocks; place props per cell.
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      const cell = cells[r * cols + c];
      if (cell === 'wall-high' || cell === 'wall-low') {
        let run = c;
        const kind = cell;
        while (run < cols && cells[r * cols + run] === kind) run++;
        const [rr, gg, bb] = cellColors[r * cols + ((c + run - 1) >> 1)];
        const color = (Math.round(rr) << 16) | (Math.round(gg) << 8) | Math.round(bb);
        const isEdge = r === 0 || r === rows - 1 || c === 0 || run === cols;
        let h = kind === 'wall-high' ? (isEdge ? 2.6 : 2.0) : 1.25;
        // Inside rooms and caves a static, angled camera can't see over tall
        // walls, so the player vanishes behind them. Keep interior/cave walls
        // low (a diorama look) so the character is always visible.
        if (interior || classifyCavey) h = Math.min(h, isEdge ? 1.0 : 0.7);
        walls.add(c, r, run, r + 1, h, color === 0 ? 0x1c1a24 : color);
        c = run;
        continue;
      }
      if (cell === 'water') {
        let run = c;
        while (run < cols && cells[r * cols + run] === 'water') run++;
        waterRects.push({ x: c, z: r, w: run - c, d: 1 });
        c = run;
        continue;
      }
      const cx = c + 0.5, cz = r + 0.5;
      switch (cell) {
        case 'tree': case 'pine':
          if (interior) break;
          trees.place(cx + (rnd() - 0.5) * 0.3, cz + (rnd() - 0.5) * 0.3, 0.85 + rnd() * 0.45, rnd() * Math.PI * 2);
          break;
        case 'grass':
          if (interior) break;
          grass.place(cx + (rnd() - 0.5) * 0.5, cz + (rnd() - 0.5) * 0.5, 0.8 + rnd() * 0.5, rnd() * Math.PI);
          if (rnd() > 0.55) grass.place(cx + (rnd() - 0.5) * 0.6, cz + (rnd() - 0.5) * 0.6, 0.7 + rnd() * 0.4, rnd() * Math.PI);
          break;
        case 'flower':
          if (interior) break;
          flowers.place(cx + (rnd() - 0.5) * 0.5, cz + (rnd() - 0.5) * 0.5, 0.8 + rnd() * 0.5, rnd() * Math.PI);
          break;
        case 'rock': {
          // Boulders only in real rocky AREAS — thin grey strips (curbs, road
          // edges) share the color but have few same-class neighbors. Wide grey
          // roads DO have many neighbors, so also require the cell to carry
          // genuine surface texture: painted asphalt is a flat single colour
          // (near-zero variance) while real rock artwork is speckled/rough.
          // This keeps gravel off city roads (e.g. 소올/Capitol) everywhere.
          let rockNeighbors = 0;
          for (let dz = -1; dz <= 1; dz++) {
            for (let dxx = -1; dxx <= 1; dxx++) {
              if (!dxx && !dz) continue;
              const nx = c + dxx, nz = r + dz;
              if (nx >= 0 && nz >= 0 && nx < cols && nz < rows && cells[nz * cols + nx] === 'rock') rockNeighbors++;
            }
          }
          const rough = cellVar[r * cols + c] > 300;
          if (!interior && rough && rockNeighbors >= 4 && rnd() > 0.72) {
            rocks.place(cx + (rnd() - 0.5) * 0.4, cz + (rnd() - 0.5) * 0.4, 0.7 + rnd() * 0.6, rnd() * Math.PI * 2);
          }
          break;
        }
        default: break;
      }
      c++;
    }
  }

  trees.finalize(); grass.finalize(); flowers.finalize(); rocks.finalize();
  for (const p of [...trees.meshes, ...grass.meshes, ...flowers.meshes, ...rocks.meshes]) group.add(p);
  const wallMesh = walls.build();
  if (wallMesh) group.add(wallMesh);

  // ── Buildings ──
  // If generated building models are available they're placed on the detected
  // plots (deterministically chosen, fitted to the footprint); otherwise the
  // engine extrudes facade+roof volumes from the original painted art.
  primeProps();
  const blockers: { node: THREE.Object3D; r: number; fade: number }[] = [];
  const pendingProps: { group: THREE.Group; def: import('./PropModels').PropDef; b: typeof buildings[number]; h: number; wait: number; rot?: number }[] = [];

  /** Facade+roof volume built from the original painted art (always available). */
  const extrudeBuilding = (b: typeof buildings[number], into: THREE.Object3D, local = false) => {
    const h = plotHeight(b.w, b.d);
    const floors = Math.max(1, Math.round(h / 1.15));
    const cx = local ? 0 : b.x + b.w / 2, cz = local ? 0 : b.z + b.d / 2;
    const wallMat = facadeMaterial(b.tint, Math.max(1, Math.round((b.w + b.d) / 2 * 0.8)), floors);
    const wallsBox = new THREE.Mesh(new THREE.BoxGeometry(b.w, h, b.d), wallMat);
    wallsBox.position.set(cx, h / 2, cz);
    into.add(wallsBox);
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(b.w + 0.16, b.d + 0.16), roofMaterial(tex, b, cols, rows));
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(cx, h + 0.02, cz);
    into.add(roof);
    const eave = new THREE.Mesh(
      new THREE.BoxGeometry(b.w + 0.2, 0.09, b.d + 0.2),
      new THREE.MeshToonMaterial({ color: 0x4a4038, gradientMap: toonRamp() }),
    );
    eave.position.set(cx, h - 0.04, cz);
    into.add(eave);
  };

  // Generic building GLBs (house/hanok/…) were being stamped onto EVERY detected
  // footprint, so the same one or two models blanketed every town — hanok and
  // plain houses everywhere. Until per-city, purpose-built models exist (and a
  // way to match them to the right footprint, e.g. a red-roofed Pokémon Center),
  // the default is the procedural facade+roof extruded straight from each
  // scene's own painted art, which keeps every city looking like itself. Flip
  // USE_GENERIC_BUILDING_GLBS back on once tagged per-building models land.
  // Generic building GLBs (house/hanok/…) were being stamped onto EVERY detected
  // footprint, so the same one or two models blanketed every town. So a footprint
  // only gets a GLB when the SCENE names a specific model for it (b.model — e.g.
  // Waterfall City's home / rival / lab / Pokémon Center published via
  // scene.buildingPlots). Every other footprint falls back to the procedural
  // facade+roof extruded straight from that scene's own painted art, so each
  // city keeps looking like itself.
  const cityfreeDefs = freeBuildings ? propsFor('building').filter(d => d.tags?.includes('cityfree')) : [];
  for (const b of buildings) {
    const def = b.model ? propById(b.model) : null;
    if (def) {
      const holder = new THREE.Group();
      holder.position.set(b.x + b.w / 2, 0, b.z + b.d / 2);
      group.add(holder);
      const h = plotHeight(b.w, b.d);
      // Named landmark buildings face the street (door side toward +z / camera)
      // rather than a random hash rotation.
      pendingProps.push({ group: holder, def, b, h, wait: 0, rot: 0 });
      blockers.push({ node: holder, r: Math.max(b.w, b.d) / 2 + 0.6, fade: 0 });
      continue;
    }
    // Scene wants only its named landmarks in 3D — the footprint's flat art was
    // already erased above, so skipping it leaves clean ground, not a brick box.
    if (onlyNamedBuildings) continue;
    // Towns without authored models can opt into free CC0 city buildings: pick
    // one deterministically per footprint (so it's varied but stable).
    if (freeBuildings) {
      const fdef = pickProp(cityfreeDefs, b.x * 31 + b.z * 17);
      if (fdef) {
        const holder = new THREE.Group();
        holder.position.set(b.x + b.w / 2, 0, b.z + b.d / 2);
        group.add(holder);
        pendingProps.push({ group: holder, def: fdef, b, h: plotHeight(b.w, b.d), wait: 0 });
        blockers.push({ node: holder, r: Math.max(b.w, b.d) / 2 + 0.6, fade: 0 });
        continue;
      }
    }
    const bg = new THREE.Group();
    bg.position.set(b.x + b.w / 2, 0, b.z + b.d / 2);
    group.add(bg);
    extrudeBuilding(b, bg, true);
    blockers.push({ node: bg, r: Math.max(b.w, b.d) / 2 + 0.6, fade: 0 });
  }

  // ── Vehicles parked along the roads (generated models only) ────────────────
  let lastT = -1;                       // for real-time deltas in update()
  const pendingVehicles: { group: THREE.Group; def: import('./PropModels').PropDef; scale: number; rot: number }[] = [];
  if (!interior && !noVehicles && placedVehicles.length) {
    // The scene pins its vehicles (e.g. the Kaesong express bus at its stop) —
    // place those exact models and skip the random road scatter entirely.
    for (const v of placedVehicles) {
      const def = propById(v.model);
      if (!def) continue;
      const holder = new THREE.Group();
      holder.position.set(v.x + 0.5, 0, v.y + 0.5);
      group.add(holder);
      pendingVehicles.push({ group: holder, def, scale: 1.3, rot: v.rot ?? 0 });
    }
  } else if (!interior && !noVehicles && hasProps('vehicle')) {
    const vehicleDefs = propsFor('vehicle');
    // A road cell is grey/flat with a long horizontal or vertical run — pick a
    // few well-spaced spots on wide roads so buses sit sensibly on the asphalt.
    const spots: { x: number; z: number; horiz: boolean }[] = [];
    const isRoadish = (c: number, r: number) => {
      if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
      if (cells[r * cols + c] !== 'flat') return false;
      const hsl = rgbToHsl(...cellColors[r * cols + c]);
      // Real asphalt is a mid-grey; the lower bound is raised so a dark cave
      // floor (kept walkable via caveFloorHint) is never mistaken for a road —
      // otherwise buses spawned inside Route 1's cave.
      return hsl.s < 0.18 && hsl.l > 0.32 && hsl.l < 0.55;
    };
    for (let r = 2; r < rows - 2 && spots.length < 6; r += 3) {
      for (let c = 2; c < cols - 2 && spots.length < 6; c += 3) {
        if (!isRoadish(c, r)) continue;
        const horiz = isRoadish(c - 1, r) && isRoadish(c + 1, r) && isRoadish(c + 2, r);
        const vert = isRoadish(c, r - 1) && isRoadish(c, r + 1) && isRoadish(c, r + 2);
        if (!horiz && !vert) continue;
        if (spots.some(s => Math.abs(s.x - c) < 8 && Math.abs(s.z - r) < 8)) continue;
        spots.push({ x: c, z: r, horiz });
      }
    }
    for (const [i, s] of spots.entries()) {
      const def = pickProp(vehicleDefs, i * 5 + s.x)!;
      const holder = new THREE.Group();
      holder.position.set(s.x + 0.5, 0, s.z + 0.5);
      group.add(holder);
      pendingVehicles.push({ group: holder, def, scale: 1.1, rot: s.horiz ? Math.PI / 2 : 0 });
    }
  }

  // Merge water rows into one animated sheet spanning their bounding box each row-run.
  const waters: { mesh: THREE.Mesh; update(t: number): void }[] = [];
  for (const wr of waterRects) {
    const w = makeWater(wr.w, wr.d);
    w.mesh.position.set(wr.x + wr.w / 2, 0.06, wr.z + wr.d / 2);
    group.add(w.mesh);
    waters.push(w);
  }

  return {
    group, env, cols, rows,
    plots: buildings.map(b => ({ x: b.x, z: b.z, w: b.w, d: b.d })),
    blockers,
    envStats: { dark: darkCells / total, vivid: vividCells / total, light: lightCells / total },
    update(t: number) {
      const dt = lastT < 0 ? 0 : Math.max(0, Math.min(0.5, t - lastT));
      lastT = t;
      for (const w of waters) w.update(t);

      // Generated building/vehicle models stream in asynchronously — attach and
      // fit each one to its plot as soon as its GLB finishes loading.
      for (let i = pendingProps.length - 1; i >= 0; i--) {
        const p = pendingProps[i];
        const model = getProp(p.def);
        if (!model) {
          // If the generated model can't be fetched (offline / bad URL), fall
          // back to the painted-art extrusion so the city is never empty.
          p.wait += dt;
          if (propFailed(p.def) || p.wait > 2.5) {
            extrudeBuilding(p.b, p.group, true);
            pendingProps.splice(i, 1);
          }
          continue;
        }
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        box.getSize(size);
        // Model is 1 unit tall; scale so its footprint fills the plot without
        // overflowing, then let height follow (capped to the plot-derived h).
        const fit = Math.min(
          p.b.w / Math.max(0.001, size.x),
          p.b.d / Math.max(0.001, size.z),
          p.h,
        );
        model.scale.multiplyScalar(fit);
        model.rotation.y = p.rot ?? ((p.b.x * 7 + p.b.z * 13) % 4) * (Math.PI / 2);
        p.group.add(model);
        pendingProps.splice(i, 1);
      }
      for (let i = pendingVehicles.length - 1; i >= 0; i--) {
        const v = pendingVehicles[i];
        const model = getProp(v.def);
        if (!model) continue;
        model.scale.multiplyScalar(v.scale);
        model.rotation.y = v.rot;
        v.group.add(model);
        pendingVehicles.splice(i, 1);
      }
    },
  };
}

/** Small deterministic PRNG so prop placement is stable between rebuilds. */
function mulberry(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
