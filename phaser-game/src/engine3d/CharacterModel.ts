import * as THREE from 'three';
import { toonMat } from './Props';

// ── Procedural protagonist model ─────────────────────────────────────────────
// A stylized low-poly 3D version of the hero, built from primitives so it
// needs no asset files and stays true to the original design: charcoal school
// blazer with a white collar — the boy with side-parted dark hair, red tie and
// grey trousers; the girl with a hair bun, pink backpack and pleated skirt.
// Limbs are pivoted groups driven by a walk cycle (arm/leg swing + bob), and
// the whole model yaws to face its movement direction.

const SKIN = 0xf0c8a0, HAIR = 0x1a1410, BLAZER = 0x33363e, COLLAR = 0xffffff;
const TROUSER = 0x555560, SKIRT = 0x2e3038, SHOE = 0xffffff, TIE = 0xcc2233;
const BACKPACK = 0xe86fa0;

export interface PlayerModel {
  group: THREE.Group;
  /** phase advances while moving; moving=false eases limbs back to rest. */
  setWalk(phase: number, moving: boolean, dt: number): void;
  /** smoothly turn to face a world-space direction (dx, dz). */
  face(dx: number, dz: number, dt: number): void;
}

function box(w: number, h: number, d: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toonMat(color));
  return m;
}

export function buildPlayerModel(design: 'boy' | 'girl'): PlayerModel {
  const group = new THREE.Group();
  const H = 0.94;                       // total height in world units (≈30px)
  const s = H / 0.94;

  // ── legs (pivot at hip) ──
  const legL = new THREE.Group(), legR = new THREE.Group();
  const legColor = design === 'boy' ? TROUSER : SKIN;
  for (const [leg, off] of [[legL, -0.075], [legR, 0.075]] as [THREE.Group, number][]) {
    const l = box(0.11 * s, 0.34 * s, 0.13 * s, legColor);
    l.position.y = -0.17 * s;
    const shoe = box(0.12 * s, 0.07 * s, 0.17 * s, SHOE);
    shoe.position.set(0, -0.335 * s, 0.02 * s);
    leg.add(l, shoe);
    leg.position.set(off * s, 0.41 * s, 0);
    group.add(leg);
  }

  // ── torso ──
  const torso = new THREE.Group();
  const jacket = box(0.34 * s, 0.34 * s, 0.2 * s, BLAZER);
  jacket.position.y = 0.58 * s;
  torso.add(jacket);
  const collar = box(0.35 * s, 0.055 * s, 0.21 * s, COLLAR);
  collar.position.y = 0.735 * s;
  torso.add(collar);
  if (design === 'boy') {
    const tie = box(0.05 * s, 0.16 * s, 0.02 * s, TIE);
    tie.position.set(0, 0.63 * s, 0.11 * s);
    torso.add(tie);
  } else {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.13 * s, 0.21 * s, 0.14 * s, 8), toonMat(SKIRT));
    skirt.position.y = 0.385 * s;
    torso.add(skirt);
    const pack = box(0.24 * s, 0.26 * s, 0.1 * s, BACKPACK);
    pack.position.set(0, 0.58 * s, -0.16 * s);
    torso.add(pack);
  }
  group.add(torso);

  // ── arms (pivot at shoulder) ──
  const armL = new THREE.Group(), armR = new THREE.Group();
  for (const [arm, off] of [[armL, -0.215], [armR, 0.215]] as [THREE.Group, number][]) {
    const sleeve = box(0.09 * s, 0.24 * s, 0.11 * s, BLAZER);
    sleeve.position.y = -0.1 * s;
    const hand = box(0.08 * s, 0.07 * s, 0.09 * s, SKIN);
    hand.position.y = -0.25 * s;
    arm.add(sleeve, hand);
    arm.position.set(off * s, 0.72 * s, 0);
    group.add(arm);
  }

  // ── head ──
  const head = new THREE.Group();
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.26 * s, 0.24 * s, 0.24 * s, 1, 1, 1), toonMat(SKIN));
  face.position.y = 0.9 * s;
  head.add(face);
  // hair: cap over the top + back
  const hairTop = box(0.28 * s, 0.1 * s, 0.26 * s, HAIR);
  hairTop.position.y = 1.0 * s;
  head.add(hairTop);
  const hairBack = box(0.28 * s, 0.18 * s, 0.08 * s, HAIR);
  hairBack.position.set(0, 0.9 * s, -0.1 * s);
  head.add(hairBack);
  if (design === 'girl') {
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.09 * s, 8, 6), toonMat(HAIR));
    bun.position.set(0, 1.06 * s, -0.06 * s);
    head.add(bun);
  } else {
    const fringe = box(0.28 * s, 0.06 * s, 0.03 * s, HAIR);
    fringe.position.set(0, 0.985 * s, 0.125 * s);
    head.add(fringe);
  }
  // simple eyes so the front reads as a face
  for (const ex of [-0.06, 0.06]) {
    const eye = box(0.035 * s, 0.05 * s, 0.012 * s, 0x22232a);
    eye.position.set(ex * s, 0.89 * s, 0.125 * s);
    head.add(eye);
  }
  group.add(head);

  // state
  let yaw = 0, targetYaw = 0, restEase = 0;

  return {
    group,
    setWalk(phase: number, moving: boolean, dt: number) {
      restEase = THREE.MathUtils.clamp(restEase + (moving ? dt * 8 : -dt * 6), 0, 1);
      const swing = Math.sin(phase) * 0.75 * restEase;
      legL.rotation.x = swing;
      legR.rotation.x = -swing;
      armL.rotation.x = -swing * 0.8;
      armR.rotation.x = swing * 0.8;
      const bob = Math.abs(Math.sin(phase)) * 0.035 * restEase;
      const breathe = moving ? 0 : Math.sin(phase * 0.35) * 0.008;
      group.position.y = bob;
      torso.scale.y = 1 + breathe;
      head.position.y = breathe * 0.5;
    },
    face(dx: number, dz: number, dt: number) {
      if (Math.abs(dx) + Math.abs(dz) > 0.001) {
        targetYaw = Math.atan2(dx, dz);       // model front is +z
      }
      let d = targetYaw - yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      yaw += d * Math.min(1, dt * 12);
      group.rotation.y = yaw;
    },
  };
}
