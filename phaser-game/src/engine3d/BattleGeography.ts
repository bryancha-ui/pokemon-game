import Phaser from 'phaser';
import * as THREE from 'three';
import { makeGrassTufts, makePines, makeRocks, makeTrees, toonMat, toonRamp } from './Props';
import type { EnvProfile } from './ThreeStage';

type Geography =
  | 'meadow' | 'woodland' | 'forest' | 'gorge' | 'mountain' | 'coast' | 'autumnCoast'
  | 'wetland' | 'ocean' | 'ferry' | 'coldPlateau' | 'snow' | 'snowForest'
  | 'volcano' | 'cave' | 'iceCave' | 'ruins' | 'haunted';

export interface OutdoorBattleTheme {
  geography: Geography;
  environment: EnvProfile;
  center: number;
  middle: number;
  edge: number;
  spot: number;
  rim: number;
  tree: number;
  rock: number;
  accent: number;
}

const THEMES: Record<Geography, OutdoorBattleTheme> = {
  meadow: {
    geography: 'meadow', environment: 'battle',
    center: 0x7fc45e, middle: 0x5ea84b, edge: 0x4c9440, spot: 0xb99761,
    rim: 0x6b5a44, tree: 0x3f9e3a, rock: 0x8d8578, accent: 0xd8efac,
  },
  woodland: {
    geography: 'woodland', environment: 'battle',
    center: 0x6aaa4e, middle: 0x46833c, edge: 0x2d6632, spot: 0xb69d70,
    rim: 0x4f4935, tree: 0x276b38, rock: 0x777267, accent: 0x9edb76,
  },
  forest: {
    geography: 'forest', environment: 'battle',
    center: 0x4e8a42, middle: 0x326c32, edge: 0x184623, spot: 0x86714f,
    rim: 0x3f392d, tree: 0x1f622c, rock: 0x5e6458, accent: 0x66e6c0,
  },
  gorge: {
    geography: 'gorge', environment: 'battle',
    center: 0x7d8d65, middle: 0x777665, edge: 0x5d574d, spot: 0xb9a178,
    rim: 0x514b42, tree: 0x486d3d, rock: 0x756e64, accent: 0x57aee0,
  },
  mountain: {
    geography: 'mountain', environment: 'battle',
    center: 0x8b896a, middle: 0x77735c, edge: 0x5a564b, spot: 0xb9a67f,
    rim: 0x4c473f, tree: 0x345e3b, rock: 0x777064, accent: 0xd8cfb0,
  },
  coast: {
    geography: 'coast', environment: 'battle',
    center: 0xe4d6a3, middle: 0xbfb585, edge: 0x7c895d, spot: 0xd9c58e,
    rim: 0x6f6658, tree: 0x3f7745, rock: 0x80786b, accent: 0x4cb9e8,
  },
  autumnCoast: {
    geography: 'autumnCoast', environment: 'battle',
    center: 0xa58d5d, middle: 0x7f744f, edge: 0x596044, spot: 0xc5ad7a,
    rim: 0x64584a, tree: 0xa74324, rock: 0x7f7568, accent: 0x5eb8df,
  },
  wetland: {
    geography: 'wetland', environment: 'battle',
    center: 0x75a55b, middle: 0x57834e, edge: 0x38634a, spot: 0xa99b6a,
    rim: 0x4b5945, tree: 0x3e7442, rock: 0x707467, accent: 0x55b5d8,
  },
  ocean: {
    geography: 'ocean', environment: 'battle',
    center: 0x4bb9e3, middle: 0x2787c6, edge: 0x185f9a, spot: 0x78c8e6,
    rim: 0x174c78, tree: 0x3f7745, rock: 0x708294, accent: 0xd8f6ff,
  },
  ferry: {
    geography: 'ferry', environment: 'battle',
    center: 0xc39861, middle: 0xa87a48, edge: 0x795331, spot: 0xcda873,
    rim: 0x5d432c, tree: 0x3f7745, rock: 0x707985, accent: 0xbfeaff,
  },
  coldPlateau: {
    geography: 'coldPlateau', environment: 'snow',
    center: 0x91a975, middle: 0x72885f, edge: 0x536954, spot: 0xc5c6aa,
    rim: 0x59615a, tree: 0x365b45, rock: 0x77766f, accent: 0xe8f3f8,
  },
  snow: {
    geography: 'snow', environment: 'snow',
    center: 0xf0f5f8, middle: 0xdbe6ed, edge: 0xb9cbd6, spot: 0xcbd8df,
    rim: 0x73808a, tree: 0x29533d, rock: 0x7b8790, accent: 0x9edcff,
  },
  snowForest: {
    geography: 'snowForest', environment: 'snow',
    center: 0xe6eef2, middle: 0xcbd9de, edge: 0x9fb6ad, spot: 0xc6d5d8,
    rim: 0x66736f, tree: 0x274936, rock: 0x748087, accent: 0xa9ddff,
  },
  volcano: {
    geography: 'volcano', environment: 'cave',
    center: 0x62524b, middle: 0x40343a, edge: 0x241e25, spot: 0x776158,
    rim: 0x211a1d, tree: 0x5d553c, rock: 0x40363a, accent: 0xff5a24,
  },
  cave: {
    geography: 'cave', environment: 'cave',
    center: 0x5d5148, middle: 0x403934, edge: 0x272329, spot: 0x75665a,
    rim: 0x201d22, tree: 0x3a513c, rock: 0x554d48, accent: 0xb29ad0,
  },
  iceCave: {
    geography: 'iceCave', environment: 'cave',
    center: 0xbfe4ef, middle: 0x83b8ce, edge: 0x456d86, spot: 0xd7edf4,
    rim: 0x354f66, tree: 0x315c62, rock: 0x698998, accent: 0xbff4ff,
  },
  ruins: {
    geography: 'ruins', environment: 'battle',
    center: 0x77795d, middle: 0x626650, edge: 0x464a3d, spot: 0x969078,
    rim: 0x4d4941, tree: 0x315b32, rock: 0x666158, accent: 0xc7bda8,
  },
  haunted: {
    geography: 'haunted', environment: 'cave',
    center: 0x51475a, middle: 0x393341, edge: 0x24202c, spot: 0x65556a,
    rim: 0x211d28, tree: 0x314538, rock: 0x554d5d, accent: 0xb78add,
  },
};

