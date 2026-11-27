import * as THREE from 'three';

/**
 * Materiais do carro. A lataria usa MeshPhysicalMaterial com clearcoat
 * (verniz automotivo) para reflexos realistas do ambiente de estúdio.
 */
export type Paint = { color: string; metalness: number; roughness: number; clearcoatRoughness: number };

export const PAINTS: Record<string, Paint> = {
  graphite: { color: '#2b3038', metalness: 0.85, roughness: 0.32, clearcoatRoughness: 0.02 },
  obsidian: { color: '#0d0f12', metalness: 0.7, roughness: 0.28, clearcoatRoughness: 0.02 },
  silver: { color: '#8d939b', metalness: 0.95, roughness: 0.3, clearcoatRoughness: 0.03 },
  pearl: { color: '#d9dadc', metalness: 0.35, roughness: 0.25, clearcoatRoughness: 0.02 },
};

type Options = { paint?: Paint; dirt?: number; glassOpacity?: number };

export type CarRig = {
  wheels: THREE.Object3D[];
  materials: THREE.Material[];
  dirt: { value: number };
};

/** Aplica materiais ao modelo carregado e devolve referências úteis (rodas para girar, etc.). */
export function setupCar(root: THREE.Object3D, opts: Options = {}): CarRig {
  const paint = opts.paint ?? PAINTS.graphite;
  const dirt = { value: opts.dirt ?? 0 };

  const body = new THREE.MeshPhysicalMaterial({
    color: paint.color,
    metalness: paint.metalness,
    roughness: paint.roughness,
    clearcoat: 1,
    clearcoatRoughness: paint.clearcoatRoughness,
    envMapIntensity: 1.25,
  });
  const rims = new THREE.MeshPhysicalMaterial({
    color: '#c9ccd1',
    metalness: 1,
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
  });
  const chrome = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 1, roughness: 0.08 });
  const trim = new THREE.MeshStandardMaterial({ color: '#16181b', metalness: 0.6, roughness: 0.45 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#0b0d10',
    metalness: 0.1,
    roughness: 0,
    clearcoat: 1,
    transparent: true,
    opacity: opts.glassOpacity ?? 0.55,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  const tire = new THREE.MeshStandardMaterial({ color: '#0b0b0c', roughness: 0.85, metalness: 0 });
  const leather = new THREE.MeshStandardMaterial({ color: '#5b3220', roughness: 0.55, metalness: 0 });
  const leatherDark = new THREE.MeshStandardMaterial({ color: '#17171a', roughness: 0.6, metalness: 0 });
  const badge = new THREE.MeshStandardMaterial({ color: '#202328', metalness: 0.9, roughness: 0.3 });

  const byMaterial: Record<string, THREE.Material> = {
    Body_Color: body,
    metal_gray: rims,
    metal_chrome: chrome,
    Glass_Gray: glass,
    Tires: tire,
    Leather_red: leather,
    Leather: leatherDark,
    Carbon_Fiber: trim,
    plastic_gray: trim,
    Ferrari_Yellow: badge,
    _0098_DodgerBlue: badge,
  };

  const dirtyTargets: THREE.Material[] = [body, rims, glass, tire, trim];
  if (dirt.value > 0) dirtyTargets.forEach((m) => injectDirt(m as THREE.MeshStandardMaterial, dirt, m === glass));

  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const name = (mesh.material as THREE.Material)?.name;
    if (name && byMaterial[name]) mesh.material = byMaterial[name];
    // Freios: pinças em grafite para não competir com a pintura
    if (mesh.name === 'brake') mesh.material = trim;
    mesh.castShadow = false;
    mesh.receiveShadow = false;
  });

  const wheels = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr']
    .map((n) => root.getObjectByName(n))
    .filter(Boolean) as THREE.Object3D[];

  return { wheels, materials: Object.values(byMaterial), dirt };
}

/**
 * Sujeira procedural: poeira em toda a superfície e barro concentrado na parte de baixo,
 * calculada pela posição no mundo (não depende das UVs do modelo).
 */
function injectDirt(mat: THREE.MeshStandardMaterial, dirt: { value: number }, isGlass: boolean) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDirt = dirt;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDirtPos;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvDirtPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
uniform float uDirt;
varying vec3 vDirtPos;
float dHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dNoise(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dHash(i), dHash(i + vec3(1,0,0)), f.x), mix(dHash(i + vec3(0,1,0)), dHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(dHash(i + vec3(0,0,1)), dHash(i + vec3(1,0,1)), f.x), mix(dHash(i + vec3(0,1,1)), dHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float dFbm(vec3 p){ float v = 0.0; float a = 0.5; for (int i = 0; i < 5; i++){ v += a * dNoise(p); p *= 2.03; a *= 0.5; } return v; }
float dirtMask(){
  float low = 1.0 - smoothstep(0.12, 0.78, vDirtPos.y);
  float n = dFbm(vDirtPos * 5.0);
  float splat = smoothstep(0.48, 0.72, dFbm(vDirtPos * 22.0 + 3.1));
  float film = 0.42 + 0.3 * n;
  float streak = smoothstep(0.55, 0.8, dFbm(vec3(vDirtPos.x * 40.0, vDirtPos.y * 3.0, vDirtPos.z * 40.0)));
  return clamp(film * 0.75 + low * (0.55 + 0.9 * n) + splat * 0.5 * low + streak * 0.25, 0.0, 1.0) * uDirt;
}`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
float dm = dirtMask();
vec3 mud = mix(vec3(0.20, 0.16, 0.12), vec3(0.36, 0.31, 0.25), dFbm(vDirtPos * 31.0));
diffuseColor.rgb = mix(diffuseColor.rgb, mud, dm * ${isGlass ? '0.55' : '0.92'});
${isGlass ? 'diffuseColor.a = mix(diffuseColor.a, 0.92, dm);' : ''}`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.92, dm);'
      )
      .replace(
        '#include <metalnessmap_fragment>',
        '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.05, dm);'
      )
      .replace(
        '#include <lights_physical_fragment>',
        '#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= (1.0 - dm);\n#endif'
      );
  };
  mat.customProgramCacheKey = () => `dirt-${isGlass}`;
  mat.needsUpdate = true;
}
