import * as THREE from 'three';

// ── Procedural prop library ──────────────────────────────────────────────────
// Low-poly trees, rocks, grass tufts, flowers, water and wall blocks in a soft
// toon style. Everything is built from primitives at runtime — no asset files.

let gradientMap: THREE.DataTexture | null = null;

/** Five-step pastel ramp. The extra mid-tones keep curved silhouettes readable
 * without the hard cubic bands that made the procedural world feel voxelled. */
export function toonRamp(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([
    82, 82, 88, 255,
    132, 132, 138, 255,
    180, 180, 184, 255,
    221, 221, 224, 255,
    255, 255, 255, 255,
  ]);
  gradientMap = new THREE.DataTexture(data, 5, 1, THREE.RGBAFormat);
  gradientMap.magFilter = THREE.LinearFilter;
  gradientMap.minFilter = THREE.LinearFilter;
  gradientMap.needsUpdate = true;
  return gradientMap;
}

export function toonMat(color: number, opts: { transparent?: boolean; opacity?: number } = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color, gradientMap: toonRamp(),
    transparent: !!opts.transparent, opacity: opts.opacity ?? 1,
  });
}

// ── Blob shadow (shared geometry+material, cloned cheaply) ──────────────────
let blobGeo: THREE.CircleGeometry | null = null;
let blobMat: THREE.MeshBasicMaterial | null = null;

export function makeBlobShadow(radius: number): THREE.Mesh {
  if (!blobGeo) blobGeo = new THREE.CircleGeometry(1, 20);
  if (!blobMat) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(20,24,40,0.42)');
    g.addColorStop(1, 'rgba(20,24,40,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    blobMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
  }
  const m = new THREE.Mesh(blobGeo, blobMat);
  // Geometry/material (and its texture) are intentionally shared by every
  // character. Scene cleanup must not dispose them out from under the next map.
  m.userData.sharedGeo = true;
  m.userData.sharedMat = true;
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(radius);
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}

// ── Trees ───────────────────────────────────────────────────────────────────
export interface InstancedProp {
  meshes: THREE.InstancedMesh[];
  /** Original transforms, shared by every mesh part of an instance. */
  placements: ReadonlyArray<{ x: number; z: number; s: number; rot: number }>;
  /** Place one instance; call finalize() when done. */
  place(x: number, z: number, s: number, rot: number): void;
  /** Tilt one placed instance around its rooted position (used by grass rustle). */
  setSway(index: number, pitch: number, roll: number): void;
  /** Upload changed instance matrices after a batch of setSway calls. */
  commit(): void;
  finalize(): void;
  count: number;
}

interface InstancedPart {
  geo: THREE.BufferGeometry;
  mat: THREE.Material;
  y: number;
  /** Local offsets/scale let organic props use clustered silhouettes while
   * retaining the single instanced draw call per component. */
  x?: number;
  z?: number;
  scale?: number;
}

function makeInstanced(parts: InstancedPart[], max: number): InstancedProp {
  const meshes = parts.map(p => {
    const im = new THREE.InstancedMesh(p.geo, p.mat, max);
    im.count = 0;
    im.frustumCulled = false;
    return im;
  });
  const dummy = new THREE.Object3D();
  const placements: { x: number; z: number; s: number; rot: number }[] = [];
  let n = 0;
  const writeTransform = (index: number, pitch = 0, roll = 0) => {
    const p = placements[index];
    if (!p) return;
    for (let i = 0; i < meshes.length; i++) {
      const part = parts[i];
      const lx = (part.x ?? 0) * p.s, lz = (part.z ?? 0) * p.s;
      const sin = Math.sin(p.rot), cos = Math.cos(p.rot);
      dummy.position.set(
        p.x + lx * cos + lz * sin,
        part.y * p.s,
        p.z - lx * sin + lz * cos,
      );
      dummy.scale.setScalar(p.s * (part.scale ?? 1));
      dummy.rotation.set(pitch, p.rot, roll);
      dummy.updateMatrix();
      meshes[i].setMatrixAt(index, dummy.matrix);
    }
  };
  return {
    meshes,
    placements,
    count: 0,
    place(x, z, s, rot) {
      if (n >= max) return;
      placements.push({ x, z, s, rot });
      writeTransform(n);
      n++;
      this.count = n;
    },
    setSway(index, pitch, roll) { writeTransform(index, pitch, roll); },
    commit() { for (const m of meshes) m.instanceMatrix.needsUpdate = true; },
    finalize() {
      for (const m of meshes) { m.count = n; m.instanceMatrix.needsUpdate = true; }
    },
  };
}