const SCENE_GEOGRAPHY: Record<string, Geography> = {
  RouteScene: 'mountain',
  Route2Scene: 'woodland',
  Route3Scene: 'gorge',
  Route4Scene: 'coast',
  Route5Scene: 'forest',
  Route6Scene: 'coast',
  ScholarsRoadScene: 'mountain',
  RyesongValleyScene: 'wetland',
  AhobiryongPassScene: 'mountain',
  ChilboHighlandsScene: 'autumnCoast',
  KaemaPlateauScene: 'coldPlateau',

  BaekduCheckpointScene: 'snow',
  BaekduPassScene: 'snow',
  BaekduSummitScene: 'snow',
  SeoraePassScene: 'snowForest',
  SacredPeakScene: 'snow',
  NorthernReachesScene: 'snowForest',
  SamjiyonAjitRoadScene: 'snowForest',

  SunriseCliff1Scene: 'coast',
  SunriseCliff2Scene: 'coast',
  SunriseCliff3Scene: 'coast',
  SijungCoastScene: 'coast',
  WonsanBeachScene: 'coast',
  NampoBeachScene: 'coast',
  OceanScene: 'ocean',
  FerryScene: 'ferry',

  ForestShrineScene: 'forest',
  JejuVentScene: 'volcano',
  DolmoeMineScene: 'cave',
  HamhungMineScene: 'volcano',
  SinuijuIceCaveScene: 'iceCave',
  DolmoeRuinsScene: 'ruins',
  FogboundManorScene: 'haunted',
  NosdanHideoutScene: 'cave',

  RangrimFoothillsScene: 'mountain',
  RangrimCavernScene: 'cave',
  RangrimAltarScene: 'haunted',
  RangrimSnowfieldScene: 'snow',
  RangrimSummitScene: 'snow',

  // Outdoor city battles still inherit the region visible around the arena.
  KaesongCityScene: 'meadow',
  GeumgangCityScene: 'mountain',
  PyeongyangCityScene: 'meadow',
  NorthernPlazaScene: 'snow',
  NampoCityScene: 'coast',
  WonsanCityScene: 'coast',
  HamhungCityScene: 'mountain',
  ChongjinCityScene: 'autumnCoast',
  SinuijuCityScene: 'snow',
  SamjiyonCityScene: 'snowForest',
};

