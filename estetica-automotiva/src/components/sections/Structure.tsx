'use client';

import { useEffect, useRef } from 'react';
import { asset, media } from '@/lib/site';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';

/** Vídeo curto em loop: só baixa e toca quando aparece na tela. */
function LoopVideo({ src, label }: { src: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !reduced) v.play().catch(() => {});
        else v.pause();
      },
      { rootMargin: '200px' }
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={asset(`${src}.webp`)}
      aria-label={label}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
    >
      <source src={asset(`${src}.webm`)} type="video/webm" />
      <source src={asset(`${src}.mp4`)} type="video/mp4" />
    </video>
  );
}

const PROCESS = [
  { n: '01', t: 'Recepção', d: 'Check-in com fotos e inspeção do veículo junto com você.' },
  { n: '02', t: 'Processo técnico', d: 'Cada etapa executada por especialistas, no tempo certo.' },
  { n: '03', t: 'Controle de qualidade', d: 'Revisão sob luz de inspeção antes da liberação.' },
  { n: '04', t: 'Entrega', d: 'Seu carro pronto, com orientações de cuidado e manutenção.' },
];

export function Structure() {
  const [a, b, c, d] = media.structure;
  const tile = 'hairline group relative overflow-hidden rounded-[22px] bg-graphite';
  const caption = (item: (typeof media.structure)[number], big = false) => (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent p-6 pt-20">
      <h3 className={`display text-white ${big ? 'text-3xl md:text-4xl' : 'text-xl'}`}>{item.title}</h3>
      <p className="mt-2 max-w-sm text-sm text-chrome/70">{item.caption}</p>
    </div>
  );

  return (
    <section id="estrutura" className="relative mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-40">
      <SectionHeading index="03" eyebrow="Nossa estrutura" title={['Um estúdio feito', 'para o seu carro.']}>
        Ambiente controlado, iluminação técnica e equipamentos profissionais. Cada detalhe do espaço foi pensado para um resultado
        impecável.
      </SectionHeading>

      <div className="mt-16 grid grid-cols-1 gap-4 md:mt-20 md:grid-cols-12 md:grid-rows-[320px_320px_300px]">
        <Reveal className={`${tile} aspect-[4/3] md:col-span-7 md:row-span-2 md:aspect-auto`}>
          <LoopVideo src={a.video} label={a.title} />
          {caption(a, true)}
        </Reveal>
        <Reveal delay={0.08} className={`${tile} aspect-[4/3] md:col-span-5 md:aspect-auto`}>
          <LoopVideo src={b.video} label={b.title} />
          {caption(b)}
        </Reveal>
        <Reveal delay={0.16} className={`${tile} aspect-[4/3] md:col-span-5 md:aspect-auto`}>
          <LoopVideo src={c.video} label={c.title} />
          {caption(c)}
        </Reveal>
        <Reveal delay={0.24} className={`${tile} aspect-[16/9] md:col-span-12 md:aspect-auto`}>
          <LoopVideo src={d.video} label={d.title} />
          {caption(d)}
        </Reveal>
      </div>

      <ol className="mt-20 grid gap-px overflow-hidden rounded-[22px] bg-white/[0.06] sm:grid-cols-2 lg:grid-cols-4">
        {PROCESS.map((p, i) => (
          <Reveal as="li" key={p.n} delay={i * 0.08} className="bg-ink p-7">
            <span className="font-mono text-xs text-brand">{p.n}</span>
            <h3 className="mt-6 text-lg font-medium text-white">{p.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-silver">{p.d}</p>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