/** Round leafy tree (temperate zones). */
export function makeTrees(max: number, canopy = 0x3f9e3a, trunk = 0x6d4c33): InstancedProp {
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.15, 0.7, 10);
  const rootGeo = new THREE.CylinderGeometry(0.17, 0.22, 0.12, 10);
  const crown = new THREE.DodecahedronGeometry(0.46, 1); crown.scale(1, 0.82, 1);
  const puff = new THREE.DodecahedronGeometry(0.34, 1); puff.scale(1, 0.86, 1);
  const highlight = mixColor(canopy, 0xffffdc, 0.22);
  const shade = mixColor(canopy, 0x183d22, 0.24);
  return makeInstanced([
    { geo: rootGeo, mat: toonMat(mixColor(trunk, 0x3c2418, 0.22)), y: 0.06 },
    { geo: trunkGeo, mat: toonMat(trunk), y: 0.36 },
    { geo: crown, mat: toonMat(shade), y: 0.93, scale: 1.12 },
    { geo: puff, mat: toonMat(canopy), y: 1.12, x: -0.3, z: 0.02 },
    { geo: puff, mat: toonMat(canopy), y: 1.1, x: 0.3, z: 0.05, scale: 0.94 },
    { geo: puff, mat: toonMat(mixColor(canopy, 0xffffff, 0.08)), y: 1.12, z: -0.28, scale: 0.9 },
    { geo: puff, mat: toonMat(highlight), y: 1.38, x: 0.03, z: -0.02, scale: 0.86 },
  ], max);
}

/** Conifer (snow / highland zones) — snow-laden: each green tier carries a thin
 *  white snow cap and a bright snow crown, so the pines read as snow-covered
 *  evergreens (Samho / Baekdu highlands). */
export function makePines(max: number, needles = 0x2e6b46, trunk = 0x5a4030): InstancedProp {
  const trunkGeo = new THREE.CylinderGeometry(0.07, 0.13, 0.62, 10);
  const c1 = new THREE.ConeGeometry(0.58, 0.82, 12);
  const c2 = new THREE.ConeGeometry(0.44, 0.76, 12);
  const c3 = new THREE.ConeGeometry(0.3, 0.64, 12);
  // Flatter white caps sitting on each tier's shoulders like settled snow.
  const s1 = new THREE.ConeGeometry(0.6, 0.24, 12);
  const s2 = new THREE.ConeGeometry(0.46, 0.22, 12);
  const s3 = new THREE.ConeGeometry(0.32, 0.2, 12);
  const snowMat = () => toonMat(0xf4f8ff);
  return makeInstanced([
    { geo: trunkGeo, mat: toonMat(trunk), y: 0.25 },
    { geo: c1, mat: toonMat(needles), y: 0.75 },
    { geo: s1, mat: snowMat(), y: 0.99 },
    { geo: c2, mat: toonMat(mixColor(needles, 0xffffff, 0.10)), y: 1.25 },
    { geo: s2, mat: snowMat(), y: 1.46 },
    { geo: c3, mat: toonMat(mixColor(needles, 0xffffff, 0.22)), y: 1.7 },
    { geo: s3, mat: snowMat(), y: 1.88 },
  ], max);
}

/** Rocks / boulders. */
export function makeRocks(max: number, color = 0x8d8578): InstancedProp {
  const g = new THREE.IcosahedronGeometry(0.34, 1);
  g.scale(1.3, 0.72, 1.02);
  const cap = new THREE.DodecahedronGeometry(0.18, 0);
  cap.scale(1.25, 0.45, 0.9);
  return makeInstanced([
    { geo: g, mat: toonMat(color), y: 0.22 },
    { geo: cap, mat: toonMat(mixColor(color, 0xffffff, 0.18)), y: 0.39, x: -0.07, z: -0.02 },
  ], max);
}

/** Tall-grass tufts, Pokémon-style: a dense rounded bush of bright blades on
 *  three crossed alpha planes, with a darker base and lighter sun-lit tips. */