/** Resolve only locations that launch wild battles or shared trainer battles.
 * Dedicated rival/gym scenes cannot accidentally reuse stale return metadata. */
export function resolveOutdoorBattleTheme(scene: Phaser.Scene): OutdoorBattleTheme | undefined {
  let returnScene = '';
  if (scene.scene.key === 'WildBattleScene') {
    returnScene = String(scene.registry.get('wildReturnScene') ?? '');
  } else if (scene.scene.key === 'TrainerBattleScene') {
    returnScene = String(scene.registry.get('trainerReturnScene') ?? '');
  } else {
    return undefined;
  }
  const geography = SCENE_GEOGRAPHY[returnScene];
  return geography ? THEMES[geography] : undefined;
}

function hex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

function glowMat(color: number, opacity = 1): THREE.MeshToonMaterial {
  const mat = toonMat(color, { transparent: opacity < 1, opacity });
  mat.emissive.set(color);
  mat.emissiveIntensity = 0.55;
  if (opacity < 1) mat.depthWrite = false;
  return mat;
}

function addBox(
  root: THREE.Object3D,
  size: [number, number, number],
  color: number,
  pos: [number, number, number],
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), toonMat(color));
  mesh.position.set(...pos);
  root.add(mesh);
  return mesh;
}

function makeGroundTexture(theme: OutdoorBattleTheme): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(256, 256, 35, 256, 256, 350);
  grad.addColorStop(0, hex(theme.center));
  grad.addColorStop(0.66, hex(theme.middle));
  grad.addColorStop(1, hex(theme.edge));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  if (theme.geography === 'ferry') {
    ctx.strokeStyle = '#5d3d24';
    ctx.lineWidth = 5;
    for (let y = 0; y <= 512; y += 36) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
    }
    ctx.lineWidth = 2;
    for (let x = 0; x <= 512; x += 128) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 512); ctx.stroke();
    }
  } else if (theme.geography === 'ocean' || theme.geography === 'coast' || theme.geography === 'wetland') {
    ctx.strokeStyle = `${hex(theme.accent)}88`;
    ctx.lineWidth = theme.geography === 'ocean' ? 4 : 2;
    for (let y = 36; y < 512; y += 58) {
      ctx.beginPath();
      for (let x = 0; x <= 512; x += 12) {
        const yy = y + Math.sin(x * 0.045 + y) * 5;
        if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  } else if (theme.geography === 'snow' || theme.geography === 'snowForest' || theme.geography === 'iceCave') {
    ctx.fillStyle = `${hex(theme.accent)}aa`;
    for (let i = 0; i < 95; i++) {
      const x = (i * 83) % 512;
      const y = (i * 137) % 512;
      ctx.fillRect(x, y, i % 4 === 0 ? 5 : 3, 2);
    }
  } else if (theme.geography === 'volcano' || theme.geography === 'cave' || theme.geography === 'haunted') {
    ctx.strokeStyle = `${hex(theme.accent)}88`;
    ctx.lineWidth = theme.geography === 'volcano' ? 5 : 2;
    for (let i = 0; i < 13; i++) {
      const sx = (i * 97) % 512;
      const sy = (i * 53) % 512;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 24, sy + 35);
      ctx.lineTo(sx + 9, sy + 68);
      ctx.stroke();
    }
  } else {
    ctx.globalAlpha = 0.09;
    for (let y = 0; y < 8; y++) {
      ctx.fillStyle = y % 2 ? '#ffffff' : '#182813';
      ctx.fillRect(0, y * 64, 512, 30);
    }
    ctx.globalAlpha = 1;
  }

  const spot = (x: number, y: number) => {
    const g = ctx.createRadialGradient(x, y, 8, x, y, 66);
    g.addColorStop(0, hex(theme.spot));
    g.addColorStop(0.78, hex(theme.spot));
    g.addColorStop(1, `${hex(theme.spot)}00`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 66, 0, Math.PI * 2); ctx.fill();
  };
  if (theme.geography !== 'ocean' && theme.geography !== 'ferry') {
    spot(166, 361);
    spot(351, 141);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 8;
  return texture;
}

function addWaterSurround(root: THREE.Group, theme: OutdoorBattleTheme): void {
  const water = new THREE.Mesh(
    new THREE.CircleGeometry(18, 64),
    new THREE.MeshToonMaterial({
      color: theme.geography === 'ocean' ? 0x2188c5 : 0x3aa4d5,
      gradientMap: toonRamp(),
      transparent: true,
      opacity: 0.92,
    }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.12;
  root.add(water);
  for (const r of [11.6, 13.2, 15.1]) {
    const ripple = new THREE.Mesh(new THREE.TorusGeometry(r, 0.035, 5, 72), glowMat(theme.accent, 0.34));
    ripple.rotation.x = Math.PI / 2;
    ripple.position.y = -0.06;
    root.add(ripple);
  }
}

function addCrystal(root: THREE.Group, x: number, z: number, color: number, scale = 1): void {
  const shard = new THREE.Mesh(new THREE.OctahedronGeometry(0.34 * scale), glowMat(color, 0.72));
  shard.scale.y = 2.3;
  shard.position.set(x, 0.68 * scale, z);
  shard.rotation.y = x * 0.19;
  root.add(shard);
}

function addMountainBackline(root: THREE.Group, theme: OutdoorBattleTheme, snowCaps = false): void {
  for (let i = 0; i < 7; i++) {
    const x = -9 + i * 3;
    const h = 2.2 + (i % 3) * 0.65;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(1.7, h, 6), toonMat(theme.rock));
    peak.position.set(x, h / 2 - 0.1, -10.5 - (i % 2));
    root.add(peak);
    if (snowCaps) {
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.68, 0.9, 6), toonMat(0xf1f6f8));
      cap.position.set(x, h - 0.42, -10.5 - (i % 2));
      root.add(cap);
    }
  }
}

