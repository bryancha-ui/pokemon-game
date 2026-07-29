import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// ── Generated environment prop registry ──────────────────────────────────────
// Buildings, vehicles and other scenery GLBs (generated from prompts / art) are
// listed in `public/assets/models3d/props.json`:
//
//   { "props": [
//       { "id": "house",   "role": "building", "url": "https://…/house.glb" },
//       { "id": "pokecenter", "role": "building", "tags": ["center"], "url": "…" },
//       { "id": "bus",     "role": "vehicle",  "url": "…" }
//   ]}
//
// `role: building` entries are placed on detected building footprints (chosen
// deterministically per footprint so a city looks varied but stable between
// loads); `role: vehicle` entries are parked along road tiles. Entries may use
// a local path instead of a URL — `assets/models3d/<id>.glb` — and
// `scripts/fetch-models.mjs` vendors remote ones for offline play.
//
// With no props.json the engine keeps its procedural extruded buildings.

export interface PropDef {
  id: string;
  role: 'building' | 'vehicle' | 'scenery';
  tags?: string[];
  url?: string;
  /** optional authored scale hint (world units of height) */
  height?: number;
}

let props: PropDef[] | null = null;
let loading = false;
const cache = new Map<string, THREE.Group | 'loading' | 'failed'>();
const loader = new GLTFLoader();

export function primeProps(): void {
  if (props || loading) return;
  loading = true;
  fetch('assets/models3d/props.json')
    .then(r => (r.ok ? r.json() : null))
    .then((j: { props?: PropDef[] } | null) => { props = j?.props ?? []; })
    .catch(() => { props = []; })
    .finally(() => { loading = false; });
}

export function propsFor(role: PropDef['role']): PropDef[] {
  return (props ?? []).filter(p => p.role === role);
}

export function hasProps(role: PropDef['role']): boolean {
  return propsFor(role).length > 0;
}

/** Load (and cache) a prop, normalized to 1 unit tall with feet at y=0. */
export function getProp(def: PropDef): THREE.Group | null {
  const hit = cache.get(def.id);
  if (hit === 'loading' || hit === 'failed') return null;
  if (hit) {
    const c = hit.clone(true);
    c.traverse(o => { o.userData.sharedGeo = true; o.userData.sharedMat = true; });
    return c;
  }
  cache.set(def.id, 'loading');
  loader.load(
    def.url || `assets/models3d/${def.id}.glb`,
    (gltf) => {
      const root = new THREE.Group();
      root.add(gltf.scene);
      const box = new THREE.Box3().setFromObject(root);
      const size = new THREE.Vector3();
      box.getSize(size);
      root.scale.setScalar(1 / Math.max(0.0001, size.y));
      const b2 = new THREE.Box3().setFromObject(root);
      const c = new THREE.Vector3();
      b2.getCenter(c);
      root.position.x -= c.x; root.position.z -= c.z; root.position.y -= b2.min.y;
      cache.set(def.id, root);
    },
    undefined,
    () => { cache.set(def.id, 'failed'); },
  );
  return null;
}

/** True once this prop's GLB is known to be unavailable (bad URL / offline). */
export function propFailed(def: PropDef): boolean {
  return cache.get(def.id) === 'failed';
}

/** Footprint (in tiles) of a normalized prop, used to fit it to a plot. */
export function propFootprint(def: PropDef): { w: number; d: number } | null {
  const hit = cache.get(def.id);
  if (!hit || hit === 'loading' || hit === 'failed') return null;
  const box = new THREE.Box3().setFromObject(hit);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { w: size.x, d: size.z };
}

/** Stable pick so the same plot always gets the same building model. */
export function pickProp(list: PropDef[], seed: number): PropDef | null {
  if (!list.length) return null;
  return list[Math.abs(Math.round(seed)) % list.length];
}

/** Look up a specific prop by id — used to place a named building (a scene's
 *  Pokémon Center / lab / home) on its exact authored footprint. */
export function propById(id: string): PropDef | null {
  return (props ?? []).find(p => p.id === id) ?? null;
}
