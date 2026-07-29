import * as THREE from 'three';

// ── 3D battle move effects ───────────────────────────────────────────────────
// Renders each move as a 3D sequence in the arena, driven by the visual hook
// event the battle already emits: special moves fire a glowing type-colored
// orb that arcs to the target; physical moves (whose lunge the mirror already
// reproduces) get an impact burst. Impacts pop an expanding shockwave ring and
// a spray of shards, colored by the move's type.

interface Orb {
  kind: 'orb';
  mesh: THREE.Mesh;
  glow: THREE.Sprite;
  from: THREE.Vector3; to: THREE.Vector3;
  t: number; dur: number;
  color: number; eff: number;
  onArrive: (p: THREE.Vector3) => void;
}
interface Burst {
  kind: 'burst';
  ring: THREE.Mesh;
  shards: THREE.InstancedMesh;
  vels: THREE.Vector3[];
  t: number; dur: number;
}
type Fx = Orb | Burst;

let glowTex: THREE.Texture | null = null;
function getGlowTex(): THREE.Texture {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 30);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}

export class MoveFX3D {
  private root: THREE.Group;
  private active: Fx[] = [];

  constructor(root: THREE.Group) {
    this.root = root;
  }

  /** Special move: orb flies from attacker to target, bursting on arrival. */
  fireProjectile(from: THREE.Vector3, to: THREE.Vector3, color: number, eff: number, onImpact?: () => void): void {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 10, 8),
      new THREE.MeshBasicMaterial({ color: mixWhite(color, 0.35) }),
    );
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: getGlowTex(), color, transparent: true, opacity: 0.9,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    glow.scale.setScalar(1.1);
    mesh.add(glow);
    mesh.position.copy(from);
    this.root.add(mesh);
    this.active.push({
      kind: 'orb', mesh, glow,
      from: from.clone(), to: to.clone(),
      t: 0, dur: 0.28, color, eff,
      onArrive: (p) => { this.burst(p, color, eff); onImpact?.(); },
    });
  }

  /** Impact burst: expanding shockwave ring + shard spray. */
  burst(at: THREE.Vector3, color: number, eff = 1): void {
    const big = eff > 1 ? 1.45 : eff === 0 ? 0.6 : 1;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.18, 0.3, 24),
      new THREE.MeshBasicMaterial({
        color: mixWhite(color, 0.3), transparent: true, opacity: 0.95,
        side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(at.x, 0.06, at.z);
    this.root.add(ring);

    const n = Math.round(12 * big);
    const shards = new THREE.InstancedMesh(
      new THREE.TetrahedronGeometry(0.07),
      new THREE.MeshBasicMaterial({ color: mixWhite(color, 0.15), transparent: true, opacity: 1 }),
      n,
    );
    const vels: THREE.Vector3[] = [];
    const dummy = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      vels.push(new THREE.Vector3(Math.cos(a) * (1.2 + Math.random()), 1.6 + Math.random() * 1.6, Math.sin(a) * (1.2 + Math.random())).multiplyScalar(big));
      dummy.position.copy(at).y += 0.5;
      dummy.updateMatrix();
      shards.setMatrixAt(i, dummy.matrix);
    }
    (shards as unknown as { __origin: THREE.Vector3 }).__origin = at.clone();
    this.root.add(shards);
    this.active.push({ kind: 'burst', ring, shards, vels, t: 0, dur: 0.55 * big });
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const fx = this.active[i];
      fx.t += dt;
      const k = Math.min(1, fx.t / fx.dur);
      if (fx.kind === 'orb') {
        const p = fx.from.clone().lerp(fx.to, k);
        p.y += Math.sin(k * Math.PI) * 1.1;              // arc
        fx.mesh.position.copy(p);
        fx.glow.material.opacity = 0.9 * (1 - k * 0.3);
        if (k >= 1) {
          const at = fx.to.clone();
          this.root.remove(fx.mesh);
          fx.mesh.geometry.dispose();
          (fx.mesh.material as THREE.Material).dispose();
          fx.glow.material.dispose();
          this.active.splice(i, 1);
          fx.onArrive(at);
        }
      } else {
        const ringS = 1 + k * 6;
        fx.ring.scale.setScalar(ringS);
        (fx.ring.material as THREE.MeshBasicMaterial).opacity = 0.95 * (1 - k);
        const dummy = new THREE.Object3D();
        const origin = (fx.shards as unknown as { __origin: THREE.Vector3 }).__origin;
        for (let j = 0; j < fx.vels.length; j++) {
          const v = fx.vels[j];
          dummy.position.set(
            origin.x + v.x * fx.t,
            Math.max(0.04, 0.5 + v.y * fx.t - 4.5 * fx.t * fx.t),
            origin.z + v.z * fx.t,
          );
          dummy.rotation.set(fx.t * 7 + j, fx.t * 9, 0);
          const sc = Math.max(0.001, 1 - k);
          dummy.scale.setScalar(sc);
          dummy.updateMatrix();
          fx.shards.setMatrixAt(j, dummy.matrix);
        }
        fx.shards.instanceMatrix.needsUpdate = true;
        (fx.shards.material as THREE.MeshBasicMaterial).opacity = 1 - k * 0.7;
        if (k >= 1) {
          this.root.remove(fx.ring, fx.shards);
          fx.ring.geometry.dispose();
          (fx.ring.material as THREE.Material).dispose();
          fx.shards.geometry.dispose();
          (fx.shards.material as THREE.Material).dispose();
          this.active.splice(i, 1);
        }
      }
    }
  }
}

function mixWhite(color: number, t: number): number {
  return new THREE.Color(color).lerp(new THREE.Color(0xffffff), t).getHex();
}
