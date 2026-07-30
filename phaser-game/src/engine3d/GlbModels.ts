import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

// ── Generated 3D model registry ─────────────────────────────────────────────
// True 3D creature models (generated from the game's own artwork) are listed in
// `public/assets/models3d/manifest.json`. Two entry forms are supported:
//
//   { "models": ["vipour", { "key": "munkain", "url": "https://…/x.glb" }] }
//
//   • plain string  → loads the vendored file  assets/models3d/<key>.glb
//   • {key, url}    → loads the GLB straight from the given URL (e.g. the
//                     generator's CDN), so models work before they're vendored.
//
// Run `node scripts/fetch-models.mjs` to download every remote entry into
// public/assets/models3d/ and rewrite the manifest to local form (offline play).
//
// Battle sprites automatically use a listed model instead of the relief-
// extruded art. A missing manifest quietly disables the feature.

type Entry = string | { key: string; url?: string; rotX?: number; rotY?: number; rotZ?: number; scale?: number };

/** A loaded model plus any animation clips baked into the GLB. */
export interface LoadedModel {
  group: THREE.Group;
  animations: THREE.AnimationClip[];
}

/** Registry value: where to load the GLB and optional orientation/size fixes. */
interface ModelSpec {
  url: string | null;                       // null = vendored local file
  rot?: { x: number; y: number; z: number }; // degrees, baked before normalization
  scale?: number;                           // normalized height (1 = default); <1 shrinks the model
}

let manifest: Map<string, ModelSpec> | null = null;   // key → spec
let manifestLoading = false;
const models = new Map<string, LoadedModel | 'loading' | 'failed'>();
const loader = new GLTFLoader();

/** Phaser texture keys sometimes carry a battle prefix (e.g. "wild-foxgeist"). */
export function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/^(wild|enemy|foe|ally|player)-/, '');
}

export function primeManifest(): void {
  if (manifest || manifestLoading) return;
  manifestLoading = true;
  fetch('assets/models3d/manifest.json')
    .then(r => (r.ok ? r.json() : null))
    .then((j: { models?: Entry[] } | null) => {
      const m = new Map<string, ModelSpec>();
      for (const e of j?.models ?? []) {
        if (typeof e === 'string') m.set(normalizeKey(e), { url: null });
        else if (e && e.key) {
          const rot = (e.rotX || e.rotY || e.rotZ)
            ? { x: e.rotX ?? 0, y: e.rotY ?? 0, z: e.rotZ ?? 0 }
            : undefined;
          m.set(normalizeKey(e.key), { url: e.url ?? null, rot, scale: e.scale });
        }
      }
      manifest = m;
    })
    .catch(() => { manifest = new Map(); })
    .finally(() => { manifestLoading = false; });
}

export function hasModel(key: string): boolean {
  return !!manifest && manifest.has(normalizeKey(key));
}

/**
 * Get a normalized clone of the model for `key` (height 1, feet at y=0)
 * together with its animation clips, or null while it loads / when unavailable.
 */
export function getModel(key: string): LoadedModel | null {
  const k = normalizeKey(key);
  if (!manifest || !manifest.has(k)) return null;
  const spec = manifest.get(k)!;
  const entry = models.get(k);
  if (entry === 'loading' || entry === 'failed') return null;
  if (entry) return cloneNormalized(entry);

  models.set(k, 'loading');
  const url = spec.url || `assets/models3d/${k}.glb`;
  loader.load(
    url,
    (gltf) => {
      // Normalization (height→1, feet at y=0, centered) is baked onto an inner
      // wrapper — NOT the root — because the root's position/rotation/scale are
      // owned and overwritten every frame by CreatureAnimator. Baking it on the
      // root would let the animator wipe it, leaving the model at its raw GLB
      // scale and pivot (→ mis-sized and sunk into the ground).
      const inner = new THREE.Group();
      inner.add(gltf.scene);
      // Per-model orientation fix (manifest rotX/Y/Z degrees) — for models the
      // generator reconstructed lying down or facing the wrong way, applied
      // BEFORE normalize so the height/centering measure the upright pose.
      if (spec.rot) {
        gltf.scene.rotation.set(
          THREE.MathUtils.degToRad(spec.rot.x),
          THREE.MathUtils.degToRad(spec.rot.y),
          THREE.MathUtils.degToRad(spec.rot.z),
        );
      }
      // Per-model size override (manifest `scale`, 1 = normal height). The
      // animator later scales the root to targetH assuming height 1, so baking
      // a <1 factor into the normalized height shrinks the model proportionally.
      normalize(inner, spec.scale ?? 1);
      const root = new THREE.Group();
      root.add(inner);
      models.set(k, { group: root, animations: gltf.animations ?? [] });
    },
    undefined,
    () => { models.set(k, 'failed'); },
  );
  return null;
}

/** Scale so the model is `sizeScale` units tall (default 1) with feet on y=0,
 *  centered. A sizeScale < 1 renders the creature proportionally smaller. */
function normalize(root: THREE.Group, sizeScale = 1): void {
  const box = new THREE.Box3().setFromObject(root);
  const size = new THREE.Vector3();
  box.getSize(size);
  const s = sizeScale / Math.max(0.0001, size.y);
  root.scale.setScalar(s);
  const box2 = new THREE.Box3().setFromObject(root);
  const center = new THREE.Vector3();
  box2.getCenter(center);
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box2.min.y;
}

function cloneNormalized(src: LoadedModel): LoadedModel {
  // SkeletonUtils.clone keeps skinned meshes bound to their own skeleton, so
  // rigged models can animate independently per battler.
  const c = (src.animations.length ? skeletonClone(src.group) : src.group.clone(true)) as THREE.Group;
  c.traverse(o => { o.userData.sharedGeo = true; o.userData.sharedMat = true; });
  return { group: c, animations: src.animations };
}
