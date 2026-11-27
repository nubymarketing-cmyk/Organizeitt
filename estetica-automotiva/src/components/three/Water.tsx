'use client';

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

const vertex = /* glsl */ `
attribute float aSeed;
uniform float uTime;
uniform float uSpeed;
uniform float uPixelRatio;
uniform float uSize;
varying float vAlpha;
void main() {
  vec3 p = position;
  float speed = uSpeed * (0.55 + aSeed * 0.9);
  p.y = mod(position.y - uTime * speed, 4.2) - 0.1;
  p.x += sin(uTime * 0.4 + aSeed * 30.0) * 0.04;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aSeed * 0.9) * uPixelRatio / -mv.z;
  vAlpha = smoothstep(-0.1, 0.35, p.y) * smoothstep(4.1, 3.2, p.y) * (0.3 + 0.7 * aSeed);
}`;

const fragment = /* glsl */ `
uniform float uOpacity;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  // gota alongada pela câmera lenta: estreita na horizontal, longa na vertical
  float d = length(vec2(uv.x * 6.0, uv.y * 1.15));
  float body = smoothstep(0.5, 0.05, d);
  float spec = smoothstep(0.08, 0.0, length(vec2(uv.x * 6.0 + 0.25, uv.y + 0.18)));
  vec3 col = mix(vec3(0.62, 0.74, 1.0), vec3(1.0), spec);
  gl_FragColor = vec4(col, (body * 0.55 + spec) * vAlpha * uOpacity);
}`;

type Props = { count?: number; opacity?: number; speed?: number; size?: number; area?: [number, number] };

/** Gotas caindo em câmera lenta, com brilho especular. Um único draw call. */
export function Water({ count = 1400, opacity = 1, speed = 0.9, size = 110, area = [9, 9] }: Props) {
  const ref = useRef<THREE.ShaderMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    // gerador determinístico: mesmas gotas em todo render (útil para os vídeos)
    let s = 1337;
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * area[0];
      pos[i * 3 + 1] = rnd() * 4.2;
      pos[i * 3 + 2] = (rnd() - 0.5) * area[1];
      seed[i] = rnd();
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count, area]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSpeed: { value: speed },
      uOpacity: { value: opacity },
      uPixelRatio: { value: dpr },
      uSize: { value: size },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    m.uniforms.uTime.value = state.clock.elapsedTime;
    m.uniforms.uOpacity.value = opacity;
    m.uniforms.uPixelRatio.value = state.viewport.dpr;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={ref}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
