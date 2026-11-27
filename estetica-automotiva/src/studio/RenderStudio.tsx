'use client';

/**
 * Estúdio de renderização das imagens e vídeos do site.
 * Não é uma rota do site: o script scripts/render.mjs cria src/app/render/page.tsx
 * temporariamente, abre /render?shot=<id>, avança o relógio quadro a quadro,
 * salva tudo em public/media e apaga a rota no final.
 */
import { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { Car } from '@/components/three/Car';
import { Studio } from '@/components/three/Studio';
import { Floor } from '@/components/three/Floor';
import { Water } from '@/components/three/Water';
import { PAINTS, type Paint } from '@/components/three/carMaterials';

type V3 = [number, number, number];
type Shot = {
  pos: V3;
  target: V3;
  fov: number;
  paint?: Paint;
  dirt?: number;
  look?: 'studio' | 'tunnel' | 'macro' | 'interior';
  water?: number;
  glass?: number;
  spin?: number;
  accent?: number;
  sweep?: boolean;
  exposure?: number;
  /** animação de câmera para vídeos: t em segundos */
  move?: (t: number) => { pos: V3; target: V3 };
};

const orbit = (r: number, h: number, speed: number, start: number, target: V3) => (t: number) => {
  const a = start + t * speed;
  return { pos: [Math.sin(a) * r, h, Math.cos(a) * r] as V3, target };
};

const SHOTS: Record<string, Shot> = {
  hero: { pos: [4.6, 1.15, -4.7], target: [-0.75, 0.48, 0.15], fov: 32, water: 1, paint: PAINTS.silver },
  before: { pos: [4.2, 1.35, -4.3], target: [0, 0.5, 0.1], fov: 33, dirt: 1, paint: PAINTS.silver, sweep: false, accent: 0.4 },
  after: { pos: [4.2, 1.35, -4.3], target: [0, 0.5, 0.1], fov: 33, dirt: 0, paint: PAINTS.silver, sweep: false, accent: 0.4 },
  'final-cta': { pos: [-4.8, 0.7, 4.4], target: [0.4, 0.55, 0.3], fov: 30, paint: PAINTS.silver, accent: 1.4 },

  // Serviços
  'lavagem-detalhada': { pos: [-2.1, 0.45, -2.45], target: [-0.85, 0.34, -1.15], fov: 30, water: 1.2, paint: PAINTS.silver },
  'lavagem-premium': { pos: [-3.3, 0.75, 3.9], target: [0.1, 0.55, 0.3], fov: 32, look: 'tunnel', water: 0.7, paint: PAINTS.silver },
  'higienizacao-interna': { pos: [0.35, 2.55, 1.35], target: [-0.15, 0.55, -0.45], fov: 36, glass: 0.0, look: 'interior', paint: PAINTS.silver, accent: 0.3 },
  'polimento-tecnico': { pos: [-2.4, 0.9, 0.55], target: [-0.9, 0.72, 0.3], fov: 26, look: 'macro', paint: PAINTS.graphite, accent: 0.8 },
  vitrificacao: { pos: [1.6, 1.25, -3.6], target: [0.15, 0.8, -1.4], fov: 26, look: 'macro', paint: PAINTS.obsidian, water: 0.6, accent: 1.6 },
  'limpeza-motor': { pos: [2.4, 2.1, 3.9], target: [0, 0.75, 1.1], fov: 30, paint: PAINTS.silver, glass: 0.35 },
  'higienizacao-bancos': { pos: [0.55, 2.2, 1.25], target: [-0.05, 0.45, 0.05], fov: 24, glass: 0.0, look: 'interior', paint: PAINTS.silver, accent: 0.3 },
  'estetica-completa': { pos: [4.1, 0.6, -5.6], target: [0, 0.55, 0], fov: 30, paint: PAINTS.silver, look: 'tunnel' },

  // Vídeos da estrutura (6 s em loop)
  'v-box': { pos: [0, 0, 0], target: [0, 0.5, 0], fov: 34, look: 'tunnel', water: 1, paint: PAINTS.silver, move: orbit(6.2, 1.6, 0.06, 0.6, [0, 0.45, 0.15]) },
  'v-polimento': {
    pos: [0, 0, 0], target: [0, 0, 0], fov: 24, look: 'macro', paint: PAINTS.graphite, accent: 0.8,
    move: (t) => ({ pos: [-2.5, 0.85 + t * 0.01, 1.2 - t * 0.12], target: [-0.9, 0.7, 0.35 - t * 0.1] }),
  },
  'v-rodas': {
    pos: [0, 0, 0], target: [0, 0, 0], fov: 28, water: 0.8, spin: 0.08, paint: PAINTS.silver,
    move: (t) => ({ pos: [-2.2 - t * 0.04, 0.42 + t * 0.015, -2.85 + t * 0.06], target: [-0.85, 0.34, -1.15] }),
  },
  'v-ambiente': { pos: [0, 0, 0], target: [0, 0.5, 0], fov: 30, paint: PAINTS.silver, accent: 1.2, move: orbit(7, 2.4, -0.07, 2.4, [0, 0.4, 0.15]) },
};

declare global {
  interface Window {
    __ready?: boolean;
    __frame?: (t: number, type?: string, quality?: number) => string;
  }
}

function Driver({ shot }: { shot: Shot }) {
  const { advance, gl, camera } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const place = (t: number) => {
      const m = shot.move ? shot.move(t) : { pos: shot.pos, target: shot.target };
      cam.position.set(...m.pos);
      cam.fov = shot.fov;
      cam.updateProjectionMatrix();
      cam.lookAt(...m.target);
    };
    window.__frame = (t, type = 'image/png', quality = 0.95) => {
      place(t);
      advance(t, true);
      return gl.domElement.toDataURL(type, quality);
    };
    // aquece: compila shaders e gera o mapa de ambiente
    place(0);
    advance(0, true);
    advance(0.0001, true);
    window.__ready = true;
  }, [advance, gl, camera, shot]);
  return null;
}

export default function RenderStudio() {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(new URLSearchParams(location.search).get('shot') ?? 'hero'), []);
  const shot = useMemo(() => (id ? SHOTS[id] : null), [id]);
  if (!shot) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505' }}>
      <Canvas
        frameloop="never"
        dpr={1}
        camera={{ position: shot.pos, fov: shot.fov, near: 0.05, far: 60 }}
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: shot.exposure ?? 0.95 }}
      >
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 9, 22]} />
        <Suspense fallback={null}>
          <Studio sweep={shot.sweep ?? true} live accent={shot.accent ?? 1} look={shot.look} resolution={512} />
          <Car paint={shot.paint} dirt={shot.dirt ?? 0} glassOpacity={shot.glass} wheelSpin={shot.spin ?? 0} />
          <Floor />
          {shot.water ? <Water count={2200} opacity={shot.water} speed={0.85} /> : null}
          <Driver shot={shot} />
        </Suspense>
      </Canvas>
    </div>
  );
}
