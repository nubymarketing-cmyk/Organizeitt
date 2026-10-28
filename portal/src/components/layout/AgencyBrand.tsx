import type { Agency } from '../../types/database';

/** Logo da agência no portal do cliente; sem logo, o nome com a cor da marca. */
export function AgencyBrand({ agency }: { agency: Agency | undefined }) {
  if (!agency) return <span className="h-6 w-16" />;
  if (agency.logo_url) {
    return <img src={agency.logo_url} alt={agency.name} className="h-8 max-w-[120px] object-contain" />;
  }
  return (
    <span className="max-w-[140px] truncate font-display text-base font-extrabold tracking-tight">
      <span className="text-link">{agency.name}</span>
    </span>
  );
}
