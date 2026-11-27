'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import { asset } from '@/lib/site';
import { PAINTS, setupCar, type Paint } from './carMaterials';

const MODEL = asset('/models/car.glb');
const DRACO = asset('/draco/');

type Props = {
  paint?: Paint;
  dirt?: number;
  glassOpacity?: number;
  /** voltas por segundo das rodas (0 = paradas) */
  wheelSpin?: number;
  /** oculta partes que bloqueiam a vista do interior */
  showShadow?: boolean;
} & ThreeElements['group'];

export function Car({ paint = PAINTS.graphite, dirt = 0, glassOpacity, wheelSpin = 0, showShadow = true, ...group }: Props) {
  const gltf = useGLTF(MODEL, DRACO);
  const ao = useTexture(asset('/models/car_ao.png'));

  const { scene, rig } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const rig = setupCar(scene, { paint, dirt, glassOpacity });
    return { scene, rig };
  }, [gltf.scene, paint, dirt, glassOpacity]);

  useEffect(() => () => rig.materials.forEach((m) => m.dispose()), [rig]);

  const spin = useRef(0);
  useFrame((state) => {
    if (!wheelSpin) return;
    const angle = state.clock.elapsedTime * wheelSpin * Math.PI * 2;
    spin.current = angle;
    rig.wheels.forEach((w) => (w.rotation.x = -angle));
  });

  return (
    <group {...group}>
      <primitive object={scene} />
      {showShadow && (
        <mesh rotation-x={-Math.PI / 2} position-y={0.002} renderOrder={2}>
          <planeGeometry args={[0.655 * 4, 1.3 * 4]} />
          <meshBasicMaterial
            map={ao}
            blending={THREE.MultiplyBlending}
            toneMapped={false}
            transparent
            premultipliedAlpha
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload(MODEL, DRACO);
