import * as THREE from 'three';

// ── Procedural prop library ──────────────────────────────────────────────────
// Low-poly trees, rocks, grass tufts, flowers, water and wall blocks in a soft
// toon style. Everything is built from primitives at runtime — no asset files.

let gradientMap: THREE.DataTexture | null = null;

/** 3-step toon shading ramp shared by all toon materials. */
export function toonRamp(): THREE.DataTexture {
  if (gradientMap) return gradientMap;
  const data = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  gradientMap = new THREE.DataTexture(data, 3, 1, THREE.RGBAFormat);
  gradientMap.magFilter = THREE.NearestFilter;
  gradientMap.minFilter = THREE.NearestFilter;
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
  m.rotation.x = -Math.PI / 2;
  m.scale.setScalar(radius);
  m.position.y = 0.02;
  m.renderOrder = 1;
  return m;
}

// ── Trees ───────────────────────────────────────────────────────────────────
export interface InstancedProp {
  meshes: THREE.InstancedMesh[];
  /** Place one instance; call finalize() when done. */
  place(x: number, z: number, s: number, rot: number): void;
  finalize(): void;
  count: number;
}

function makeInstanced(parts: { geo: THREE.BufferGeometry; mat: THREE.Material; y: number }[], max: number): InstancedProp {
  const meshes = parts.map(p => {
    const im = new THREE.InstancedMesh(p.geo, p.mat, max);
    im.count = 0;
    im.frustumCulled = false;
    return im;
  });
  const dummy = new THREE.Object3D();
  let n = 0;
  return {
    meshes,
    count: 0,
    place(x, z, s, rot) {
      if (n >= max) return;
      for (let i = 0; i < meshes.length; i++) {
        dummy.position.set(x, parts[i].y * s, z);
        dummy.scale.setScalar(s);
        dummy.rotation.set(0, rot, 0);
        dummy.updateMatrix();
        meshes[i].setMatrixAt(n, dummy.matrix);
      }
      n++;
      this.count = n;
    },
    finalize() {
      for (const m of meshes) { m.count = n; m.instanceMatrix.needsUpdate = true; }
    },
  };
}

/** Round leafy tree (temperate zones). */
export function makeTrees(max: number, canopy = 0x3f9e3a, trunk = 0x6d4c33): InstancedProp {
  const trunkGeo = new THREE.CylinderGeometry(0.09, 0.13, 0.55, 6);
  const lo = new THREE.SphereGeometry(0.52, 8, 6); lo.scale(1, 0.82, 1);
  const hi = new THREE.SphereGeometry(0.36, 8, 6); hi.scale(1, 0.9, 1);
  return makeInstanced([
    { geo: trunkGeo, mat: toonMat(trunk), y: 0.28 },
    { geo: lo, mat: toonMat(canopy), y: 0.86 },
    { geo: hi, mat: toonMat(mixColor(canopy, 0xffffff, 0.12)), y: 1.28 },
  ], max);
}

/** Conifer (snow / highland zones). */
export function makePines(max: number, needles = 0x2e6b46, trunk = 0x5a4030): InstancedProp {
  const trunkGeo = new THREE.CylinderGeometry(0.07, 0.11, 0.5, 6);
  const c1 = new THREE.ConeGeometry(0.55, 0.8, 8);
  const c2 = new THREE.ConeGeometry(0.4, 0.7, 8);
  const c3 = new THREE.ConeGeometry(0.26, 0.55, 8);
  return makeInstanced([
    { geo: trunkGeo, mat: toonMat(trunk), y: 0.25 },
    { geo: c1, mat: toonMat(needles), y: 0.75 },
    { geo: c2, mat: toonMat(mixColor(needles, 0xffffff, 0.10)), y: 1.25 },
    { geo: c3, mat: toonMat(mixColor(needles, 0xffffff, 0.22)), y: 1.7 },
  ], max);
}

/** Rocks / boulders. */
export function makeRocks(max: number, color = 0x8d8578): InstancedProp {
  const g = new THREE.IcosahedronGeometry(0.34, 0);
  g.scale(1.25, 0.8, 1);
  return makeInstanced([{ geo: g, mat: toonMat(color), y: 0.22 }], max);
}

/** Tall-grass tufts, Pokémon-style: a dense rounded bush of bright blades on
 *  three crossed alpha planes, with a darker base and lighter sun-lit tips. */
export function makeGrassTufts(max: number, tone = 0x49b23a): InstancedProp {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 56;
  const ctx = c.getContext('2d')!;
  const base = new THREE.Color(tone);
  const dark = base.clone().multiplyScalar(0.62);
  const tip  = base.clone().lerp(new THREE.Color(0xffffff), 0.35);
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
  for (let i = 0; i < 22; i++) {
    const t = i / 21;                          // 0..1 across the clump
    const x = 8 + t * 48 + (i % 2) * 2;
    const front = i % 3 === 0;                 // front blades brighter + taller
    const topY = 6 + Math.abs(t - 0.5) * 26 + (front ? -4 : 4);   // rounded top
    const sway = (i % 2 ? 1 : -1) * (5 + (i % 4) * 3);
    blade(x, topY, sway, front ? 4.2 : 3.4, front ? tip.clone().lerp(base, 0.4) : (i % 2 ? base : dark.clone().lerp(base, 0.5)));
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

// ── Water surface ───────────────────────────────────────────────────────────
/** Animated translucent water sheet placed over painted water regions. */
export function makeWater(width: number, depth: number): { mesh: THREE.Mesh; update(t: number): void } {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = 'rgba(70,150,235,0.55)';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = 'rgba(235,248,255,0.5)';
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    const y = 12 + i * 20;
    for (let x = 0; x <= 128; x += 8) {
      const yy = y + Math.sin((x / 128) * Math.PI * 2 + i) * 3;
      if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(Math.max(1, width / 3), Math.max(1, depth / 3));
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0.8, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = 2;
  return {
    mesh,
    update(t: number) {
      tex.offset.x = t * 0.018;
      tex.offset.y = Math.sin(t * 0.4) * 0.02;
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
    const top = shade(1.0), front = shade(0.8), side = shade(0.66);
    const base = () => this.pos.length / 3;
    const quad = (
      pts: number[], rgb: readonly [number, number, number],
    ) => {
      const b = base();
      this.pos.push(...pts);
      for (let i = 0; i < 4; i++) this.col.push(rgb[0], rgb[1], rgb[2]);
      this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    };
    // top
    quad([x0, h, z0, x1, h, z0, x1, h, z1, x0, h, z1], top);
    // south face (+z, toward camera)
    quad([x0, 0, z1, x1, 0, z1, x1, h, z1, x0, h, z1], front);
    // north face
    quad([x1, 0, z0, x0, 0, z0, x0, h, z0, x1, h, z0], front);
    // west face
    quad([x0, 0, z0, x0, 0, z1, x0, h, z1, x0, h, z0], side);
    // east face
    quad([x1, 0, z1, x1, 0, z0, x1, h, z0, x1, h, z1], side);
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
