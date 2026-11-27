'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useProgress } from '@react-three/drei';
import { asset, site } from '@/lib/site';

/** Tela de abertura: logo, linha de progresso real do carregamento 3D e cortina. */
export function Loader({ ready }: { ready: boolean }) {
  const { progress } = useProgress();
  const [minTime, setMinTime] = useState(false);
  const [timeout, setTimeoutDone] = useState(false);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const a = window.setTimeout(() => setMinTime(true), 1400);
    const b = window.setTimeout(() => setTimeoutDone(true), 9000);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
  }, []);

  // contador suave
  useEffect(() => {
    let raf = 0;
    const target = ready ? 100 : Math.min(progress, 96);
    const tick = () => {
      setShown((v) => {
        const n = v + (target - v) * 0.08;
        return Math.abs(target - n) < 0.5 ? target : n;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress, ready]);

  const done = (ready && minTime && shown > 99) || timeout;

  useEffect(() => {
    document.documentElement.style.overflow = done ? '' : 'hidden';
    if (done) window.__lenis?.start();
    else window.__lenis?.stop();
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          initial={{ clipPath: 'inset(0 0 0% 0)' }}
          transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
          aria-live="polite"
          aria-label="Carregando"
        >
          <motion.img
            src={asset(site.logo)}
            alt={site.fullName}
            width={260}
            height={124}
            className="w-[200px] md:w-[260px]"
            initial={{ opacity: 0, scale: 0.96, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="mt-12 w-[220px]">
            <div className="h-px w-full overflow-hidden bg-white/10">
              <div className="h-full bg-brand transition-none" style={{ width: `${shown}%` }} />
            </div>
            <div className="mt-3 flex justify-between font-mono text-[10px] tracking-[0.24em] text-silver uppercase">
              <span>Preparando o estúdio</span>
              <span className="tabular-nums text-chrome">{String(Math.round(shown)).padStart(3, '0')}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
