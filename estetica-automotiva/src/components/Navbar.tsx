'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { asset, nav, site } from '@/lib/site';
import { scrollToId } from '@/lib/scroll';
import { requestBooking } from '@/lib/booking';
import { Arrow, Button } from './ui/Button';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (open) window.__lenis?.stop();
    else window.__lenis?.start();
  }, [open]);

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(false);
    scrollToId(href, -20);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-700 ${
          scrolled ? 'border-b border-white/[0.06] bg-ink/70 backdrop-blur-xl' : 'border-b border-transparent bg-transparent'
        }`}
      >
        <nav className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 md:px-10" aria-label="Principal">
          <a href="#topo" onClick={go('#topo')} className="relative z-10 flex items-center" aria-label={`${site.fullName}, voltar ao topo`}>
            <img src={asset(site.logo)} alt={site.fullName} width={124} height={59} className="h-10 w-auto md:h-11" />
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={go(n.href)}
                  className="group relative rounded-full px-4 py-2 text-[13px] text-chrome/70 transition-colors duration-300 hover:text-white"
                >
                  {n.label}
                  <span className="absolute inset-x-4 -bottom-0.5 h-px origin-left scale-x-0 bg-brand transition-transform duration-500 group-hover:scale-x-100" />
                </a>
              </li>
            ))}
          </ul>

          <div className="relative z-10 flex items-center gap-3">
            <Button onClick={() => requestBooking()} className="hidden sm:inline-flex">
              Agendar <Arrow />
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="glass flex h-11 w-11 items-center justify-center rounded-full lg:hidden"
              aria-expanded={open}
              aria-controls="menu-mobile"
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            >
              <span className="relative block h-3 w-5">
                <span className={`absolute left-0 top-0 h-px w-5 bg-white transition-transform duration-500 ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
                <span className={`absolute bottom-0 left-0 h-px w-5 bg-white transition-transform duration-500 ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-mobile"
            className="fixed inset-0 z-40 flex flex-col bg-ink/95 px-6 pb-10 pt-28 backdrop-blur-2xl lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="flex flex-col gap-2">
              {nav.map((n, i) => (
                <motion.li key={n.href} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}>
                  <a href={n.href} onClick={go(n.href)} className="display flex items-baseline gap-4 py-2 text-4xl text-white">
                    <span className="font-mono text-xs text-brand">{String(i + 1).padStart(2, '0')}</span>
                    {n.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <div className="mt-auto">
              <Button size="lg" className="w-full" onClick={() => { setOpen(false); requestBooking(); }}>
                Agendar experiência <Arrow />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
