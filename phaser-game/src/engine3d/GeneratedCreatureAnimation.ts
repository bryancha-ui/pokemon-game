import * as THREE from 'three';

/** Runtime-generated animation for a static, unrigged creature GLB. */
export interface GeneratedCreatureAnimation {
  update(dt: number): void;
  dispose(): void;
}

const INTRO_DURATION = 1.65;

function quaternionValues(eulers: THREE.Euler[]): number[] {
  const values: number[] = [];
  for (const euler of eulers) {
    const q = new THREE.Quaternion().setFromEuler(euler);
    values.push(q.x, q.y, q.z, q.w);
  }
  return values;
}

/**
 * Generate Nabihalmang's entrance without requiring a paid animation service
 * or a skeleton that the one-piece GLB does not contain. The model rises and
 * ceremonially turns into a perpetual hover while generated fairy scales and
 * a dancheong-blue aura orbit its wings.
 */
export function generateNabihalmangAppearance(root: THREE.Group): GeneratedCreatureAnimation {
  const mixer = new THREE.AnimationMixer(root);

  const introTimes = [0, 0.38, 0.9, 1.28, INTRO_DURATION];
  const intro = new THREE.AnimationClip('nabihalmang_generated_appear', INTRO_DURATION, [
    new THREE.VectorKeyframeTrack('.position', introTimes, [
      0, -0.42, 0,
      0,  0.14, 0,
      0,  0.56, 0,
      0,  0.25, 0,
      0,  0.34, 0,
    ], THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack('.quaternion', introTimes, quaternionValues([
      new THREE.Euler(0.10, -0.52, -0.12),
      new THREE.Euler(-0.04, 0.26, 0.09),
      new THREE.Euler(0.02, -0.13, -0.05),
      new THREE.Euler(-0.01, 0.06, 0.025),
      new THREE.Euler(0, 0, 0),
    ])),
  ]);

  const hoverTimes = [0, 0.6, 1.2, 1.8, 2.4];
  const hover = new THREE.AnimationClip('nabihalmang_generated_hover', 2.4, [
    new THREE.VectorKeyframeTrack('.position', hoverTimes, [
      0, 0.34, 0,
      0, 0.46, 0,
      0, 0.34, 0,
      0, 0.23, 0,
      0, 0.34, 0,
    ], THREE.InterpolateSmooth),
    new THREE.QuaternionKeyframeTrack('.quaternion', hoverTimes, quaternionValues([
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(0.015, 0.10, -0.045),
      new THREE.Euler(0, 0, 0),
      new THREE.Euler(-0.015, -0.10, 0.045),
      new THREE.Euler(0, 0, 0),
    ])),
  ]);

  const introAction = mixer.clipAction(intro);
  introAction.setLoop(THREE.LoopOnce, 1);
  introAction.clampWhenFinished = true;
  introAction.play();
  const hoverAction = mixer.clipAction(hover);

  // Free procedural VFX: orbiting fairy scales plus a soft ceremonial halo.
  const aura = new THREE.Group();
  root.add(aura);
  const particleGeometry = new THREE.SphereGeometry(0.024, 6, 6);
  const particleMaterial = new THREE.MeshBasicMaterial({
    color: 0xaee9ff, transparent: true, opacity: 0, depthWrite: false,
  });
  const particles: THREE.Mesh[] = [];
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2;
    const radius = 0.38 + (i % 4) * 0.09;
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.set(Math.cos(angle) * radius, 0.48 + (i % 5) * 0.1, Math.sin(angle) * radius * 0.5);
    particle.userData.baseY = particle.position.y;
    particle.userData.phase = angle;
    particles.push(particle);
    aura.add(particle);
  }
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x5ed5ff, transparent: true, opacity: 0, depthWrite: false,
  });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.012, 8, 48), haloMaterial);
  halo.rotation.x = Math.PI / 2;
  halo.position.y = 0.5;
  aura.add(halo);

  let elapsed = 0;
  let hovering = false;
  return {
    update(dt: number) {
      elapsed += dt;
      mixer.update(dt);
      if (!hovering && elapsed >= INTRO_DURATION - 0.08) {
        hovering = true;
        introAction.fadeOut(0.25);
        hoverAction.reset().fadeIn(0.28).play();
      }
      aura.rotation.y += dt * (hovering ? 0.52 : 1.5);
      const reveal = Math.min(1, elapsed / 0.65);
      particleMaterial.opacity = reveal * (0.45 + Math.sin(elapsed * 4.2) * 0.16);
      haloMaterial.opacity = reveal * (0.18 + Math.sin(elapsed * 2.8) * 0.07);
      const haloScale = 0.92 + Math.sin(elapsed * 2.8) * 0.08;
      halo.scale.setScalar(haloScale);
      for (const particle of particles) {
        particle.position.y = Number(particle.userData.baseY) + Math.sin(elapsed * 3.6 + Number(particle.userData.phase)) * 0.07;
      }
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      root.remove(aura);
      particleGeometry.dispose();
      particleMaterial.dispose();
      halo.geometry.dispose();
      haloMaterial.dispose();
    },
  };
}
