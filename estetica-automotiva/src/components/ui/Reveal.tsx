'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';

type Props = HTMLMotionProps<'div'> & { delay?: number; y?: number; as?: 'div' | 'li' };

/** Entrada suave ao rolar: sobe, ganha nitidez e opacidade. */
export function Reveal({ delay = 0, y = 28, as = 'div', children, ...rest }: Props) {
  const Comp = (as === 'li' ? motion.li : motion.div) as typeof motion.div;
  return (
    <Comp
      initial={{ opacity: 0, y, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 1.1, delay, ease: [0.16, 1, 0.3, 1] }}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * Título que entra linha por linha, com máscara.
 * A observação de visibilidade fica no elemento pai (o texto mascarado não "aparece" para o IntersectionObserver).
 */
export function LineReveal({ lines, className = '', delay = 0, as = 'h2' }: { lines: React.ReactNode[]; className?: string; delay?: number; as?: 'h1' | 'h2' | 'h3' }) {
  const Tag = (as === 'h1' ? motion.h1 : as === 'h3' ? motion.h3 : motion.h2) as typeof motion.h2;
  return (
    <Tag className={className} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -10% 0px' }}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.08em] -mb-[0.08em]">
          <motion.span
            className="block"
            variants={{ hidden: { y: '110%' }, show: { y: '0%' } }}
            transition={{ duration: 1.2, delay: delay + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
