import { LineReveal, Reveal } from './Reveal';

type Props = { index: string; eyebrow: string; title: React.ReactNode[]; children?: React.ReactNode; align?: 'left' | 'split' };

export function SectionHeading({ index, eyebrow, title, children, align = 'split' }: Props) {
  return (
    <div className={align === 'split' ? 'grid gap-8 lg:grid-cols-12 lg:items-end' : 'max-w-3xl'}>
      <div className={align === 'split' ? 'lg:col-span-7' : ''}>
        <Reveal className="mb-6 flex items-center gap-4">
          <span className="font-mono text-xs text-brand">{index}</span>
          <span className="h-px w-10 bg-white/20" />
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <LineReveal lines={title} className="display text-[clamp(2.4rem,6vw,5.2rem)] text-white" />
      </div>
      {children && (
        <Reveal delay={0.15} className={align === 'split' ? 'lg:col-span-4 lg:col-start-9' : 'mt-6'}>
          <div className="text-base leading-relaxed text-silver md:text-lg">{children}</div>
        </Reveal>
      )}
    </div>
  );
}
