import * as THREE from 'three';
import { makeBlobShadow, toonMat } from './Props';

/** Live procedural model used by the Scholars' Road badge checkpoint. */
export interface BadgeScannerModel3D {
  group: THREE.Group;
  setClosed(value: number): void;
  setBadgeCount(found: number, total?: number): void;
  update(time: number): void;
}

function mesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  name: string,
): THREE.Mesh {
  const result = new THREE.Mesh(geometry, material);
  result.name = name;
  result.position.set(...position);
  result.castShadow = !material.transparent;
  result.receiveShadow = !material.transparent;
  parent.add(result);
  return result;
}

/**
 * Pokémon-style credential scanner with a stone-road silhouette and a cleaner
 * League-tech core. One local unit is one overworld tile, matching the rest of
 * the procedural environment.
 */
export function buildBadgeScanner3D(): BadgeScannerModel3D {
  const group = new THREE.Group();
  group.name = 'scholars-road-badge-scanner';

  const stone = toonMat(0x5b5145);
  const stoneEdge = toonMat(0x847561);
  const metal = toonMat(0x263542);
  const metalEdge = toonMat(0x4b6573);
  const gold = toonMat(0xd6a83d);
  const stateFrame = toonMat(0x9a3320);
  const screenGlass = new THREE.MeshBasicMaterial({ color: 0x102e3d });

  const pylonX = 1.92;
  for (const side of [-1, 1]) {
    const x = side * pylonX;
    mesh(group, new THREE.BoxGeometry(0.72, 0.18, 0.82), stone, [x, 0.09, 0], 'scanner-plinth');
    mesh(group, new THREE.BoxGeometry(0.58, 1.95, 0.58), stone, [x, 1.08, 0], 'scanner-stone-pylon');
    mesh(group, new THREE.BoxGeometry(0.7, 0.18, 0.7), stoneEdge, [x, 2.03, 0], 'scanner-pylon-cap');
    mesh(group, new THREE.BoxGeometry(0.46, 0.76, 0.16), metal, [x, 1.24, 0.34], 'scanner-console');
    mesh(group, new THREE.BoxGeometry(0.34, 0.45, 0.035), screenGlass, [x, 1.28, 0.435], 'scanner-screen');

    // A Poké Ball-like credential reader faces approaching trainers.
    const reader = mesh(
      group,
      new THREE.TorusGeometry(0.14, 0.035, 8, 20),
      gold,
      [x, 1.28, 0.46],
      'badge-reader-ring',
    );
    reader.scale.y = 0.82;
    mesh(group, new THREE.SphereGeometry(0.055, 12, 8), gold, [x, 1.28, 0.475], 'badge-reader-core');
  }

  // Heavy arch keeps the checkpoint grounded in Scholars' Road's old stonework.
  mesh(group, new THREE.BoxGeometry(4.58, 0.42, 0.66), stone, [0, 2.35, 0], 'scanner-lintel');
  mesh(group, new THREE.BoxGeometry(3.7, 0.26, 0.52), stateFrame, [0, 2.37, 0.35], 'scanner-status-beam');
  mesh(group, new THREE.BoxGeometry(1.2, 0.48, 0.16), metalEdge, [0, 2.69, 0.08], 'scanner-crest');

  // Eight individual lamps make the region-badge requirement legible at a glance.
  const badgeMats: THREE.MeshBasicMaterial[] = [];
  for (let i = 0; i < 8; i++) {
    const material = new THREE.MeshBasicMaterial({ color: 0x27323a });
    badgeMats.push(material);
    const x = (i - 3.5) * 0.135;
    mesh(group, new THREE.SphereGeometry(0.047, 12, 8), material, [x, 2.7, 0.185], `badge-lamp-${i + 1}`);
  }

  const lampMats = [-1, 1].map((side) => {
    const material = new THREE.MeshBasicMaterial({ color: 0xff5a44 });
    mesh(group, new THREE.SphereGeometry(0.11, 14, 10), material, [side * pylonX, 1.78, 0.39], 'scanner-status-lamp');
    return material;
  });

  // The collision remains authoritative in Phaser; this is its animated 3D twin.
  const barrier = new THREE.Group();
  barrier.name = 'badge-energy-barrier';
  group.add(barrier);
  const fieldMat = new THREE.MeshBasicMaterial({
    color: 0xff493a,
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const field = mesh(barrier, new THREE.PlaneGeometry(3.28, 1), fieldMat, [0, 0, 0.03], 'scanner-energy-field');
  const rayMat = new THREE.MeshBasicMaterial({
    color: 0xffbd45,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const rays: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    rays.push(mesh(
      barrier,
      new THREE.BoxGeometry(0.035, 1, 0.04),
      rayMat,
      [-1.42 + i * 0.47, 0, 0.065],
      'scanner-energy-ray',
    ));
  }
  const sweepMat = new THREE.MeshBasicMaterial({
    color: 0xffeea5,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const sweep = mesh(barrier, new THREE.BoxGeometry(3.22, 0.045, 0.06), sweepMat, [0, 0.18, 0.09], 'scanner-sweep-line');

  const shadowLeft = makeBlobShadow(0.54);
  shadowLeft.position.x = -pylonX;
  group.add(shadowLeft);
  const shadowRight = makeBlobShadow(0.54);
  shadowRight.position.x = pylonX;
  group.add(shadowRight);

  const red = new THREE.Color(0x9a3320);
  const green = new THREE.Color(0x2c9b58);
  const redLamp = new THREE.Color(0xff5a44);
  const greenLamp = new THREE.Color(0x74ff9a);
  const badgeOn = new THREE.Color(0x67ddff);
  const badgeOff = new THREE.Color(0x27323a);
  let closed = 1;
  let badgeCount = 0;

  const applyBarrierHeight = () => {
    const height = 1.7 * closed;
    field.visible = closed > 0.015;
    field.scale.y = Math.max(0.001, height);
    field.position.y = 0.12 + height / 2;
    for (const ray of rays) {
      ray.visible = field.visible;
      ray.scale.y = Math.max(0.001, height);
      ray.position.y = 0.12 + height / 2;
    }
    sweep.visible = field.visible;
  };

  const setClosed = (value: number) => {
    closed = THREE.MathUtils.clamp(value, 0, 1);
    stateFrame.color.copy(green).lerp(red, closed);
    for (const material of lampMats) material.color.copy(greenLamp).lerp(redLamp, closed);
    fieldMat.color.copy(greenLamp).lerp(redLamp, Math.min(1, closed * 1.2));
    applyBarrierHeight();
  };

  const setBadgeCount = (found: number, total = 8) => {
    badgeCount = THREE.MathUtils.clamp(Math.round(found), 0, badgeMats.length);
    const required = THREE.MathUtils.clamp(Math.round(total), 1, badgeMats.length);
    for (let i = 0; i < badgeMats.length; i++) {
      if (i >= required) badgeMats[i].color.set(0x151b20);
      else badgeMats[i].color.copy(i < badgeCount ? badgeOn : badgeOff);
    }
  };

  setClosed(1);
  setBadgeCount(0);

  return {
    group,
    setClosed,
    setBadgeCount,
    update(time: number) {
      if (closed <= 0.015) return;
      const pulse = 0.78 + Math.sin(time * 5.2) * 0.18;
      fieldMat.opacity = closed * (0.16 + pulse * 0.1);
      rayMat.opacity = closed * (0.62 + pulse * 0.25);
      sweepMat.opacity = closed * (0.72 + pulse * 0.22);
      const height = 1.7 * closed;
      sweep.position.y = 0.14 + ((time * 0.72) % 1) * Math.max(0.05, height);
      for (let i = 0; i < badgeMats.length; i++) {
        if (i < badgeCount) badgeMats[i].color.copy(badgeOn).multiplyScalar(0.9 + 0.1 * Math.sin(time * 3.4 + i * 0.45));
      }
    },
  };
}
