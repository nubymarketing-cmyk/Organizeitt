'use client';

import { motion } from 'framer-motion';
import { SectionHeading } from '../ui/SectionHeading';

/** Ícones desenhados para a marca: traço fino que se desenha ao entrar na tela. */
const ICONS: Record<string, string[]> = {
  produtos: [
    'M19 18h10v-4a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v4Z',
    'M17 18h14a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H17a3 3 0 0 1-3-3V21a3 3 0 0 1 3-3Z',
    'M21 12V8h8l5 3',
    'M19 28h10M19 33h6',
    'M40 10c1.5 2 2.2 3.3 2.2 4.4a2.2 2.2 0 0 1-4.4 0c0-1.1.7-2.4 2.2-4.4Z',
  ],
  tecnica: [
    'M24 38c7.7 0 14-6.3 14-14S31.7 10 24 10 10 16.3 10 24s6.3 14 14 14Z',
    'M24 31a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z',
    'M24 26a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    'M6 15a20 20 0 0 1 9-9M42 33a20 20 0 0 1-9 9',
  ],
  detalhe: [
    'M21 33a12 12 0 1 0 0-24 12 12 0 0 0 0 24Z',
    'M30 30l10 10',
    'M21 15v12M15 21h12',
    'M21 19.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
  ],
  atendimento: [
    'M20 22a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z',
    'M8 38c0-6.6 5.4-12 12-12s12 5.4 12 12',
    'M34 12h8v7h-4l-3 3v-3h-1z',
  ],
  agenda: [
    'M11 14h26a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V16a2 2 0 0 1 2-2Z',
    'M9 21h30',
    'M17 10v7M31 10v7',
    'M15 27h4M22 27h4M29 27h4M15 33h4M22 33h4',
    'M28.5 33.5l2 2 4-4',
  ],
  qualidade: [
    'M24 7l14 5v11c0 9-6 15.5-14 18-8-2.5-14-9-14-18V12l14-5Z',
    'M17.5 24.5l4.5 4.5 9-9.5',
  ],
};

const ITEMS = [
  { key: 'produtos', t: 'Produtos profissionais', d: 'Linhas importadas e nacionais de alta performance, com pH controlado e seguras para cada superfície.' },
  { key: 'tecnica', t: 'Técnicas especializadas', d: 'Protocolos de lavagem, correção e proteção aplicados por profissionais treinados e atualizados.' },
  { key: 'detalhe', t: 'Atenção aos detalhes', d: 'Frisos, emblemas, caixas de roda e saídas de ar. O que ninguém vê, nós cuidamos.' },
  { key: 'atendimento', t: 'Atendimento personalizado', d: 'Diagnóstico do seu carro e indicação do tratamento certo, sem empurrar serviço.' },
  { key: 'agenda', t: 'Agendamento simplificado', d: 'Escolha serviço, dia e horário pelo site e confirme direto no WhatsApp.' },
  { key: 'qualidade', t: 'Compromisso com a qualidade', d: 'Checklist de entrega e revisão final sob luz de inspeção em todos os serviços.' },
];

function Icon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" aria-hidden>
      {ICONS[name].map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ pathLength: { duration: 1.6, delay: 0.2 + i * 0.18, ease: [0.65, 0, 0.35, 1] }, opacity: { duration: 0.2, delay: 0.2 + i * 0.18 } }}
        />
      ))}
    </svg>
  );
}

export function Differentials() {
  return (
    <section id="diferenciais" className="relative mx-auto max-w-[1440px] px-5 py-28 md:px-10 md:py-40">
      <SectionHeading index="04" eyebrow="Diferenciais" title={['Por que escolher', 'a Impacto.']}>
        Não é só lavar. É um processo técnico, transparente e feito com o cuidado que o seu carro merece.
      </SectionHeading>

      <ul className="mt-16 grid gap-px overflow-hidden rounded-[26px] bg-white/[0.07] sm:grid-cols-2 md:mt-20 lg:grid-cols-3">
        {ITEMS.map((it, i) => (
          <motion.li
            key={it.key}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 1, delay: (i % 3) * 0.1 }}
            className="group relative overflow-hidden bg-ink p-8 md:p-10"
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-brand/0 blur-3xl transition-colors duration-700 group-hover:bg-brand/10" />
            <div className="relative flex items-start justify-between">
              <span className="text-chrome transition-colors duration-500 group-hover:text-brand">
                <Icon name={it.key} />
              </span>
              <span className="font-mono text-[11px] text-silver/60">{String(i + 1).padStart(2, '0')}</span>
            </div>
            <h3 className="relative mt-12 text-xl font-medium tracking-tight text-white">{it.t}</h3>
            <p className="relative mt-3 text-[15px] leading-relaxed text-silver">{it.d}</p>
            <span className="absolute inset-x-8 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-brand to-transparent transition-transform duration-700 group-hover:scale-x-100 md:inset-x-10" />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
