'use client';

import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from 'framer-motion';
import { asset, services, site, type Service } from '@/lib/site';
import { requestBooking } from '@/lib/booking';
import { SectionHeading } from '../ui/SectionHeading';
import { Arrow } from '../ui/Button';

function ServiceCard({ s, i }: { s: Service; i: number }) {
  const ref = useRef<HTMLElement>(null);
  const mx = useMotionValue(-200);
  const my = useMotionValue(-200);
  const spotlight = useMotionTemplate`radial-gradient(420px circle at ${mx}px ${my}px, rgba(248,210,17,0.14), transparent 60%)`;
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const imgY = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);

  return (
    <motion.article
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(e.clientX - r.left);
        my.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        mx.set(-200);
        my.set(-200);
      }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 1, delay: (i % 4) * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="hairline group relative flex aspect-[4/5] w-[78vw] shrink-0 snap-start flex-col overflow-hidden rounded-[22px] bg-graphite sm:w-[46vw] md:w-auto"
    >
      <motion.div style={{ y: imgY }} className="absolute -inset-y-[10%] inset-x-0">
        <img
          src={asset(s.image)}
          alt={`${s.name} na ${site.fullName}`}
          loading="lazy"
          decoding="async"
          width={1000}
          height={1250}
          className="h-full w-full scale-[1.02] object-cover transition-transform duration-[1.4s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.08]"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/0" />
      <motion.div style={{ background: spotlight }} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between p-6">
        <span className="font-mono text-xs text-chrome/70">{String(i + 1).padStart(2, '0')}</span>
        <span className="glass rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.16em] text-chrome uppercase">{s.duration}</span>
      </div>

      <div className="relative mt-auto p-6">
        <h3 className="display text-[1.65rem] leading-[1] text-white">{s.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-chrome/70">{s.description}</p>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
          {s.includes.map((x) => (
            <li key={x} className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] text-silver uppercase">
              <span className="h-1 w-1 rounded-full bg-brand" />
              {x}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => requestBooking(s.id)}
          className="mt-6 flex w-full items-center justify-between rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm text-white backdrop-blur-md transition-colors duration-500 hover:border-brand hover:bg-brand hover:text-ink"
          aria-label={`Agendar ${s.name}`}
        >
          Agendar este serviço
          <Arrow />
        </button>
      </div>
    </motion.article>
  );
}

export function Services() {
  return (
    <section id="servicos" className="relative mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-40">
      <SectionHeading index="01" eyebrow="Serviços" title={['Tratamentos de', 'alto padrão.']}>
        Cada serviço segue um protocolo técnico, com produtos profissionais e tempo dedicado ao seu carro. Escolha o seu e agende em
        menos de um minuto.
      </SectionHeading>

      <div className="-mx-5 mt-16 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:mx-0 md:mt-20 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
        {services.map((s, i) => (
          <ServiceCard key={s.id} s={s} i={i} />
        ))}
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-silver/60 uppercase md:hidden">Deslize para ver todos</p>
    </section>
  );
}