export function makeGrassTufts(max: number, tone = 0x49b23a, snowy = false): InstancedProp {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 56;
  const ctx = c.getContext('2d')!;
  const base = new THREE.Color(tone);
  const dark = base.clone().multiplyScalar(0.62);
  const tip  = base.clone().lerp(new THREE.Color(0xffffff), snowy ? 0.72 : 0.35);
  const rgb = (col: THREE.Color) => `rgb(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0})`;
  // Base mound so the clump reads as a solid tuft, not floating blades.
  ctx.fillStyle = rgb(dark);
  ctx.beginPath(); ctx.ellipse(32, 52, 26, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Dense blades fanning up into a rounded bush; back rows darker, front brighter.
  const blade = (x: number, topY: number, sway: number, w: number, shade: THREE.Color) => {
    ctx.strokeStyle = rgb(shade); ctx.lineWidth = w; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, 54);
    ctx.quadraticCurveTo(x + sway * 0.5, (54 + topY) / 2, x + sway, topY); ctx.stroke();
  };
  const snowTips: [number, number, number][] = [];
  for (let i = 0; i < 22; i++) {
    const t = i / 21;                          // 0..1 across the clump
    const x = 8 + t * 48 + (i % 2) * 2;
    const front = i % 3 === 0;                 // front blades brighter + taller
    const topY = 6 + Math.abs(t - 0.5) * 26 + (front ? -4 : 4);   // rounded top
    const sway = (i % 2 ? 1 : -1) * (5 + (i % 4) * 3);
    blade(x, topY, sway, front ? 4.2 : 3.4, front ? tip.clone().lerp(base, 0.4) : (i % 2 ? base : dark.clone().lerp(base, 0.5)));
    if (snowy && (front || i % 4 === 1)) snowTips.push([x + sway, topY + 1, front ? 3.4 : 2.6]);
  }
  if (snowy) {
    // Snow catches on blade tips and settles in a thin bank around the roots.
    ctx.fillStyle = 'rgba(247,252,255,0.94)';
    for (const [x, y, r] of snowTips) {
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(238,247,252,0.88)';
    ctx.beginPath(); ctx.ellipse(32, 51, 24, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.28, side: THREE.DoubleSide });
  const p1 = new THREE.PlaneGeometry(1.15, 1.0);
  const p2 = p1.clone(); p2.rotateY(Math.PI / 3);
  const p3 = p1.clone(); p3.rotateY(-Math.PI / 3);
  return makeInstanced([
    { geo: p1, mat, y: 0.48 },
    { geo: p2, mat, y: 0.48 },
    { geo: p3, mat, y: 0.48 },
  ], max);
}

/** Flower patches: small colored dots on crossed planes. */
export function makeFlowers(max: number, petal = 0xe8b64a): InstancedProp {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d')!;
  const col = new THREE.Color(petal);
  ctx.strokeStyle = '#3f7d2f'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    const x = 5 + i * 7;
    ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x + 2, 18); ctx.stroke();
    ctx.fillStyle = `rgb(${(col.r * 255) | 0},${(col.g * 255) | 0},${(col.b * 255) | 0})`;
    ctx.beginPath(); ctx.arc(x + 2, 15, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff7dd';
    ctx.beginPath(); ctx.arc(x + 2, 15, 1.7, 0, Math.PI * 2); ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
  const p1 = new THREE.PlaneGeometry(0.6, 0.5);
  const p2 = p1.clone(); p2.rotateY(Math.PI / 2);
  return makeInstanced([{ geo: p1, mat, y: 0.24 }, { geo: p2, mat, y: 0.24 }], max);
}

export function mixColor(a: number, b: number, t: number): number {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return ca.lerp(cb, t).getHex();
}

// ── Placed decorative props (single 3D objects pinned to a tile) ─────────────

/** The single four-storey 노스단 headquarters from the original 2D facade.
 *  It deliberately remains one uninterrupted building volume: dark inset
 *  walls, four bands of red windows, a central crimson gate and the two long
 *  faction banners are lifted directly from the painted version. */
export function makeNosdanHQ(width: number, depth: number): THREE.Group {
  const g = new THREE.Group();
  const height = Math.max(5.2, Math.min(7.2, width * 0.36));
  const frontZ = depth / 2;

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    toonMat(0x22222e),
  );
  body.position.y = height / 2;
  g.add(body);

  // Slightly raised front panel reproduces the lighter inset rectangle in the
  // 2D building while giving the facade real depth.
  const inset = new THREE.Mesh(
    new THREE.BoxGeometry(width - 0.48, height - 0.38, 0.16),
    toonMat(0x303040),
  );
  inset.position.set(0, height / 2 - 0.02, frontZ + 0.09);
  g.add(inset);

  // Four floors, separated by the same dark horizontal storey lines.
  const floorH = height / 4;
  for (let floor = 1; floor < 4; floor++) {
    const band = new THREE.Mesh(
      new THREE.BoxGeometry(width - 0.42, 0.1, 0.22),
      toonMat(0x14141c),
    );
    band.position.set(0, floor * floorH, frontZ + 0.19);
    g.add(band);
  }

  // Three red-lit windows on every floor, matching the original sprite.
  const glow = new THREE.MeshBasicMaterial({ color: 0xff5a6a });
  const windowW = Math.min(1.18, width * 0.075);
  const windowH = Math.min(0.52, floorH * 0.38);
  for (let floor = 0; floor < 4; floor++) {
    const y = floor * floorH + floorH * 0.62;
    for (const x of [-width * 0.2, 0, width * 0.2]) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(windowW, windowH, 0.12), glow);
      win.position.set(x, y, frontZ + 0.23);
      g.add(win);
      const sill = new THREE.Mesh(new THREE.BoxGeometry(windowW + 0.16, 0.08, 0.18), toonMat(0x161620));
      sill.position.set(x, y - windowH / 2 - 0.07, frontZ + 0.24);
      g.add(sill);
    }
  }

  // Central entrance aligned with the map's single walkable gate tile.
  const doorW = Math.min(2.0, width * 0.15);
  const doorH = Math.min(2.1, height * 0.34);
  const gate = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.22), toonMat(0x5a1024));
  gate.position.set(0, doorH / 2, frontZ + 0.25);
  g.add(gate);
  const gateInset = new THREE.Mesh(new THREE.BoxGeometry(doorW - 0.26, doorH - 0.22, 0.1), toonMat(0x8a1a34));
  gateInset.position.set(0, doorH / 2, frontZ + 0.39);
  g.add(gateInset);

  // The two crimson vertical banners and gold round emblems are the strongest
  // identifying marks in the existing 2D art.
  for (const x of [-width * 0.42, width * 0.42]) {
    const bannerH = height - 0.58;
    const banner = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(0.36, width * 0.035), bannerH, 0.1),
      toonMat(0x8a1020),
    );
    banner.position.set(x, height / 2, frontZ + 0.27);
    g.add(banner);
    const emblem = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 16), toonMat(0xffd24a));
    emblem.rotation.x = Math.PI / 2;
    emblem.position.set(x, height / 2, frontZ + 0.36);
    g.add(emblem);
  }

  // One flat roof and parapet complete the single-building silhouette.
  const roof = new THREE.Mesh(new THREE.BoxGeometry(width + 0.32, 0.22, depth + 0.32), toonMat(0x111119));
  roof.position.y = height + 0.11;
  g.add(roof);
  const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.18, 0.18, depth + 0.18), toonMat(0x171720));
  base.position.y = 0.09;
  g.add(base);

  return g;
}

