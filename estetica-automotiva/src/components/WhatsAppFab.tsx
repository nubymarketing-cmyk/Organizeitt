'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { site, whatsappLink } from '@/lib/site';

export function WhatsAppFab() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > window.innerHeight * 0.8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.a
          href={whatsappLink(`Olá, ${site.fullName}! Quero agendar um horário.`)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar no WhatsApp"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="group fixed right-5 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-50 flex items-center gap-3 md:right-8 md:bottom-8"
        >
          <span className="glass pointer-events-none hidden translate-x-2 rounded-full px-4 py-2 text-sm text-white opacity-0 transition-all duration-500 group-hover:translate-x-0 group-hover:opacity-100 md:block">
            Agendar pelo WhatsApp
          </span>
          <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-brand text-ink shadow-[0_12px_40px_-8px_rgba(248,210,17,0.7)]">
            <span className="absolute inset-0 rounded-full border border-brand animate-[pulse-ring_2.4s_ease-out_infinite]" />
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z" />
            </svg>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
