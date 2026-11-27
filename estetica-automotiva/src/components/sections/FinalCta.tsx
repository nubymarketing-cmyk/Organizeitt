'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { asset, media } from '@/lib/site';
import { requestBooking } from '@/lib/booking';
import { LineReveal, Reveal } from '../ui/Reveal';
import { Arrow, Button } from '../ui/Button';

export function FinalCta() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-12%', '12%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1.15, 1]);

  return (
    <section ref={ref} className="relative flex min-h-[90svh] items-end overflow-hidden" aria-label="Agendar">
      <motion.img style={{ y, scale }} src={asset(media.finalCta)} alt="" loading="lazy" className="absolute inset-0 h-[120%] w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-ink/70" />
      <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-20 md:px-10 md:pb-28">
        <Reveal className="mb-6 flex items-center gap-4">
          <span className="h-px w-10 bg-brand" />
          <span className="eyebrow text-chrome/80">Vagas limitadas por dia</span>
        </Reveal>
        <LineReveal lines={['Pronto para ver', <span key="b" className="chrome-text">seu carro brilhar?</span>]} className="display max-w-[16ch] text-[clamp(2.6rem,7vw,6.6rem)] text-white" />
        <Reveal delay={0.2} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={() => requestBooking()}>
            Agendar experiência <Arrow />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
