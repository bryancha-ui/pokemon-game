import Phaser from 'phaser';
import * as THREE from 'three';

// ── Three.js stage ───────────────────────────────────────────────────────────
// Owns the WebGL canvas (kept exactly underneath the Phaser canvas, which
// renders UI on top with a transparent background while 3D mode is active),
// the scene graph, lights, sky dome and fog. Environment presets recolor the
// world per biome (day / snow / cave / interior / battle).

export type EnvProfile = 'day' | 'snow' | 'cave' | 'interior' | 'battle';

interface EnvColors {
  skyTop: number; skyBottom: number; fog: number; fogNear: number; fogFar: number;
  hemiSky: number; hemiGround: number; hemiIntensity: number;
  sun: number; sunIntensity: number; showSky: boolean; cloudOpacity: number;
}

const ENVS: Record<EnvProfile, EnvColors> = {
  day:      { skyTop: 0x3f9ee8, skyBottom: 0xe4f4ff, fog: 0xd4e9f5, fogNear: 36, fogFar: 96,
              hemiSky: 0xe1f2ff, hemiGround: 0x8fa66f, hemiIntensity: 1.28, sun: 0xfff0d1, sunIntensity: 2.05, showSky: true, cloudOpacity: 0.72 },
  snow:     { skyTop: 0x80acd8, skyBottom: 0xf5f9ff, fog: 0xedf3f8, fogNear: 22, fogFar: 58,
              hemiSky: 0xf0f6ff, hemiGround: 0xc8d4df, hemiIntensity: 1.3, sun: 0xfff8ed, sunIntensity: 1.55, showSky: true, cloudOpacity: 0.82 },
  cave:     { skyTop: 0x10101d, skyBottom: 0x28243a, fog: 0x171523, fogNear: 9, fogFar: 32,
              hemiSky: 0x575176, hemiGround: 0x211d2b, hemiIntensity: 0.92, sun: 0x9d91cb, sunIntensity: 0.72, showSky: true, cloudOpacity: 0 },
  interior: { skyTop: 0x2a2634, skyBottom: 0x3c3648, fog: 0x302b39, fogNear: 20, fogFar: 48,
              hemiSky: 0xfff4df, hemiGround: 0x7b6e5c, hemiIntensity: 1.32, sun: 0xffe5ba, sunIntensity: 1.25, showSky: false, cloudOpacity: 0 },
  battle:   { skyTop: 0x398fdf, skyBottom: 0xe5f4ff, fog: 0xd5e9f8, fogNear: 32, fogFar: 96,
              hemiSky: 0xe3f1ff, hemiGround: 0x91a875, hemiIntensity: 1.3, sun: 0xffefd1, sunIntensity: 2.1, showSky: true, cloudOpacity: 0.62 },
};

export class ThreeStage {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  /** Root for per-Phaser-scene content; cleared on scene change. */
  worldRoot: THREE.Group;

  private hemi: THREE.HemisphereLight;
  private sun: THREE.DirectionalLight;
  private sky: THREE.Mesh;
  private skyMat: THREE.ShaderMaterial;
  private clouds = new THREE.Group();
  private cloudMaterial: THREE.SpriteMaterial;
  private preparedMeshes = new WeakSet<THREE.Mesh>();
  private viewDir = new THREE.Vector3();
  private lightFocus = new THREE.Vector3();
  private readonly sunOffset = new THREE.Vector3(-11, 18, 10);
  private game: Phaser.Game;
  private rectTimer = 0;

