'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import { interpolate, motion, useScroll, useTransform, type MotionValue } from 'framer-motion';
import { asset, media, site } from '@/lib/site';
import { requestBooking } from '@/lib/booking';
import { scrollToId } from '@/lib/scroll';
import { Arrow, Button } from '../ui/Button';

const HeroScene = dynamic(() => import('../three/HeroScene'), { ssr: false });

const CHAPTERS = [
  {
    at: [0.2, 0.28, 0.42, 0.5],
    index: '01',
    label: 'Pintura',
    title: ['Brilho com', 'profundidade.'],
    text: 'Correção técnica e proteção cerâmica devolvem à pintura um reflexo espelhado, painel por painel.',
    spec: 'Polimento técnico · Vitrificação',
    side: 'left' as const,
  },
  {
    at: [0.5, 0.57, 0.7, 0.76],
    index: '02',
    label: 'Rodas',
    title: ['Cada raio,', 'cada detalhe.'],
    text: 'Descontaminação de rodas, pinças e caixas com ferramentas dedicadas e produtos de pH controlado.',
    spec: 'Lavagem detalhada · Descontaminação',
    side: 'right' as const,
  },
  {
    at: [0.76, 0.82, 0.92, 0.97],
    index: '03',
    label: 'Interior',
    title: ['Como saiu', 'da fábrica.'],
    text: 'Higienização a vapor, hidratação de couro e ozonização para um interior limpo de verdade.',
    spec: 'Higienização interna · Bancos',
    side: 'left' as const,
  },
];

/**
 * Mapeia o progresso do scroll em JS (forma em função). Evita o atalho de aceleração por
 * ScrollTimeline do framer-motion, que calcula errado a opacidade com offsets de seção.
 */
function useRange<T extends number | string>(mv: MotionValue<number>, input: number[], output: T[]) {
  const map = interpolate(input, output) as (v: number) => T;
  return useTransform(mv, (v) => map(v));
}

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

function Chapter({ c, progress }: { c: (typeof CHAPTERS)[number]; progress: MotionValue<number> }) {
  const opacity = useRange(progress, c.at, [0, 1, 1, 0]);
  const y = useRange(progress, c.at, [40, 0, 0, -40]);
  const blurPx = useRange(progress, c.at, [10, 0, 0, 10]);
  const blur = useTransform(blurPx, (v) => `blur(${v}px)`);
  return (
    <motion.div
      style={{ opacity, y, filter: blur }}
      className={`pointer-events-none absolute bottom-[12vh] max-w-[420px] px-5 md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:px-0 ${
        c.side === 'left' ? 'left-0 md:left-16 lg:left-24' : 'left-0 md:left-auto md:right-24 lg:right-32'
      }`}
    >
      <div className="mb-5 flex items-center gap-4">
        <span className="font-mono text-xs text-brand">{c.index}</span>
        <span className="h-px w-10 bg-white/25" />
        <span className="eyebrow">{c.label}</span>
      </div>
      <h2 className="display text-[clamp(2.4rem,5vw,4.4rem)] text-white">
        {c.title.map((l) => (
          <span key={l} className="block">
            {l}
          </span>
        ))}
      </h2>
      <p className="mt-5 text-base leading-relaxed text-chrome/75 md:text-lg">{c.text}</p>
      <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-silver uppercase">{c.spec}</p>
    </motion.div>
  );
}

function ProgressRail({ progress }: { progress: MotionValue<number> }) {
  const scaleY = useRange(progress, [0, 1], [0, 1]);
  return (
    <div className="pointer-events-none absolute right-6 top-1/2 hidden h-[38vh] -translate-y-1/2 md:block lg:right-10">
      <div className="relative h-full w-px bg-white/10">
        <motion.div style={{ scaleY }} className="absolute inset-0 origin-top bg-brand" />
      </div>
      {['Início', ...CHAPTERS.map((c) => c.label)].map((l, i) => (
        <span
          key={l}
          className="absolute right-4 -translate-y-1/2 font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-silver/70 uppercase"
          style={{ top: `${(i / 3) * 100}%` }}
        >
          {l}
        </span>
      ))}
    </div>
  );
}