function addFerryRails(root: THREE.Group): void {
  for (const x of [-8.7, 8.7]) {
    addBox(root, [0.12, 0.75, 12], 0xd3d7da, [x, 0.62, -0.3]);
    for (let z = -5.8; z <= 5.8; z += 1.5) addBox(root, [0.18, 1.1, 0.18], 0x6f7479, [x, 0.55, z]);
  }
  addBox(root, [17.4, 0.13, 0.13], 0xd3d7da, [0, 1.0, -6.2]);
  for (let x = -8.4; x <= 8.4; x += 1.5) addBox(root, [0.18, 1.1, 0.18], 0x6f7479, [x, 0.55, -6.2]);
}

function addDolmens(root: THREE.Group, theme: OutdoorBattleTheme): void {
  for (const x of [-7.2, -4.9, 5.1, 7.3]) {
    addBox(root, [0.5, 1.55, 0.6], theme.rock, [x - 0.48, 0.78, -6.8]);
    addBox(root, [0.5, 1.55, 0.6], theme.rock, [x + 0.48, 0.78, -6.8]);
    const slab = addBox(root, [1.65, 0.34, 0.92], theme.accent, [x, 1.72, -6.8]);
    slab.rotation.z = x < 0 ? -0.05 : 0.05;
  }
}