/** Snow-dusted alpine pine: a trunk under three stacked needle tiers, each
 *  capped with a little snow cone — a true 3D version of the town's 2D pines. */
export function makePineTree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 0.5, 6), toonMat(0x5a4030));
  trunk.position.y = 0.25;
  g.add(trunk);
  const needles = 0x2e6b46;
  for (const [r, h, y] of [[0.55, 0.7, 0.7], [0.42, 0.6, 1.0], [0.28, 0.5, 1.3]] as [number, number, number][]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), toonMat(needles));
    cone.position.y = y;
    g.add(cone);
    const snow = new THREE.Mesh(new THREE.ConeGeometry(r * 0.86, h * 0.34, 7), toonMat(0xffffff));
    snow.position.y = y + h * 0.33;
    g.add(snow);
  }
  return g;
}

/** Korean stone lantern (석등): a stacked stone post topped by a warm glowing
 *  light box under a hip roof — the light uses an unlit bright material so it
 *  reads as lit without a per-lantern point light (mobile-friendly). */
export function makeStoneLantern(): THREE.Group {
  const g = new THREE.Group();
  const stone = 0x9a978f, dark = 0x7a776f;
  const add = (mesh: THREE.Mesh, y: number) => { mesh.position.y = y; g.add(mesh); };
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.16, 6), toonMat(dark)), 0.08);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.5, 6), toonMat(stone)), 0.42);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.17, 0.08, 6), toonMat(dark)), 0.71);
  // Glowing light chamber.
  add(new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), new THREE.MeshBasicMaterial({ color: 0xffd680 })), 0.9);
  add(new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.22, 6), toonMat(stone)), 1.14);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), toonMat(dark)), 1.29);
  return g;
}

/** A straight run of railway track (gravel bed + wooden sleepers + two steel
 *  rails) `len` world-units long, laid along the X axis and centred on origin.
 *  Low profile so it never blocks the player. */
export function makeRailTrack(len: number): THREE.Group {
  const g = new THREE.Group();
  const bed = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.92), toonMat(0x6b6560));
  bed.position.y = 0.04;
  g.add(bed);
  const nTies = Math.max(2, Math.round(len / 0.5));
  for (let i = 0; i < nTies; i++) {
    const x = -len / 2 + (i + 0.5) * (len / nTies);
    const tie = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.82), toonMat(0x5a4433));
    tie.position.set(x, 0.1, 0);
    g.add(tie);
  }
  for (const z of [-0.28, 0.28]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.06), toonMat(0x9098a0));
    rail.position.set(0, 0.16, z);
    g.add(rail);
  }
  return g;
}

/** Translucent ice sculpture on a pedestal: stacked ice-blue snow-figure
 *  spheres crowned by a faceted crystal — the 3D take on the town's snow
 *  sculptures / Ice Bell landmarks. */
export function makeIceStatue(): THREE.Group {
  const g = new THREE.Group();
  const ice = toonMat(0xbfeaff, { transparent: true, opacity: 0.72 });
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 0.3, 8), toonMat(0x9fbfd6));
  ped.position.y = 0.15;
  g.add(ped);
  const b1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), ice); b1.position.y = 0.72; g.add(b1);
  const b2 = new THREE.Mesh(new THREE.SphereGeometry(0.36, 10, 8), ice); b2.position.y = 1.36; g.add(b2);
  const crown = new THREE.Mesh(new THREE.OctahedronGeometry(0.3), ice);
  crown.position.y = 1.9; crown.rotation.y = 0.5;
  g.add(crown);
  return g;
}

/** Traditional Korean 옹기 pottery jar — glossy dark-clay body with a narrow
 *  mouth and rolled rim, a wide-bellied fermenting urn. */
export function makePot(): THREE.Group {
  const g = new THREE.Group();
  const clay = 0x4a3324, glaze = 0x6a4a34;
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 9), toonMat(glaze));
  body.scale.set(1, 1.12, 1); body.position.y = 0.36;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.08, 12), toonMat(clay));
  foot.position.y = 0.04;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.24, 0.13, 12), toonMat(glaze));
  neck.position.y = 0.66;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.045, 6, 14), toonMat(clay));
  rim.rotation.x = Math.PI / 2; rim.position.y = 0.72;
  g.add(foot, body, neck, rim);
  return g;
}

