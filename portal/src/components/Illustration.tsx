/**
 * Ilustrações de traço para estados vazios. Usam as cores do tema (marca e texto),
 * então funcionam no claro, no escuro e com a cor de cada agência.
 */
export type IllustrationName = 'calendar' | 'people' | 'folder' | 'chart' | 'done' | 'inbox';

const stroke = { stroke: 'rgb(var(--fg) / 0.55)', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
const soft = { fill: 'rgb(var(--brand) / 0.12)' };
const accent = { fill: 'rgb(var(--brand))' };

export function Illustration({ name, className }: { name: IllustrationName; className?: string }) {
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <ellipse cx="80" cy="108" rx="54" ry="6" fill="rgb(var(--fg) / 0.06)" />
      {name === 'calendar' ? (
        <>
          <rect x="34" y="22" width="92" height="78" rx="12" {...soft} />
          <rect x="34" y="22" width="92" height="78" rx="12" {...stroke} />
          <path d="M34 44h92M58 14v16M102 14v16" {...stroke} />
          {[0, 1, 2, 3].map((c) =>
            [0, 1].map((r) => <rect key={`${c}-${r}`} x={46 + c * 19} y={54 + r * 18} width="10" height="10" rx="3" fill="rgb(var(--fg) / 0.12)" />),
          )}
          <circle cx="122" cy="92" r="16" {...accent} />
          <path d="M122 84v16M114 92h16" stroke="rgb(var(--brand-fg))" strokeWidth="3" strokeLinecap="round" />
        </>
      ) : name === 'people' ? (
        <>
          <circle cx="62" cy="46" r="16" {...soft} />
          <circle cx="62" cy="46" r="16" {...stroke} />
          <path d="M34 96c2-16 14-26 28-26s26 10 28 26" {...soft} />
          <path d="M34 96c2-16 14-26 28-26s26 10 28 26" {...stroke} />
          <circle cx="104" cy="52" r="12" {...stroke} />
          <path d="M92 74c4-2 8-3 12-3 11 0 20 8 22 22" {...stroke} />
          <circle cx="122" cy="30" r="12" {...accent} />
          <path d="M122 24v12M116 30h12" stroke="rgb(var(--brand-fg))" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : name === 'folder' ? (
        <>
          <path d="M28 40a8 8 0 0 1 8-8h26l10 10h52a8 8 0 0 1 8 8v42a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8z" {...soft} />
          <path d="M28 40a8 8 0 0 1 8-8h26l10 10h52a8 8 0 0 1 8 8v42a8 8 0 0 1-8 8H36a8 8 0 0 1-8-8z" {...stroke} />
          <rect x="58" y="56" width="44" height="30" rx="5" fill="rgb(var(--surface))" {...{ stroke: 'rgb(var(--fg) / 0.35)', strokeWidth: 2 }} />
          <path d="M64 80l10-10 8 7 6-5 8 8" {...stroke} />
          <circle cx="90" cy="64" r="3" {...accent} />
        </>
      ) : name === 'chart' ? (
        <>
          <rect x="30" y="20" width="100" height="80" rx="12" {...soft} />
          <path d="M44 88V40M44 88h76" {...stroke} />
          <rect x="54" y="66" width="12" height="22" rx="3" fill="rgb(var(--fg) / 0.15)" />
          <rect x="74" y="54" width="12" height="34" rx="3" fill="rgb(var(--fg) / 0.15)" />
          <rect x="94" y="40" width="12" height="48" rx="3" {...accent} />
          <path d="M56 58l20-12 20-14" {...stroke} />
        </>
      ) : name === 'done' ? (
        <>
          <circle cx="80" cy="58" r="40" {...soft} />
          <circle cx="80" cy="58" r="26" {...accent} />
          <path d="M68 58l8 8 16-16" stroke="rgb(var(--brand-fg))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M30 30l6 4M130 30l-6 4M28 84l7-2M132 84l-7-2" {...stroke} />
        </>
      ) : (
        <>
          <path d="M30 62l14-30h72l14 30v30a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" {...soft} />
          <path d="M30 62l14-30h72l14 30v30a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" {...stroke} />
          <path d="M30 62h28l6 10h32l6-10h28" {...stroke} />
          <circle cx="80" cy="44" r="6" {...accent} />
        </>
      )}
    </svg>
  );
}
