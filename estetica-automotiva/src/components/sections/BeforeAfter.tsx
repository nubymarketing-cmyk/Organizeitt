'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { asset, media } from '@/lib/site';
import { requestBooking } from '@/lib/booking';
import { SectionHeading } from '../ui/SectionHeading';
import { Reveal } from '../ui/Reveal';
import { Arrow, Button } from '../ui/Button';

const STEPS = [
  { n: '01', t: 'Diagnóstico', d: 'Inspeção com luz técnica e medição da camada de verniz.' },
  { n: '02', t: 'Descontaminação', d: 'Remoção química e mecânica de ferro, piche e resíduos.' },
  { n: '03', t: 'Correção e proteção', d: 'Polimento em etapas e selagem cerâmica da pintura.' },
];

export function BeforeAfter() {
  const frame = useRef<HTMLDivElement>(null);
  const pos = useMotionValue(50);
  const [value, setValue] = useState(50);
  const inView = useInView(frame, { once: true, margin: '-25% 0px' });
  const dragging = useRef(false);
  const touched = useRef(false);

  useMotionValueEvent(pos, 'change', (v) => setValue(Math.round(v)));
  const clip = useTransform(pos, (v) => `inset(0 0 0 ${v}%)`);
  const left = useTransform(pos, (v) => `${v}%`);

  // dica de interação: o divisor passeia uma vez ao entrar na tela
  useEffect(() => {
    if (!inView || touched.current) return;
    const controls = animate(pos, [50, 22, 74, 50], { duration: 2.8, ease: [0.65, 0, 0.35, 1], delay: 0.4 });
    return () => controls.stop();
  }, [inView, pos]);

  const setFromX = useCallback(
    (clientX: number) => {
      const r = frame.current?.getBoundingClientRect();
      if (!r) return;
      pos.set(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
    },
    [pos]
  );

  return (
    <section id="resultados" className="relative overflow-hidden py-28 md:py-40">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-brand/[0.04] blur-[120px]" />
      <div className="relative mx-auto max-w-[1440px] px-5 md:px-10">
        <SectionHeading index="02" eyebrow="Antes e depois" title={['A diferença', 'está no detalhe.']}>
          Arraste o divisor e veja o mesmo carro antes e depois do processo completo de lavagem técnica, correção e proteção.
        </SectionHeading>

        <Reveal className="mt-16 md:mt-20">
          <div
            ref={frame}
            className="hairline relative aspect-[4/5] w-full cursor-ew-resize ring-brand ring-offset-4 ring-offset-ink has-[input:focus-visible]:ring-2 touch-pan-y overflow-hidden rounded-[26px] bg-graphite select-none sm:aspect-[16/10]"
            onPointerDown={(e) => {
              dragging.current = true;
              touched.current = true;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              setFromX(e.clientX);
            }}
            onPointerMove={(e) => dragging.current && setFromX(e.clientX)}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
          >
            <img src={asset(media.before)} alt="Carro antes do serviço, com poeira e barro na lataria" className="absolute inset-0 h-full w-full object-cover" draggable={false} loading="lazy" />
            <motion.img
              style={{ clipPath: clip }}
              src={asset(media.after)}
              alt="O mesmo carro depois do serviço, com a pintura limpa e brilhante"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
              loading="lazy"
            />

            <span className="glass absolute left-5 top-5 rounded-full px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-chrome uppercase">Antes</span>
            <span className="absolute right-5 top-5 rounded-full bg-brand px-4 py-1.5 font-mono text-[10px] tracking-[0.2em] text-ink uppercase">Depois</span>

            <motion.div style={{ left }} className="pointer-events-none absolute inset-y-0 -translate-x-1/2">
              <div className="h-full w-px bg-gradient-to-b from-white/0 via-white to-white/0 shadow-[0_0_24px_rgba(255,255,255,0.6)]" />
              <div className="glass absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                <svg viewBox="0 0 28 14" className="h-3.5 w-7 text-white" fill="none" aria-hidden>
                  <path d="M6 1 1 7l5 6M22 1l5 6-5 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </motion.div>

            {/* controle acessível por teclado e leitores de tela */}
            <input
              type="range"
              min={0}
              max={100}
              value={value}
              onChange={(e) => {
                touched.current = true;
                pos.set(Number(e.target.value));
              }}
              aria-label="Comparar antes e depois"
              className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
              onPointerDown={(e) => e.preventDefault()}
            />
          </div>
        </Reveal>

        <div className="mt-14 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <ol className="grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 0.1} className="border-t border-white/10 pt-5">
                <span className="font-mono text-xs text-brand">{s.n}</span>
                <h3 className="mt-3 text-lg font-medium text-white">{s.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-silver">{s.d}</p>
              </Reveal>
            ))}
          </ol>
          <Reveal delay={0.3}>
            <Button size="lg" onClick={() => requestBooking('estetica-completa')}>
              Quero esse resultado <Arrow />
            </Button>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