/** Street lamp: a slim post with a warm glowing lantern head (unlit bright
 *  material so it reads as lit without a per-lamp light — mobile-friendly). */
export function makeStreetlamp(): THREE.Group {
  const g = new THREE.Group();
  const metal = 0x3a3a42;
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.16, 8), toonMat(metal));
  base.position.y = 0.08;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.6, 8), toonMat(metal));
  post.position.y = 0.9;
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.28, 6), toonMat(metal));
  arm.rotation.z = Math.PI / 2; arm.position.set(0, 1.7, 0);
  // Warm glowing lamp head.
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.24, 0.2), new THREE.MeshBasicMaterial({ color: 0xffe6a0 }));
  glass.position.y = 1.62;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 6), toonMat(metal));
  cap.position.y = 1.8;
  g.add(base, post, arm, glass, cap);
  return g;
}

/** Wooden mine cart heaped with ore, on four steel wheels. */
export function makeMineCart(): THREE.Group {
  const g = new THREE.Group();
  const wood = 0x6a4a2a, metal = 0x39332f, ore = 0x5a5262;
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.34, 0.42), toonMat(wood));
  body.position.y = 0.34;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.06, 0.46), toonMat(metal));
  rim.position.y = 0.5;
  const heap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), toonMat(ore));
  heap.scale.set(1.2, 0.6, 0.85); heap.position.y = 0.54;
  for (const [x, z] of [[-0.22, -0.17], [0.22, -0.17], [-0.22, 0.17], [0.22, 0.17]] as [number, number][]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 10), toonMat(metal));
    w.rotation.x = Math.PI / 2; w.position.set(x, 0.1, z); g.add(w);
  }
  g.add(body, rim, heap);
  return g;
}

/** Cherry-blossom tree — a trunk under two soft pink canopy puffs. */
export function makeCherryTree(): THREE.Group {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 0.62, 6), toonMat(0x6d4c33));
  trunk.position.y = 0.31;
  const blossom = 0xffb7d5;
  const lo = new THREE.Mesh(new THREE.SphereGeometry(0.56, 8, 6), toonMat(blossom));
  lo.scale.set(1, 0.85, 1); lo.position.y = 0.98;
  const hi = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 6), toonMat(mixColor(blossom, 0xffffff, 0.22)));
  hi.position.y = 1.4;
  g.add(trunk, lo, hi);
  return g;
}

/** Open-front market stall: a wooden counter with goods under a striped awning
 *  on two posts — a street vendor / fish-market stand. */
export function makeStall(): THREE.Group {
  const g = new THREE.Group();
  const wood = 0x9a6a3a, awning = 0xd84a3a;
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 0.5), toonMat(wood));
  counter.position.set(0, 0.2, 0.05);
  const goods = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.12, 0.4), toonMat(0x9fd0e6));
  goods.position.set(0, 0.46, 0.05);
  for (const x of [-0.42, 0.42]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.95, 6), toonMat(0x6a4a2a));
    post.position.set(x, 0.55, -0.18); g.add(post);
  }
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.06, 0.56), toonMat(awning));
  roof.position.set(0, 1.0, 0.02); roof.rotation.x = -0.18;
  const trim = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.12, 0.04), toonMat(0xf0f0f0));
  trim.position.set(0, 0.95, 0.28); trim.rotation.x = -0.18;
  g.add(counter, goods, roof, trim);
  return g;
}

/** A vertical cascading waterfall: a tall water sheet with white flow streaks,
 *  a foam pool at the base and a rock ledge at the crest. Built from primitives
 *  (no external asset), so it works offline and reads as falling water. */
export function makeWaterfall(height = 3, width = 1.4): THREE.Group {
  const g = new THREE.Group();
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const ctx = c.getContext('2d')!;
  const grd = ctx.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, '#cdeeff'); grd.addColorStop(0.16, '#5fc8f0'); grd.addColorStop(1, '#2f9fd8');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 64, 128);
  ctx.strokeStyle = 'rgba(255,255,255,0.78)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  for (let i = 0; i < 10; i++) {
    const x = 4 + i * 6 + (i % 2) * 2;
    ctx.beginPath(); ctx.moveTo(x, 0);
    for (let y = 0; y <= 128; y += 8) ctx.lineTo(x + Math.sin(y * 0.11 + i) * 2, y);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const sheetMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.93, side: THREE.DoubleSide });
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(width, height), sheetMat);
  sheet.position.y = height / 2; g.add(sheet);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(width * 1.06, height), sheetMat);
  back.position.set(0, height / 2, -0.07); g.add(back);
  const foam = new THREE.Mesh(new THREE.CircleGeometry(width * 0.72, 16), new THREE.MeshBasicMaterial({ color: 0xeaffff, transparent: true, opacity: 0.85 }));
  foam.rotation.x = -Math.PI / 2; foam.position.y = 0.04; g.add(foam);
  const ledge = new THREE.Mesh(new THREE.BoxGeometry(width * 1.3, 0.3, 0.55), toonMat(0x6a6058));
  ledge.position.y = height + 0.08; g.add(ledge);
  return g;
}