function addHauntedBackdrop(root: THREE.Group, theme: OutdoorBattleTheme): void {
  addBox(root, [16, 4.8, 0.35], 0x24202c, [0, 2.3, -8.5]);
  for (const x of [-6.5, -3.25, 0, 3.25, 6.5]) {
    addBox(root, [0.55, 4.3, 0.6], 0x352d3d, [x, 2.15, -8.15]);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), glowMat(theme.accent));
    flame.position.set(x, 2.4, -7.75);
    root.add(flame);
  }
}

function addVolcanicVents(root: THREE.Group, theme: OutdoorBattleTheme): void {
  for (const [x, z] of [[-7, -5.3], [-5.6, 5.4], [5.7, -6], [7.4, 3.6]] as const) {
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.62, 0.75, 7), toonMat(theme.rock));
    vent.position.set(x, 0.34, z);
    root.add(vent);
    const lava = new THREE.Mesh(new THREE.CircleGeometry(0.3, 16), glowMat(theme.accent));
    lava.rotation.x = -Math.PI / 2;
    lava.position.set(x, 0.73, z);
    root.add(lava);
  }
  const light = new THREE.PointLight(theme.accent, 1.4, 13, 2);
  light.position.set(1.5, 2.2, -4.4);
  root.add(light);
}

/** A readable mine wall behind cave battles. Previously the 2D backdrop was
 *  correctly hidden for 3D mode, but the cave arena only had a dark floor and
 *  edge rocks, leaving the camera pointed into near-black fog. */
function addCaveBackdrop(root: THREE.Group, theme: OutdoorBattleTheme): void {
  for (let i = 0; i < 9; i++) {
    const x = -8 + i * 2;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55 + (i % 3) * 0.22, 0), toonMat(i % 2 ? theme.rim : theme.rock));
    rock.scale.set(1.05, 1.45 + (i % 2) * 0.28, 0.72);
    rock.position.set(x, 1.65 + (i % 2) * 0.25, -9.1 - (i % 2) * 0.25);
    rock.rotation.set(i * 0.11, i * 0.37, i % 2 ? 0.08 : -0.06);
    root.add(rock);
  }
  for (const [x, scale] of [[-6.6, 1.1], [-2.4, 0.75], [2.1, 0.95], [6.4, 1.2]] as const) {
    const stalactite = new THREE.Mesh(new THREE.ConeGeometry(0.42 * scale, 2.3 * scale, 7), toonMat(theme.rim));
    stalactite.rotation.z = Math.PI;
    stalactite.position.set(x, 4.25, -8.45);
    root.add(stalactite);
    addCrystal(root, x + 0.55, -8.0, theme.accent, 0.48 * scale);
  }
  const glow = new THREE.PointLight(theme.accent, 2.0, 17, 2);
  glow.position.set(0, 3.2, -6.5);
  root.add(glow);
}