  constructor(game: Phaser.Game) {
    this.game = game;
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = 'position:absolute;pointer-events:none;display:none;';
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: false });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.1, 200);
    this.worldRoot = new THREE.Group();
    this.scene.add(this.worldRoot);

    this.hemi = new THREE.HemisphereLight(0xcfe4ff, 0x8a9a6a, 1.15);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.6);
    this.sun.position.set(-6, 12, 5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1536, 1536);
    this.sun.shadow.bias = -0.00035;
    this.sun.shadow.normalBias = 0.035;
    const shadowCam = this.sun.shadow.camera;
    shadowCam.left = shadowCam.bottom = -18;
    shadowCam.right = shadowCam.top = 18;
    shadowCam.near = 0.5;
    shadowCam.far = 55;
    shadowCam.updateProjectionMatrix();
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);

    // Gradient sky dome.
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0x4f9be8) },
        bottom: { value: new THREE.Color(0xcfe8ff) },
      },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
        void main(){ float h = clamp(normalize(vP).y*1.4+0.35, 0.0, 1.0);
        gl_FragColor = vec4(mix(bottom, top, h), 1.0); }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(120, 24, 12), this.skyMat);
    this.sky.frustumCulled = false;
    this.scene.add(this.sky);

    // Soft illustrated cloud banks add the spacious, toy-like horizon that the
    // handheld games use to keep low-detail scenery from reading as voxel art.
    this.cloudMaterial = new THREE.SpriteMaterial({
      map: this.makeCloudTexture(), color: 0xffffff, transparent: true,
      opacity: 0.72, depthWrite: false, fog: false,
    });
    const cloudLayout: [number, number, number, number, number][] = [
      [-30, 11, -52, 18, 7], [25, 14, -60, 23, 8], [-44, 18, -76, 27, 9],
      [46, 10, -44, 16, 6], [3, 22, -82, 31, 10], [-16, 16, -68, 20, 7],
    ];
    for (const [x, y, z, w, h] of cloudLayout) {
      const cloud = new THREE.Sprite(this.cloudMaterial);
      cloud.position.set(x, y, z);
      cloud.scale.set(w, h, 1);
      this.clouds.add(cloud);
    }
    this.scene.add(this.clouds);

    this.setEnvironment('day');

    // Keep our canvas glued to the Phaser canvas through FIT-scale changes.
    this.game.scale.on(Phaser.Scale.Events.RESIZE, () => this.syncRect());
    window.addEventListener('resize', () => this.syncRect());
  }

  attachDom(): void {
    const pc = this.game.canvas;
    if (pc && pc.parentElement && !this.canvas.parentElement) {
      pc.parentElement.insertBefore(this.canvas, pc);
      // Explicit stacking: the Phaser canvas (UI) must paint ABOVE this one.
      // Without this, an absolutely-positioned canvas paints over the static
      // Phaser canvas regardless of DOM order — hiding all dialogue/menus.
      this.canvas.style.zIndex = '0';
      pc.style.position = 'relative';
      pc.style.zIndex = '1';
      this.syncRect();
    }
  }

  /** Match the Phaser canvas position/size exactly (it is FIT-scaled + centered). */
  syncRect(): void {
    const pc = this.game.canvas;
    if (!pc || !pc.parentElement) return;
    const rect = pc.getBoundingClientRect();
    const host = pc.parentElement.getBoundingClientRect();
    this.canvas.style.left = `${rect.left - host.left + pc.parentElement.scrollLeft}px`;
    this.canvas.style.top = `${rect.top - host.top + pc.parentElement.scrollTop}px`;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    const w = Math.max(2, Math.round(rect.width)), h = Math.max(2, Math.round(rect.height));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = rect.width / Math.max(1, rect.height);
    this.camera.updateProjectionMatrix();
  }

  setEnvironment(profile: EnvProfile): void {
    const e = ENVS[profile];
    (this.skyMat.uniforms.top.value as THREE.Color).set(e.skyTop);
    (this.skyMat.uniforms.bottom.value as THREE.Color).set(e.skyBottom);
    this.sky.visible = e.showSky;
    this.scene.fog = new THREE.Fog(e.fog, e.fogNear, e.fogFar);
    this.scene.background = new THREE.Color(e.showSky ? e.skyBottom : e.fog);
    this.hemi.color.set(e.hemiSky);
    this.hemi.groundColor.set(e.hemiGround);
    this.hemi.intensity = e.hemiIntensity;
    this.sun.color.set(e.sun);
    this.sun.intensity = e.sunIntensity;
    this.clouds.visible = e.cloudOpacity > 0;
    this.cloudMaterial.opacity = e.cloudOpacity;
  }

  setVisible(v: boolean): void {
    this.canvas.style.display = v ? 'block' : 'none';
  }

  /** Replace the world root with a fresh empty group (disposing the old content). */
  resetWorld(): THREE.Group {
    this.scene.remove(this.worldRoot);
    disposeDeep(this.worldRoot);
    this.worldRoot = new THREE.Group();
    this.scene.add(this.worldRoot);
    this.preparedMeshes = new WeakSet<THREE.Mesh>();
    return this.worldRoot;
  }

  render(): void {
    // Periodic safety re-sync (layout can shift without a resize event, e.g. fonts).
    if (++this.rectTimer >= 90) { this.rectTimer = 0; this.syncRect(); }
    this.sky.position.copy(this.camera.position);
    this.clouds.position.copy(this.camera.position);
    // Keep the sun and its compact shadow camera centred on the visible action.
    // The fixed direction preserves the painted look while avoiding low-res
    // shadows spread across an entire route.
    this.camera.getWorldDirection(this.viewDir);
    this.lightFocus.copy(this.camera.position).addScaledVector(this.viewDir, 8);
    this.sun.target.position.copy(this.lightFocus);
    this.sun.position.copy(this.lightFocus).add(this.sunOffset);
    this.sun.target.updateMatrixWorld();
    if (this.rectTimer % 30 === 0) this.prepareWorldMeshes();
    this.renderer.render(this.scene, this.camera);
  }

  private prepareWorldMeshes(): void {
    this.worldRoot.traverse(obj => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh || this.preparedMeshes.has(mesh)) return;
      this.preparedMeshes.add(mesh);
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]) as THREE.Material[];
      const translucent = mats.some(m => m.transparent || m.opacity < 0.98);
      mesh.castShadow = !translucent;
      mesh.receiveShadow = !translucent;
    });
  }

  private makeCloudTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const ctx = c.getContext('2d')!;
    const glow = ctx.createRadialGradient(128, 70, 8, 128, 70, 105);
    glow.addColorStop(0, 'rgba(255,255,255,1)');
    glow.addColorStop(0.62, 'rgba(255,255,255,0.92)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(128, 74, 108, 36, 0, 0, Math.PI * 2);
    ctx.fill();
    for (const [x, y, rx, ry] of [[70, 70, 36, 28], [108, 52, 48, 38], [151, 47, 42, 34], [188, 69, 38, 28]] as const) {
      const p = ctx.createRadialGradient(x, y - 5, 2, x, y, rx);
      p.addColorStop(0, 'rgba(255,255,255,0.98)');
      p.addColorStop(0.72, 'rgba(255,255,255,0.88)');
      p.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = p;
      ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    return tex;
  }
}

/** Dispose geometries/materials created per-scene (cached relief assets are kept). */
export function disposeDeep(root: THREE.Object3D): void {
  root.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (mesh.geometry && !(mesh.userData.sharedGeo)) mesh.geometry.dispose?.();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (mat && !mesh.userData.sharedMat) {
      if (Array.isArray(mat)) mat.forEach(m => m.dispose?.());
      else mat.dispose?.();
    }
  });
}