// ── Department-store interior fixtures ─────────────────────────────────────
// These are deliberately procedural: every floor can share a coherent visual
// language without depending on external model downloads, and the 2D fallback
// remains usable when WebGL is unavailable.
export type StoreFixtureKind =
  | 'store-wall' | 'store-counter' | 'store-shelf' | 'store-display'
  | 'store-tmrack' | 'store-table' | 'store-elevator' | 'store-planter'
  | 'store-bench' | 'store-directory' | 'store-sofa' | 'store-vending'
  | 'store-railing';

/** Low-poly fixture sized in world tiles and centred on the origin. */
export function makeStoreFixture(
  kind: StoreFixtureKind,
  width = 1,
  depth = 1,
  color = 0x6a7f9a,
): THREE.Group {
  const g = new THREE.Group();
  const w = Math.max(0.18, width), d = Math.max(0.12, depth);
  const dark = 0x343946, metal = 0xaeb8c4, wood = 0x8b623e;
  const box = (bw: number, bh: number, bd: number, matColor: number, x: number, y: number, z: number) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), toonMat(matColor));
    m.position.set(x, y, z); g.add(m); return m;
  };

  if (kind === 'store-wall') {
    box(w, 1.3, d, color, 0, 0.65, 0);
    box(w, 0.08, d + 0.04, 0xe1c77c, 0, 1.18, 0);
  } else if (kind === 'store-counter') {
    box(w * 0.96, 0.78, d * 0.86, color, 0, 0.39, 0);
    box(w, 0.12, d, 0xe5d4b0, 0, 0.84, 0);
    box(w * 0.78, 0.08, 0.04, dark, 0, 0.48, d * 0.45);
  } else if (kind === 'store-shelf') {
    for (const x of [-w * 0.46, w * 0.46]) box(0.08, 1.45, d * 0.84, dark, x, 0.73, 0);
    for (const y of [0.16, 0.62, 1.08, 1.46]) box(w, 0.08, d * 0.9, color, 0, y, 0);
    const count = Math.max(3, Math.min(10, Math.round(w * 3)));
    const productColors = [0xf26b5b, 0x5ba8e8, 0xf0c44f, 0x70c98b, 0xb787d7];
    for (let i = 0; i < count; i++) {
      const x = -w * 0.42 + (i + 0.5) * (w * 0.84 / count);
      box(Math.max(0.08, w * 0.55 / count), 0.22, d * 0.46, productColors[i % productColors.length], x, 0.31 + (i % 3) * 0.46, 0);
    }
  } else if (kind === 'store-display' || kind === 'store-tmrack') {
    box(w * 0.82, 0.48, d * 0.82, color, 0, 0.24, 0);
    box(w * 0.94, 0.1, d * 0.94, 0xf0dfbd, 0, 0.53, 0);
    if (kind === 'store-tmrack') {
      for (const [x, c] of [[-0.22, 0x55c8ff], [0, 0xffd85a], [0.22, 0xff6cae]] as [number, number][]) {
        const disc = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.035, 6, 14), toonMat(c));
        disc.position.set(x * Math.min(1, w), 0.86, 0); disc.rotation.x = Math.PI / 2.8; g.add(disc);
      }
    } else {
      const gift = new THREE.Mesh(new THREE.DodecahedronGeometry(Math.min(0.3, w * 0.24), 0), toonMat(0xff8ab4));
      gift.position.y = 0.84; gift.rotation.y = 0.45; g.add(gift);
      box(0.06, 0.58, 0.06, 0xf4d04e, 0, 0.86, 0);
    }
  } else if (kind === 'store-table') {
    box(w * 0.72, 0.12, d * 0.72, 0xd8b47a, 0, 0.72, 0);
    box(0.13, 0.68, 0.13, dark, 0, 0.35, 0);
    for (const [x, z] of [[-w * 0.43, 0], [w * 0.43, 0], [0, -d * 0.43], [0, d * 0.43]] as [number, number][]) {
      box(0.34, 0.1, 0.34, color, x, 0.42, z);
      box(0.09, 0.4, 0.09, dark, x, 0.2, z);
    }
  } else if (kind === 'store-elevator') {
    box(w, 2.4, d * 0.34, dark, 0, 1.2, -d * 0.33);
    box(0.16, 2.35, d, metal, -w * 0.45, 1.17, 0);
    box(0.16, 2.35, d, metal, w * 0.45, 1.17, 0);
    box(w, 0.2, d, metal, 0, 2.28, 0);
    box(w * 0.43, 2.0, 0.08, 0x7297b8, -w * 0.22, 1.1, d * 0.42);
    box(w * 0.43, 2.0, 0.08, 0x7297b8, w * 0.22, 1.1, d * 0.42);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffd85a }));
    lamp.position.set(w * 0.38, 1.45, d * 0.5); g.add(lamp);
  } else if (kind === 'store-planter') {
    box(w * 0.94, 0.42, d * 0.94, color, 0, 0.21, 0);
    box(w * 0.82, 0.08, d * 0.82, 0x4a3324, 0, 0.44, 0);
    const n = Math.max(2, Math.round(w * 2));
    for (let i = 0; i < n; i++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 7, 5), toonMat(i % 2 ? 0x4e9b52 : 0x397a45));
      leaf.scale.set(0.8, 1.45, 0.8);
      leaf.position.set(-w * 0.34 + (i + 0.5) * (w * 0.68 / n), 0.75, (i % 2 ? 0.12 : -0.1) * d);
      g.add(leaf);
    }
  } else if (kind === 'store-bench') {
    box(w, 0.12, d * 0.72, wood, 0, 0.48, 0);
    box(w, 0.5, 0.1, color, 0, 0.76, -d * 0.28);
    for (const x of [-w * 0.36, w * 0.36]) box(0.1, 0.48, 0.1, dark, x, 0.24, 0);
  } else if (kind === 'store-directory') {
    box(w * 0.85, 1.35, 0.14, 0x334863, 0, 1.05, 0);
    box(w, 0.12, d * 0.62, metal, 0, 0.08, 0);
    for (let i = 0; i < 6; i++) box(w * 0.62, 0.055, 0.02, i % 2 ? 0xffd76a : 0xcfe8ff, 0, 1.48 - i * 0.18, 0.08);
  } else if (kind === 'store-sofa') {
    box(w, 0.42, d * 0.88, color, 0, 0.31, 0);
    box(w, 0.58, 0.22, color, 0, 0.68, -d * 0.34);
    for (const x of [-w * 0.46, w * 0.46]) box(0.16, 0.42, d, dark, x, 0.42, 0);
  } else if (kind === 'store-vending') {
    box(w * 0.9, 1.72, d * 0.78, color, 0, 0.86, 0);
    box(w * 0.68, 0.82, 0.05, 0xc8efff, 0, 1.12, d * 0.41);
    for (let i = 0; i < 6; i++) box(0.1, 0.18, 0.06, [0x5cc9ff, 0xff6d73, 0xffd04f][i % 3], -0.22 + (i % 3) * 0.22, 1.37 - Math.floor(i / 3) * 0.32, d * 0.46);
    box(w * 0.42, 0.16, 0.05, dark, 0, 0.3, d * 0.42);
  } else if (kind === 'store-railing') {
    box(w, 0.1, Math.max(0.08, d), metal, 0, 0.9, 0);
    const n = Math.max(2, Math.round(w / 0.7));
    for (let i = 0; i <= n; i++) box(0.07, 0.92, Math.max(0.08, d), dark, -w / 2 + i * (w / n), 0.46, 0);
  }
  return g;
}

