'use client';

import { testimonials, type Testimonial } from '@/lib/site';
import { SectionHeading } from '../ui/SectionHeading';

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`${n} de 5 estrelas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-4 w-4 ${i < n ? 'text-brand' : 'text-white/15'}`} fill="currentColor" aria-hidden>
          <path d="M10 1.8l2.4 5.3 5.8.6-4.3 3.9 1.2 5.7L10 14.4l-5.1 2.9 1.2-5.7L1.8 7.7l5.8-.6L10 1.8Z" />
        </svg>
      ))}
    </div>
  );
}

function Card({ t }: { t: Testimonial }) {
  return (
    <figure className="hairline glass flex w-[320px] shrink-0 flex-col rounded-[22px] p-7 md:w-[400px]">
      <div className="flex items-center justify-between">
        <Stars n={t.rating} />
        <span className="font-mono text-[10px] tracking-[0.18em] text-silver/70 uppercase">via {t.source}</span>
      </div>
      <blockquote className="mt-6 flex-1 text-[15px] leading-relaxed text-chrome/90 md:text-base">“{t.text}”</blockquote>
      <figcaption className="mt-8 flex items-center gap-3 border-t border-white/[0.07] pt-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-white/15 to-white/5 font-mono text-xs text-white">
          {t.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
        </span>
        <span>
          <span className="block text-sm font-medium text-white">{t.name}</span>
          <span className="block text-xs text-silver">{t.car}</span>
        </span>
      </figcaption>
    </figure>
  );
}

function Row({ items, reverse = false, duration = 60 }: { items: Testimonial[]; reverse?: boolean; duration?: number }) {
  const doubled = [...items, ...items];
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      <div
        className="flex w-max gap-4 pr-4 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animation: `marquee ${duration}s linear infinite`, animationDirection: reverse ? 'reverse' : 'normal' }}
      >
        {doubled.map((t, i) => (
          <div key={i} aria-hidden={i >= items.length}>
            <Card t={t} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  const half = Math.ceil(testimonials.length / 2);
  return (
    <section id="avaliacoes" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHeading index="06" eyebrow="Avaliações" title={['Quem confia,', 'recomenda.']}>
          A opinião de quem já viveu a experiência Impacto, nas palavras dos nossos clientes.
        </SectionHeading>
      </div>
      <div className="mt-16 space-y-4 md:mt-20">
        <Row items={testimonials.slice(0, half)} duration={70} />
        <Row items={testimonials.slice(half)} reverse duration={80} />
      </div>
    </section>
  );
}
