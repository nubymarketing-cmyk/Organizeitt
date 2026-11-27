'use client';

import { useEffect, useState } from 'react';
import { site, whatsappLink } from '@/lib/site';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Arrow, Button } from '../ui/Button';

const fmt = (h: number | null) => (h === null ? '' : `${String(h).padStart(2, '0')}h`);

export function Location() {
  const [today, setToday] = useState(-1);
  const [openNow, setOpenNow] = useState<boolean | null>(null);
  useEffect(() => {
    const d = new Date();
    setToday(d.getDay());
    const h = site.hours.find((x) => x.day === d.getDay());
    setOpenNow(!!h && h.open !== null && h.close !== null && d.getHours() >= h.open && d.getHours() < h.close);
  }, []);

  const a = site.address;
  const full = `${a.street}, ${a.district}, ${a.city} - ${a.state}, ${a.zip}`;
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(a.mapQuery)}&z=15&output=embed`;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(full)}`;
  // Segunda primeiro, domingo por último
  const ordered = [...site.hours.slice(1), site.hours[0]];

  return (
    <section id="contato" className="relative mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-40">
      <SectionHeading index="07" eyebrow="Localização e contato" title={['Venha conhecer', 'o estúdio.']}>
        Estacionamento no local, sala de espera climatizada e café enquanto você aguarda os serviços rápidos.
      </SectionHeading>

      <div className="mt-16 grid grid-cols-1 gap-4 md:mt-20 lg:grid-cols-12">
        <Reveal className="hairline relative min-h-[380px] overflow-hidden rounded-[26px] bg-graphite lg:col-span-7 lg:min-h-[560px]">
          <iframe
            title={`Mapa: ${site.fullName}`}
            src={mapSrc}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 [filter:grayscale(1)_invert(0.92)_contrast(0.9)_brightness(0.95)]"
          />
          <div className="pointer-events-none absolute inset-0 rounded-[26px] shadow-[inset_0_0_80px_30px_rgba(5,5,5,0.7)]" />
          <a
            href={directions}
            target="_blank"
            rel="noopener noreferrer"
            className="glass group absolute bottom-5 left-5 flex items-center gap-3 rounded-full px-5 py-3 text-sm text-white transition-colors hover:bg-white/10"
          >
            Como chegar <Arrow />
          </a>
        </Reveal>

        <div className="grid gap-4 lg:col-span-5">
          <Reveal delay={0.08} className="hairline rounded-[26px] bg-graphite/70 p-7">
            <p className="eyebrow">Endereço</p>
            <address className="mt-4 text-lg leading-relaxed text-white not-italic">
              {a.street}
              <br />
              <span className="text-chrome/70">
                {a.district} · {a.city} - {a.state}
              </span>
            </address>
          </Reveal>

          <Reveal delay={0.14} className="hairline rounded-[26px] bg-graphite/70 p-7">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Horário de funcionamento</p>
              {openNow !== null && (
                <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] uppercase">
                  <span className={`h-1.5 w-1.5 rounded-full ${openNow ? 'bg-brand shadow-[0_0_10px_#f8d211]' : 'bg-white/30'}`} />
                  <span className={openNow ? 'text-brand' : 'text-silver'}>{openNow ? 'Aberto agora' : 'Fechado agora'}</span>
                </span>
              )}
            </div>
            <ul className="mt-4 text-sm">
              {ordered.map((h) => (
                <li key={h.day} className={`flex justify-between border-b border-white/[0.06] py-2.5 last:border-0 ${h.day === today ? 'text-white' : 'text-silver'}`}>
                  <span>
                    {h.label}
                    {h.day === today && <span className="ml-2 font-mono text-[10px] tracking-[0.14em] text-brand uppercase">hoje</span>}
                  </span>
                  <span className="font-mono tabular-nums">{h.open === null ? 'Fechado' : `${fmt(h.open)} às ${fmt(h.close)}`}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.2} className="hairline rounded-[26px] bg-graphite/70 p-7">
            <p className="eyebrow">Fale com a gente</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button href={whatsappLink(`Olá, ${site.fullName}! Vim pelo site.`)} external className="flex-1">
                WhatsApp <Arrow />
              </Button>
              <Button href={`https://instagram.com/${site.instagram}`} external variant="ghost" className="flex-1">
                @{site.instagram}
              </Button>
            </div>
            <p className="mt-4 text-sm text-silver">
              {site.phoneDisplay} · {site.email}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
