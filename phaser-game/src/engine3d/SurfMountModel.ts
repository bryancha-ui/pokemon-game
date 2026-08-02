import * as THREE from 'three';
import { toonMat } from './Props';

// A lightweight Lapras-like Surf mount. It is procedural on purpose: mobile
// devices keep the same readable 3D silhouette without downloading a heavy GLB.
// The shape is a generic water Pokémon rather than a named copyrighted model.

function ellipsoid(w: number, h: number, d: number, color: number, detail = 12): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, detail, Math.max(8, detail - 4)), toonMat(color));
  mesh.scale.set(w, h, d);
  return mesh;
}

function fin(w: number, h: number, d: number, color: number): THREE.Mesh {
  return ellipsoid(w, h, d, color, 8);
}

export interface SurfMountModel {
  group: THREE.Group;
  update(time: number, moving: boolean, dt: number): void;
}

export function buildSurfMountModel(): SurfMountModel {
  const group = new THREE.Group();
  let rideBlend = 0;
  const body = new THREE.Group();
  const blue = toonMat(0x2f78b4);
  const blueLight = toonMat(0x63b8de);
  const shellMat = toonMat(0x8f6f45);

  const hull = ellipsoid(0.95, 0.3, 0.56, 0x2f78b4, 14);
  hull.position.y = 0.27;
  body.add(hull);

  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), shellMat);
  shell.scale.set(1.08, 0.62, 0.42);
  shell.position.set(0, 0.48, -0.04);
  body.add(shell);
  const shellStripe = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.025, 5, 12), blueLight);
  shellStripe.rotation.x = Math.PI / 2;
  shellStripe.position.set(0, 0.5, 0.31);
  shellStripe.scale.set(1.1, 0.75, 1);
  body.add(shellStripe);

  const neck = ellipsoid(0.22, 0.38, 0.22, 0x3a8fc0, 10);
  neck.position.set(0, 0.57, 0.34);
  body.add(neck);
  const head = ellipsoid(0.34, 0.27, 0.36, 0x3a8fc0, 12);
  head.position.set(0, 0.76, 0.48);
  body.add(head);
  const snout = ellipsoid(0.22, 0.11, 0.19, 0x79cbe5, 10);
  snout.position.set(0, 0.7, 0.68);
  body.add(snout);
  for (const x of [-0.11, 0.11]) {
    const eye = ellipsoid(0.045, 0.055, 0.025, 0x101923, 8);
    eye.position.set(x, 0.81, 0.64);
    body.add(eye);
  }
  for (const x of [-0.27, 0.27]) {
    const ear = fin(0.14, 0.2, 0.06, 0x3a8fc0);
    ear.position.set(x, 0.9, 0.4);
    ear.rotation.z = x < 0 ? -0.35 : 0.35;
    body.add(ear);
  }

  const flippers: THREE.Mesh[] = [];
  for (const x of [-0.58, 0.58]) {
    const f = fin(0.42, 0.08, 0.22, 0x3a8fc0);
    f.position.set(x, 0.18, 0.1);
    f.rotation.z = x < 0 ? -0.16 : 0.16;
    body.add(f); flippers.push(f);
  }
  const tail = fin(0.28, 0.11, 0.34, 0x3a8fc0);
  tail.position.set(0, 0.25, -0.56);
  tail.rotation.x = -0.2;
  body.add(tail);

  const foam = new THREE.Mesh(new THREE.TorusGeometry(0.63, 0.035, 6, 24), blueLight);
  foam.rotation.x = Math.PI / 2;
  foam.position.y = 0.09;
  foam.scale.set(1.18, 0.7, 1);
  group.add(foam, body);

  return {
    group,
    update(time: number, moving: boolean, dt: number) {
      // The mount rises through the first wave instead of popping under the
      // rider: this is the visible boarding beat when Surf starts.
      rideBlend = THREE.MathUtils.damp(rideBlend, 1, 7, dt);
      group.position.y = -0.12 + rideBlend * 0.12;
      group.scale.y = 0.78 + rideBlend * 0.22;
      const bob = Math.sin(time * (moving ? 7 : 3.4)) * (moving ? 0.025 : 0.012);
      body.position.y = bob;
      foam.rotation.z += dt * (moving ? 2.8 : 0.7);
      foam.scale.x = 1.18 + Math.sin(time * 4) * 0.035;
      flippers[0].rotation.y = Math.sin(time * 5) * 0.18;
      flippers[1].rotation.y = -Math.sin(time * 5) * 0.18;
      tail.rotation.y = Math.sin(time * 4.5) * 0.16;
    },
  };
}