/** Grey-granite civic obelisk with a stepped base and gold finial. */
export function makeGrandObelisk(): THREE.Group {
  const g = new THREE.Group();
  const granite = toonMat(0x62666f);
  const dark = toonMat(0x454952);
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.22, 0.9), dark);
  base.position.y = 0.11;
  g.add(base);
  const step = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.24, 0.62), granite);
  step.position.y = 0.34;
  g.add(step);
  const shaft = new THREE.Mesh(new THREE.ConeGeometry(0.28, 2.65, 4), granite);
  shaft.position.y = 1.78;
  shaft.rotation.y = Math.PI / 4;
  g.add(shaft);
  const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.17), toonMat(0xd8b44a));
  finial.position.y = 3.22;
  g.add(finial);
  return g;
}

/** Bronze civic figure on a low granite plinth. */
export function makeBronzeStatue(): THREE.Group {
  const g = new THREE.Group();
  const bronze = toonMat(0x98743a);
  const stone = toonMat(0x4b4f58);
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.42, 0.72), stone);
  plinth.position.y = 0.21;
  g.add(plinth);
  const legs = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.24), bronze);
  legs.position.y = 0.78;
  g.add(legs);
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.3), bronze);
  torso.position.y = 1.43;
  g.add(torso);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), bronze);
  head.position.y = 1.96;
  g.add(head);
  for (const side of [-1, 1]) {
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.72, 6), bronze);
    arm.position.set(side * 0.38, 1.5 + (side > 0 ? 0.08 : 0), 0);
    arm.rotation.z = side * (Math.PI / 2.8);
    g.add(arm);
  }
  return g;
}

/** Walk-through ceremonial arch sized for a two-tile avenue. */
export function makeTriumphalArch(): THREE.Group {
  const g = new THREE.Group();
  const stone = toonMat(0x5b5f68);
  const trim = toonMat(0x3f434b);
  for (const x of [-0.78, 0.78]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.62), trim);
    foot.position.set(x, 0.09, 0);
    g.add(foot);
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.36, 2.15, 0.48), stone);
    pillar.position.set(x, 1.17, 0);
    g.add(pillar);
  }
  const beam = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.48, 0.58), stone);
  beam.position.y = 2.28;
  g.add(beam);
  const crown = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.16, 0.7), trim);
  crown.position.y = 2.6;
  g.add(crown);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), toonMat(0xd8b44a));
  star.position.set(0, 2.3, 0.34);
  g.add(star);
  return g;
}

