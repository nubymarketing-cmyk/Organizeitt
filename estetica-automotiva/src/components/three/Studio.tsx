'use client';

import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';

type Props = {
  /** faixa de luz que atravessa a lataria (reflexo em movimento) */
  sweep?: boolean;
  /** intensidade dos recortes coloridos (amarelo da marca e azul da água) */
  accent?: number;
  /** atualiza o mapa de ambiente a cada quadro (necessário para o sweep) */
  live?: boolean;
  resolution?: number;
  /** variações de iluminação para cada foto */
  look?: 'studio' | 'tunnel' | 'macro' | 'interior';
};

/**
 * Estúdio automotivo virtual: softboxes, faixas de LED no teto e recortes nas cores da marca.
 * Tudo gerado em tempo real, sem baixar HDRI (zero requisições extras).
 */
export function Studio({ sweep = true, accent = 1, live = true, resolution = 256, look = 'studio' }: Props) {
  const sweepRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!sweepRef.current || !sweep) return;
    const t = state.clock.elapsedTime;
    // ida e volta suave ao longo do carro
    sweepRef.current.position.z = Math.sin(t * 0.35) * 6;
  });

  const tunnel = look === 'tunnel';

  return (
    <Environment resolution={resolution} frames={live ? Infinity : 1} background={false}>
      <color attach="background" args={['#050505']} />

      {/* Faixas de LED no teto, ao longo do comprimento do carro */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        {(tunnel ? [-4, -2.5, -1, 0.5, 2, 3.5, 5] : [-2.2, 0, 2.2]).map((x, i) => (
          <Lightformer
            key={i}
            form="rect"
            intensity={tunnel ? 3 : 4.5}
            position={[x * (tunnel ? 0.35 : 0.6), 0.5, -6]}
            scale={tunnel ? [0.3, 14, 1] : [1.1, 14, 1]}
          />
        ))}
      </group>

      {tunnel && (
        <group rotation={[0, 0, 0]}>
          {[-5, -3, -1, 1, 3, 5].map((z, i) => (
            <group key={i}>
              <Lightformer form="rect" intensity={1.6} position={[-6, 2.5, z]} rotation-y={Math.PI / 2} scale={[0.25, 5, 1]} />
              <Lightformer form="rect" intensity={1.6} position={[6, 2.5, z]} rotation-y={-Math.PI / 2} scale={[0.25, 5, 1]} />
            </group>
          ))}
        </group>
      )}

      {/* Softbox grande no teto: dá corpo à pintura metálica */}
      <Lightformer form="rect" intensity={look === 'macro' ? 0.5 : 1.2} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[7, 12, 1]} />

      {/* Softboxes laterais */}
      <Lightformer form="rect" intensity={look === 'macro' ? 0.8 : 2.4} position={[-7, 2.2, 0]} rotation-y={Math.PI / 2} scale={[14, 3.2, 1]} />
      <Lightformer form="rect" intensity={look === 'macro' ? 0.5 : 2} position={[7, 2.2, 0]} rotation-y={-Math.PI / 2} scale={[14, 3.2, 1]} />
      {/* Linha de luz baixa: desenha a linha de cintura do carro */}
      <Lightformer form="rect" intensity={1.4} position={[-7, 0.6, 0]} rotation-y={Math.PI / 2} scale={[14, 0.2, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[7, 0.6, 0]} rotation-y={-Math.PI / 2} scale={[14, 0.2, 1]} />

      {/* Luz frontal suave */}
      <Lightformer form="rect" intensity={look === 'interior' ? 3 : 1.4} position={[0, 2.5, -9]} scale={[10, 3, 1]} />

      {/* Recortes de cor da marca: amarelo Impacto e o azul da água, com moderação */}
      <Lightformer form="ring" color="#f8d211" intensity={2.2 * accent} position={[-6, 1.2, 7]} scale={3} onUpdate={(s) => s.lookAt(0, 0, 0)} />
      <Lightformer form="rect" color="#529cc3" intensity={1.2 * accent} position={[6, 0.4, 6]} scale={[6, 0.25, 1]} onUpdate={(s) => s.lookAt(0, 0, 0)} />

      {/* Faixa de luz em movimento: o reflexo que percorre a pintura */}
      {sweep && (
        <Lightformer
          ref={sweepRef}
          form="rect"
          intensity={look === 'macro' ? 9 : 5}
          position={[5.5, 1.8, 0]}
          rotation-y={-Math.PI / 2}
          scale={[0.35, 4, 1]}
        />
      )}
    </Environment>
  );
}
