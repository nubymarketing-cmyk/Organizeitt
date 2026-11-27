'use client';

import { useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  href?: string;
  onClick?: () => void;
  className?: string;
  size?: 'md' | 'lg';
  external?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  ariaLabel?: string;
};

/** Botão magnético: acompanha levemente o cursor, com brilho que percorre a superfície. */
export function Button({ children, variant = 'primary', href, onClick, className = '', size = 'md', external, disabled, type = 'button', ariaLabel }: Props) {
  const ref = useRef<HTMLElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.18);
    y.set((e.clientY - r.top - r.height / 2) * 0.28);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const base =
    'group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full font-medium tracking-tight transition-[background,color,box-shadow,opacity] duration-500 select-none disabled:opacity-40 disabled:pointer-events-none';
  const sizes = size === 'lg' ? 'h-14 px-8 text-[15px]' : 'h-11 px-6 text-sm';
  const variants =
    variant === 'primary'
      ? 'bg-brand text-ink shadow-[0_0_0_1px_rgba(248,210,17,0.4),0_10px_40px_-10px_rgba(248,210,17,0.55)] hover:shadow-[0_0_0_1px_rgba(248,210,17,0.7),0_14px_50px_-8px_rgba(248,210,17,0.75)]'
      : 'glass text-chrome hover:bg-white/10';

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-[900ms] ease-out group-hover:translate-x-full" />
      <span className="relative z-10 flex items-center gap-3">{children}</span>
    </>
  );

  const props = {
    ref: ref as never,
    onPointerMove: onMove,
    onPointerLeave: reset,
    style: { x: sx, y: sy },
    className: `${base} ${sizes} ${variants} ${className}`,
    'aria-label': ariaLabel,
  };

  if (href) {
    return (
      <motion.a href={href} {...props} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})} onClick={onClick}>
        {content}
      </motion.a>
    );
  }
  return (
    <motion.button type={type} onClick={onClick} disabled={disabled} {...props}>
      {content}
    </motion.button>
  );
}

/** Seta fina desenhada à mão, usada em todos os CTAs. */
export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={`h-4 w-4 transition-transform duration-500 group-hover:translate-x-1 ${className}`} fill="none" aria-hidden>
      <path d="M3 10h13M11 4.5 16.5 10 11 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