// ── Water surface ───────────────────────────────────────────────────────────
/** Paint one bright-cyan water tile with curved light ribbons and soft glints. */
function paintWaterTile(sparkleSeed: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d')!;
  // Flat vivid cyan base with a soft vertical brighten toward the top-left.
  const grd = ctx.createLinearGradient(0, 0, 128, 128);
  grd.addColorStop(0, '#38c6f4');
  grd.addColorStop(1, '#1ba3e6');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 128, 128);
  // Broad curved ribbons imply a continuous surface instead of pixel chunks.
  ctx.strokeStyle = 'rgba(218,248,255,0.48)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let band = 0; band < 5; band++) {
    const y0 = 16 + band * 24;
    ctx.beginPath();
    for (let x = -8; x <= 136; x += 8) {
      const y = y0 + Math.sin(x * 0.07 + band * 1.7) * 4;
      if (x === -8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // Small highlights keep the surface lively without a pixel-art checker.
  let s = sparkleSeed;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
  ctx.fillStyle = 'rgba(236,252,255,0.86)';
  for (let i = 0; i < 12; i++) {
    const x = Math.floor(rnd() * 120) + 4;
    const y = Math.floor(rnd() * 120) + 4;
    ctx.beginPath(); ctx.ellipse(x, y, 3 + rnd() * 3, 1.2, 0, 0, Math.PI * 2); ctx.fill();
  }
  return c;
}

/** Animated bright-cyan water sheet placed over painted water regions.
 *  Two crossfading sparkle layers drift slowly for a gentle shimmer. */
export function makeWater(width: number, depth: number): { mesh: THREE.Mesh; update(t: number): void } {
  const mkTex = (seed: number) => {
    const t = new THREE.CanvasTexture(paintWaterTile(seed));
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.repeat.set(Math.max(1, width / 3.2), Math.max(1, depth / 3.2));
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const tex = mkTex(0x9e3779b9);
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.94, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  return {
    mesh,
    update(t: number) {
      // Slow drift + a subtle vertical bob so the glints twinkle rather than slide.
      tex.offset.x = t * 0.012;
      tex.offset.y = Math.sin(t * 0.5) * 0.03;
      (mat).opacity = 0.9 + Math.sin(t * 1.3) * 0.05;
    },
  };
}

// ── Merged wall/cliff blocks (vertex-colored) ───────────────────────────────
export class WallBuilder {
  private pos: number[] = [];
  private col: number[] = [];
  private idx: number[] = [];
  private tmp = new THREE.Color();

  /** Add one box spanning tile-space [x0,x1)×[z0,z1) with height h, tinted `color`. */
  add(x0: number, z0: number, x1: number, z1: number, h: number, color: number): void {
    const c = this.tmp.set(color);
    const shade = (f: number) => [c.r * f, c.g * f, c.b * f] as const;
    const top = shade(1.08), bevelTone = shade(0.94), front = shade(0.82), side = shade(0.7);
    const base = () => this.pos.length / 3;
    const quad = (
      pts: number[], rgb: readonly [number, number, number],
    ) => {
      const b = base();
      this.pos.push(...pts);
      for (let i = 0; i < 4; i++) this.col.push(rgb[0], rgb[1], rgb[2]);
      this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    // Chamfered cap: a small sloped shoulder catches the sun and prevents long
    // cliff runs from reading as stacked rectangular blocks.
    const bevel = Math.min(0.14, (x1 - x0) * 0.12, (z1 - z0) * 0.12, h * 0.18);
    const yShoulder = h - bevel;
    const ix0 = x0 + bevel, ix1 = x1 - bevel, iz0 = z0 + bevel, iz1 = z1 - bevel;
    quad([ix0, h, iz0, ix1, h, iz0, ix1, h, iz1, ix0, h, iz1], top);
    quad([x0, yShoulder, z0, x1, yShoulder, z0, ix1, h, iz0, ix0, h, iz0], bevelTone);
    quad([x1, yShoulder, z1, x0, yShoulder, z1, ix0, h, iz1, ix1, h, iz1], bevelTone);
    quad([x0, yShoulder, z1, x0, yShoulder, z0, ix0, h, iz0, ix0, h, iz1], bevelTone);
    quad([x1, yShoulder, z0, x1, yShoulder, z1, ix1, h, iz1, ix1, h, iz0], bevelTone);
    // Vertical faces stop at the shoulder.
    quad([x0, 0, z1, x1, 0, z1, x1, yShoulder, z1, x0, yShoulder, z1], front);
    quad([x1, 0, z0, x0, 0, z0, x0, yShoulder, z0, x1, yShoulder, z0], front);
    quad([x0, 0, z0, x0, 0, z1, x0, yShoulder, z1, x0, yShoulder, z0], side);
    quad([x1, 0, z1, x1, 0, z0, x1, yShoulder, z0, x1, yShoulder, z1], side);
  }

  build(): THREE.Mesh | null {
    if (this.idx.length === 0) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
    g.setIndex(this.idx);
    g.computeVertexNormals();
    const m = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: toonRamp() });
    return new THREE.Mesh(g, m);
  }
}