export function Hero({ onSceneReady }: { onSceneReady: () => void }) {
  const wrap = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ['start start', 'end end'] });
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const ok = hasWebGL();
    setWebgl(ok);
    if (!ok) onSceneReady();
  }, [onSceneReady]);

  // pausa a renderização 3D quando a seção sai da tela
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '100px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const heroOpacity = useRange(scrollYProgress, [0, 0.12], [1, 0]);
  const heroY = useRange(scrollYProgress, [0, 0.12], [0, -80]);
  const videoOpacity = useRange(scrollYProgress, [0.04, 0.16], [1, 0]);
  const shade = useRange(scrollYProgress, [0, 0.15, 0.9, 1], [1, 0.55, 0.55, 1]);
  const cueOpacity = useRange(scrollYProgress, [0, 0.04], [1, 0]);

  return (
    <section id="topo" ref={wrap} className="relative h-[420vh]" aria-label="Apresentação">
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
        {/* Cena 3D */}
        <div className="absolute inset-0">
          {webgl ? (
            <HeroScene progress={scrollYProgress} active={active} onReady={onSceneReady} />
          ) : (
            webgl === false && <img src={asset(media.heroPoster)} alt="" className="h-full w-full object-cover" />
          )}
        </div>

        {/* Vídeo de fundo opcional (quando o cliente tiver a filmagem real) */}
        {media.heroVideo && (
          <motion.video
            style={{ opacity: videoOpacity }}
            className="absolute inset-0 h-full w-full object-cover"
            src={asset(media.heroVideo)}
            poster={asset(media.heroPoster)}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        )}

        {/* Vinhetas para leitura do texto */}
        <motion.div style={{ opacity: shade }} className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink/80 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-[45vh] bg-gradient-to-t from-ink via-ink/60 to-transparent" />
          <div className="absolute inset-y-0 left-0 hidden w-[55%] bg-gradient-to-r from-ink/80 via-ink/30 to-transparent md:block" />
        </motion.div>

        {/* Conteúdo do hero */}
        <motion.div style={{ opacity: heroOpacity, y: heroY }} className="absolute inset-x-0 bottom-0 mx-auto max-w-[1440px] px-5 pb-[max(env(safe-area-inset-bottom),9vh)] md:px-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-7 flex items-center gap-4"
          >
            <span className="h-px w-10 bg-brand" />
            <span className="eyebrow text-chrome/80">{site.fullName} · {site.tagline}</span>
          </motion.div>

          <h1 className="display max-w-[14ch] text-[clamp(2.9rem,7vw,6.6rem)] text-white">
            {['Seu carro merece', 'uma nova', 'experiência.'].map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.06em]">
                <motion.span
                  className={`block ${i === 2 ? 'chrome-text' : ''}`}
                  initial={{ y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.4, delay: 2 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                >
                  {l}
                </motion.span>
              </span>
            ))}
          </h1>

          <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 2.45, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-md text-lg leading-relaxed text-chrome/75 md:text-xl"
            >
              Tecnologia, cuidado e excelência em cada detalhe.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 2.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Button size="lg" onClick={() => requestBooking()}>
                Agendar experiência <Arrow />
              </Button>
              <Button size="lg" variant="ghost" onClick={() => scrollToId('servicos', -20)}>
                Conhecer serviços
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Indicação de scroll */}
        <motion.div style={{ opacity: cueOpacity }} className="pointer-events-none absolute right-6 bottom-8 hidden items-center gap-3 md:flex lg:right-10">
          <span className="font-mono text-[10px] tracking-[0.24em] text-silver uppercase">Role para explorar</span>
          <span className="relative block h-10 w-px overflow-hidden bg-white/15">
            <span className="absolute inset-x-0 top-0 h-4 animate-[scrollcue_2.2s_ease-in-out_infinite] bg-brand" />
          </span>
        </motion.div>

        {CHAPTERS.map((c) => (
          <Chapter key={c.index} c={c} progress={scrollYProgress} />
        ))}
        <ProgressRail progress={scrollYProgress} />
      </div>
    </section>
  );
}
