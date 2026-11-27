'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { MeshReflectorMaterial } from '@react-three/drei';

/** Halo de luz no piso, como um spot de estúdio sobre o carro. */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d')!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, 'rgba(255,255,255,0.55)');
    grd.addColorStop(0.35, 'rgba(255,255,255,0.18)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
}

/** Piso molhado de estúdio, com reflexo borrado do carro. */
export function Floor({ quality = 'high', glow = 0.22 }: { quality?: 'high' | 'low'; glow?: number }) {
  const tex = useGlowTexture();
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position-y={0}>
        <planeGeometry args={[60, 60]} />
        {quality === 'low' ? (
          <meshStandardMaterial color="#070708" roughness={0.3} metalness={0.7} />
        ) : (
          <MeshReflectorMaterial
            resolution={768}
            blur={[500, 160]}
            mixBlur={1.2}
            mixStrength={16}
            mixContrast={1.1}
            depthScale={1}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            roughness={0.75}
            metalness={0.65}
            color="#0a0b0c"
            mirror={0.75}
          />
        )}
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0.15]} renderOrder={1}>
        <planeGeometry args={[11, 11]} />
        <meshBasicMaterial map={tex} transparent opacity={glow} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}
