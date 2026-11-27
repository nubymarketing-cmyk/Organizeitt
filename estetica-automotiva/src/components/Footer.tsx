import { asset, nav, site, whatsappLink } from '@/lib/site';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="relative border-t border-white/[0.06] bg-ink">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <img src={asset(site.logo)} alt={site.fullName} width={200} height={96} className="h-16 w-auto" loading="lazy" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-silver">{site.description}</p>
        </div>
        <nav className="md:col-span-3" aria-label="Rodapé">
          <p className="eyebrow">Navegação</p>
          <ul className="mt-5 grid grid-cols-2 gap-y-2.5 text-sm md:grid-cols-1">
            {nav.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="text-chrome/70 transition-colors hover:text-brand">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="md:col-span-4">
          <p className="eyebrow">Contato</p>
          <ul className="mt-5 space-y-2.5 text-sm text-chrome/70">
            <li>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                WhatsApp {site.phoneDisplay}
              </a>
            </li>
            <li>
              <a href={`https://instagram.com/${site.instagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand">
                Instagram @{site.instagram}
              </a>
            </li>
            <li>
              {site.address.street} · {site.address.district} · {site.address.city} - {site.address.state}
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-white/[0.06] px-5 py-6 text-xs text-silver/60 md:flex-row md:justify-between md:px-10">
        <span>
          © {year} {site.fullName}. Todos os direitos reservados.
        </span>
        <span>
          Modelo 3D “Ferrari 458 Italia” por{' '}
          <a href="https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6" target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
            vicent091036
          </a>{' '}
          (CC BY 4.0)
        </span>
      </div>
    </footer>
  );
}
