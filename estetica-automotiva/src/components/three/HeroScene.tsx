'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import { easing } from 'maath';
import type { MotionValue } from 'framer-motion';
import { Car } from './Car';
import { Studio } from './Studio';
import { Floor } from './Floor';
import { Water } from './Water';
import { PAINTS } from './carMaterials';

/**
 * Pontos de câmera da narrativa em scroll.
 * p = 0 hero · 0.33 pintura · 0.62 rodas · 0.85 interior · 1 traseira
 * (a frente do carro aponta para -z)
 */
type Shot = { p: number; pos: [number, number, number]; target: [number, number, number]; fov: number };

const DESKTOP: Shot[] = [
  { p: 0.0, pos: [4.6, 1.15, -4.7], target: [-1.35, 0.42, 0.15], fov: 32 },
  { p: 0.33, pos: [-3.4, 0.85, 1.4], target: [0, 0.62, 0.0], fov: 30 },
  { p: 0.62, pos: [-2.15, 0.42, -2.6], target: [-0.85, 0.34, -1.15], fov: 30 },
  { p: 0.85, pos: [1.2, 2.55, 1.3], target: [-0.15, 0.55, -0.1], fov: 34 },
  { p: 1.0, pos: [-4.4, 1.25, 5.2], target: [0, 0.5, 0.25], fov: 32 },
];

const MOBILE: Shot[] = [
  { p: 0.0, pos: [6.7, 2.0, -7.9], target: [0.1, -0.1, 0.2], fov: 38 },
  { p: 0.33, pos: [-4.6, 1.0, 1.4], target: [0, 0.6, 0.1], fov: 36 },
  { p: 0.62, pos: [-2.6, 0.5, -3.3], target: [-0.85, 0.36, -1.15], fov: 34 },
  { p: 0.85, pos: [1.5, 3.2, 1.6], target: [-0.1, 0.55, -0.1], fov: 40 },
  { p: 1.0, pos: [-5.4, 1.5, 6.4], target: [0, 0.6, 0.25], fov: 38 },
];

const ease = (t: number) => t * t * (3 - 2 * t);

function sample(shots: Shot[], p: number) {
  let i = 0;
  while (i < shots.length - 2 && p > shots[i + 1].p) i++;
  const a = shots[i];
  const b = shots[i + 1];
  const t = ease(THREE.MathUtils.clamp((p - a.p) / (b.p - a.p), 0, 1));
  return {
    pos: new THREE.Vector3(...a.pos).lerp(new THREE.Vector3(...b.pos), t),
    target: new THREE.Vector3(...a.target).lerp(new THREE.Vector3(...b.target), t),
    fov: THREE.MathUtils.lerp(a.fov, b.fov, t),
  };
}

function CameraRig({ progress, reduced }: { progress: MotionValue<number>; reduced: boolean }) {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(-1.35, 0.42, 0.15));
  const mobile = size.width < 768;

  useFrame((state, delta) => {
    const shots = mobile ? MOBILE : DESKTOP;
    const s = sample(shots, progress.get());
    // parallax do mouse: a câmera acompanha o cursor de leve
    const px = reduced ? 0 : state.pointer.x * 0.35;
    const py = reduced ? 0 : state.pointer.y * 0.18;
    s.pos.x += px;
    s.pos.y += py;
    const cam = camera as THREE.PerspectiveCamera;
    const smooth = reduced ? 0.0001 : 0.35;
    easing.damp3(cam.position, s.pos, smooth, delta);
    easing.damp3(target.current, s.target, smooth, delta);
    cam.fov = THREE.MathUtils.damp(cam.fov, s.fov, 4, delta);
    cam.updateProjectionMatrix();
    cam.lookAt(target.current);
  });
  return null;
}

function SceneContent({ progress, quality, reduced }: { progress: MotionValue<number>; quality: 'high' | 'low'; reduced: boolean }) {
  const [rain, setRain] = useState(1);
  useEffect(() => progress.on('change', (v) => setRain(Math.max(0, 1 - v * 3.2))), [progress]);

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 9, 22]} />
      <Studio sweep={!reduced} live={quality === 'high' && !reduced} resolution={quality === 'high' ? 256 : 128} />
      <Car paint={PAINTS.silver} />
      <Floor quality={quality} />
      {rain > 0.01 && <Water count={quality === 'high' ? 1600 : 600} opacity={rain} speed={reduced ? 0 : 0.85} />}
      <CameraRig progress={progress} reduced={reduced} />
    </>
  );
}

type Props = { progress: MotionValue<number>; active: boolean; onReady?: () => void };

export default function HeroScene({ progress, active, onReady }: Props) {
  const [quality, setQuality] = useState<'high' | 'low'>('high');
  const [dpr, setDpr] = useState(1.5);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const lowEnd = window.innerWidth < 768 || (navigator.hardwareConcurrency ?? 8) <= 4;
    if (lowEnd) {
      setQuality('low');
      setDpr(1.25);
    }
  }, []);

  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ position: [4.6, 1.15, -4.7], fov: 32, near: 0.1, far: 60 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 0.95 }}
      onCreated={() => onReady?.()}
      aria-hidden
    >
      <PerformanceMonitor
        onDecline={() => {
          setDpr(1);
          setQuality('low');
        }}
      />
      <Suspense fallback={null}>
        <SceneContent progress={progress} quality={quality} reduced={reduced} />
      </Suspense>
    </Canvas>
  );
}
