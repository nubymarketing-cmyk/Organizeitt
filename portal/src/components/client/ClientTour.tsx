import { useState } from 'react';
import { Button } from '../ui';

export const TOUR_STEPS = [
  {
    tab: '/app',
    title: 'Aprovar posts',
    text: 'Quando a equipe preparar um post, ele aparece no Início. Toque em "Revisar agora", veja como vai ficar e aprove ou peça um ajuste.',
  },
  {
    tab: '/app/resultados',
    title: 'Ver resultados',
    text: 'Em Resultados você vê quantas pessoas viram seus posts, os novos seguidores e os pacientes que chamaram, mês a mês.',
  },
  {
    tab: '/app/arquivos',
    title: 'Seus arquivos',
    text: 'Em Arquivos ficam o logo, as artes e as fotos da clínica, sempre à mão quando precisar.',
  },
];

/** Tour de 3 passos do primeiro acesso. Pode ser pulado e reaberto em "Ajuda". */
export function ClientTour({ onStep, onClose }: { onStep: (tab: string) => void; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = TOUR_STEPS[step];
  const last = step === TOUR_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Como usar o portal">
      <div className="mx-auto mb-24 w-full max-w-md px-4">
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-lilac">
            Passo {step + 1} de {TOUR_STEPS.length}
          </p>
          <h2 className="mt-1 font-display text-xl font-extrabold text-white">{s.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{s.text}</p>
          <div className="mt-4 flex gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={i === step ? 'h-1.5 w-6 rounded-full bg-brand' : 'h-1.5 w-1.5 rounded-full bg-white/20'} />
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={onClose}>
              {last ? 'Fechar' : 'Pular'}
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                if (last) return onClose();
                onStep(TOUR_STEPS[step + 1].tab);
                setStep(step + 1);
              }}
            >
              {last ? 'Começar' : 'Próximo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