function addScenery(root: THREE.Group, theme: OutdoorBattleTheme): void {
  const trees = theme.geography === 'snow' || theme.geography === 'snowForest' || theme.geography === 'coldPlateau'
    ? makePines(34, theme.tree)
    : makeTrees(34, theme.tree);
  const rocks = makeRocks(30, theme.rock);
  const grass = makeGrassTufts(54, theme.geography === 'wetland' ? 0x6f8e4d : theme.middle);
  const rnd = (a: number, b: number) => a + Math.random() * (b - a);

  let treeCount = 16;
  let rockCount = 11;
  let grassCount = 32;
  if (theme.geography === 'forest') treeCount = 30;
  if (theme.geography === 'woodland' || theme.geography === 'snowForest') treeCount = 24;
  if (theme.geography === 'mountain' || theme.geography === 'gorge' || theme.geography === 'ruins') {
    treeCount = 9; rockCount = 24; grassCount = 18;
  }
  if (theme.geography === 'cave' || theme.geography === 'iceCave' || theme.geography === 'volcano' || theme.geography === 'haunted') {
    treeCount = 0; rockCount = 28; grassCount = 0;
  }
  if (theme.geography === 'ocean' || theme.geography === 'ferry') {
    treeCount = 0; rockCount = theme.geography === 'ocean' ? 5 : 0; grassCount = 0;
  }
  if (theme.geography === 'coast' || theme.geography === 'autumnCoast') {
    treeCount = 10; rockCount = 18; grassCount = 15;
  }

  for (let i = 0; i < treeCount; i++) {
    const a = (i / Math.max(1, treeCount)) * Math.PI * 2 + rnd(-0.12, 0.12);
    const r = rnd(8.8, 10.7);
    trees.place(Math.cos(a) * r, Math.sin(a) * r, rnd(0.9, 1.45), rnd(0, Math.PI * 2));
  }
  for (let i = 0; i < rockCount; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(7.4, 10.5);
    rocks.place(Math.cos(a) * r, Math.sin(a) * r, rnd(0.65, 1.35), rnd(0, Math.PI * 2));
  }
  for (let i = 0; i < grassCount; i++) {
    const a = rnd(0, Math.PI * 2), r = rnd(5.8, 10.4);
    grass.place(Math.cos(a) * r, Math.sin(a) * r, rnd(0.7, 1.25), rnd(0, Math.PI));
  }
  trees.finalize(); rocks.finalize(); grass.finalize();
  for (const mesh of [...trees.meshes, ...rocks.meshes, ...grass.meshes]) root.add(mesh);
}

export function buildGeographicBattleArena(root: THREE.Group, chosen?: OutdoorBattleTheme): EnvProfile {
  const theme = chosen ?? THEMES.meadow;
  if (['coast', 'autumnCoast', 'wetland', 'ocean', 'ferry'].includes(theme.geography)) {
    addWaterSurround(root, theme);
  }

  const groundMat = new THREE.MeshToonMaterial({ map: makeGroundTexture(theme), gradientMap: toonRamp() });
  // A small self-lit component guarantees that dark caves/mines still expose
  // the authored ground even if a mobile GPU drops a dynamic light/shadow pass.
  groundMat.emissive.set(theme.center);
  groundMat.emissiveIntensity = theme.environment === 'cave' ? 0.22 : 0.06;
  const ground = new THREE.Mesh(new THREE.CircleGeometry(11, 48), groundMat);
  ground.rotation.x = -Math.PI / 2;
  root.add(ground);

  // A shallow landscaped edge replaces the old thick floating cylinder, which
  // read like a round Minecraft chunk around every battle.
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(11.12, 11.36, 0.34, 64, 1, true), toonMat(theme.rim));
  rim.position.y = -0.18;
  root.add(rim);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(11.05, 0.12, 8, 72), toonMat(theme.middle));
  lip.rotation.x = Math.PI / 2;
  lip.position.y = -0.015;
  root.add(lip);

  addScenery(root, theme);
  if (theme.geography === 'mountain' || theme.geography === 'gorge') addMountainBackline(root, theme);
  if (theme.geography === 'coldPlateau' || theme.geography === 'snow') addMountainBackline(root, theme, true);
  if (theme.geography === 'iceCave') {
    for (const [x, z, s] of [[-7.4, -5.8, 1.4], [-5.6, 6.0, 0.9], [5.8, -6.5, 1.2], [7.4, 4.8, 1.35]] as const) {
      addCrystal(root, x, z, theme.accent, s);
    }
  }
  if (theme.geography === 'snow' || theme.geography === 'snowForest') {
    for (const [x, z] of [[-7.6, -5.7], [6.6, -6.7], [8.1, 2.8]] as const) addCrystal(root, x, z, theme.accent, 0.55);
  }
  if (theme.geography === 'volcano') addVolcanicVents(root, theme);
  if (theme.geography === 'cave' || theme.geography === 'iceCave' || theme.geography === 'volcano') {
    addCaveBackdrop(root, theme);
  }
  if (theme.geography === 'ruins') addDolmens(root, theme);
  if (theme.geography === 'haunted') addHauntedBackdrop(root, theme);
  if (theme.geography === 'ferry') addFerryRails(root);

  return theme.environment;
}
