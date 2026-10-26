import type { CSSProperties } from 'react';

/** Variáveis do gradiente da marca a partir da cor da agência (#RRGGBB). Sem cor, fica o padrão. */
export function brandStyle(color: string | null | undefined): CSSProperties | undefined {
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) return undefined;
  return { '--brand-from': color, '--brand-to': shade(color, -0.35) } as CSSProperties;
}

/** Escurece (amount < 0) ou clareia (amount > 0) a cor. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const v = amount < 0 ? c * (1 + amount) : c + (255 - c) * amount;
    return Math.round(Math.min(255, Math.max(0, v)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(n >> 16)}${channel((n >> 8) & 255)}${channel(n & 255)}`;
}
