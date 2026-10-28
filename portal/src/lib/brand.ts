import type { CSSProperties } from 'react';

/**
 * Cor da agência (#RRGGBB) nas variáveis do tema. Use junto com a classe "brand-scope".
 * Sem cor válida, fica a marca padrão do tema.
 */
export function brandStyle(color: string | null | undefined): CSSProperties | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  const [r, g, b] = rgb(color);
  const soft = mix([r, g, b], 0.45);
  // Texto sobre a marca: branco, ou quase preto se a cor for muito clara.
  const light = 0.2126 * r + 0.7152 * g + 0.0722 * b > 165;
  return {
    '--brand': `${r} ${g} ${b}`,
    '--brand-soft': soft.join(' '),
    '--brand-fg': light ? '20 22 26' : '255 255 255',
  } as CSSProperties;
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/** Clareia em direção ao branco. */
function mix(c: [number, number, number], amount: number): number[] {
  return c.map((v) => Math.round(v + (255 - v) * amount));
}
