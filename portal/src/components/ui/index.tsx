import {
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import type { PostStatus } from '../../types/database';
import { CLIENT_STATUS_LABEL, STATUS_DOT, STATUS_LABEL, STATUS_STYLE } from '../../lib/format';
import { useSignedUrl } from '../../hooks/useSignedUrl';
import { parseDemoMedia } from '../../services/storage';
import { Icon, type IconName } from '../icons';
import { Illustration, type IllustrationName } from '../Illustration';

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ');
}

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  variant = 'primary',
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  const styles: Record<Variant, string> = {
    primary: 'bg-brand text-brand-fg shadow-sm hover:bg-brand/90',
    secondary: 'bg-surface text-fg border border-line shadow-sm hover:bg-surface-2',
    ghost: 'text-link hover:bg-fg/5',
    danger: 'bg-bad/10 text-bad border border-bad/30 hover:bg-bad/15',
  };
  return (
    <button
      className={cx(
        'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-surface p-4 shadow-sm', className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-fg/[.07]', className)} />;
}

/** Enquanto a página carrega (código dividido por página). */
export function PageFallback() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32" />
      <Skeleton className="h-24" />
    </div>
  );
}

export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );
}

/** Estado vazio: ilustração (ou ícone), título, orientação e uma ação clara. */
export function EmptyState({
  title,
  text,
  action,
  icon = 'inbox',
  illustration,
}: {
  title: string;
  text?: string;
  action?: ReactNode;
  icon?: IconName;
  illustration?: IllustrationName;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/50 px-5 py-10 text-center">
      {illustration ? (
        <Illustration name={illustration} className="mx-auto mb-4 h-24 w-32" />
      ) : (
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand/10 text-link">
          <Icon name={icon} />
        </div>
      )}
      <p className="font-display text-base font-bold text-fg">{title}</p>
      {text ? <p className="mx-auto mt-1 max-w-xs text-sm text-muted">{text}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Algo deu errado. Tente de novo em instantes.';
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-bad/30 bg-bad/10 px-5 py-6 text-center">
      <p className="font-semibold text-fg">Não deu para carregar.</p>
      <p className="mt-1 text-sm text-muted">{errorMessage(error)}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-4" onClick={onRetry}>
          Tentar de novo
        </Button>
      ) : null}
    </div>
  );
}

export function InlineError({ error }: { error: unknown }) {
  if (!error) return null;
  return <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{errorMessage(error)}</p>;
}

/** Chip de status do post, com bolinha na cor do status. friendly: nomes do portal do cliente. */
export function StatusBadge({ status, friendly }: { status: PostStatus; friendly?: boolean }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold', STATUS_STYLE[status])}>
      <span className={cx('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} aria-hidden />
      {(friendly ? CLIENT_STATUS_LABEL : STATUS_LABEL)[status]}
    </span>
  );
}

/** Mesmo componente com o nome do design system. */
export const StatusChip = StatusBadge;

type Tone = 'neutral' | 'brand' | 'ok' | 'warn' | 'bad' | 'info';
const TONE: Record<Tone, string> = {
  neutral: 'bg-fg/[.06] text-muted',
  brand: 'bg-brand/10 text-link',
  ok: 'bg-ok/10 text-ok',
  warn: 'bg-warn/10 text-warn',
  bad: 'bg-bad/10 text-bad',
  info: 'bg-info/10 text-info',
};

/** Etiqueta curta (nicho, plano, pagamento). */
export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', TONE[tone], className)}>{children}</span>;
}

/** Abas com rolagem horizontal limpa (sem barra nem setas do navegador). */
export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: Array<[T, string]>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <div role="tablist" className="flex min-w-max gap-1 border-b border-line">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={value === k}
            onClick={() => onChange(k)}
            className={cx(
              '-mb-px min-h-[44px] whitespace-nowrap border-b-2 px-4 text-sm font-semibold transition',
              value === k ? 'border-brand text-fg' : 'border-transparent text-muted hover:text-fg',
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Botões lado a lado para alternar visões (Calendário / Lista). */
export function Segmented<T extends string>({ options, value, onChange }: { options: Array<[T, string, IconName?]>; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-surface p-1 shadow-sm">
      {options.map(([k, label, icon]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          aria-pressed={value === k}
          className={cx(
            'inline-flex min-h-[36px] items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition',
            value === k ? 'bg-brand text-brand-fg' : 'text-muted hover:text-fg',
          )}
        >
          {icon ? <Icon name={icon} className="h-4 w-4" /> : null}
          {label}
        </button>
      ))}
    </div>
  );
}

export interface DropdownOption {
  value: string;
  label: string;
  /** Bolinha de cor ao lado do nome (cliente, status). */
  dot?: string;
}

/**
 * Dropdown no lugar do select nativo.
 * Filtro (padrão): mostra o rótulo no valor "all" e fica destacado quando há filtro ativo.
 * Campo (field): sempre mostra a opção escolhida, ou o placeholder, como um input de formulário.
 */
export function Dropdown({
  label,
  value,
  options,
  onChange,
  allLabel,
  field,
  placeholder,
  disabled,
}: {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  /** Opção "todos" (valor "all"). */
  allLabel?: string;
  field?: boolean;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const all = allLabel ? [{ value: 'all', label: allLabel }, ...options] : options;
  const current = all.find((o) => o.value === value);
  const active = field ? false : value !== 'all' && !!current;
  const shown = field ? (current?.label ?? placeholder ?? label) : active ? current!.label : label;

  // Setas movem entre as opções; a lista abre focando a opção escolhida.
  const focusOption = (dir: 1 | -1 | 0) => {
    const items = Array.from(box.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    if (!items.length) return;
    const i = items.findIndex((el) => el === document.activeElement);
    const start = i === -1 ? Math.max(0, items.findIndex((el) => el.getAttribute('aria-selected') === 'true')) : i;
    items[dir === 0 ? start : (start + dir + items.length) % items.length]?.focus();
  };
  useEffect(() => {
    if (open) requestAnimationFrame(() => focusOption(0));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={box} className={cx('relative', open && 'z-50')}>
      {open ? (
        // Fundo levemente escurecido: o que está atrás da lista não disputa a leitura.
        <div className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[3px] sm:bg-black/15" aria-hidden onMouseDown={() => setOpen(false)} />
      ) : null}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={field ? `${label}: ${shown}` : label}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={cx(
          'inline-flex w-full items-center justify-between gap-2 rounded-xl border px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-60',
          // Só o filtro aberto fica acima do fundo desfocado.
          open && 'relative z-50',
          field ? 'min-h-[44px] border-line bg-surface text-fg' : 'min-h-[40px] font-medium',
          !field && (active ? 'border-brand/40 bg-brand/10 text-fg' : 'border-line bg-surface text-muted hover:text-fg'),
          field && !current && 'text-dim',
        )}
      >
        <span className="flex min-w-0 items-center gap-2 truncate">
          {(field || active) && current?.dot ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: current.dot }} /> : null}
          <span className="truncate">{shown}</span>
        </span>
        <Icon name="chevronDown" className="h-4 w-4 shrink-0" />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={label}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              focusOption(e.key === 'ArrowDown' ? 1 : -1);
            }
          }}
          className={cx(
            'z-50 overflow-y-auto border border-line bg-surface p-1 shadow-lg',
            // Celular: gaveta na parte de baixo da tela. Computador: lista logo abaixo do botão.
            'fixed inset-x-0 bottom-0 max-h-[70vh] rounded-t-2xl pb-[calc(0.5rem+env(safe-area-inset-bottom))]',
            'sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:mt-1 sm:max-h-72 sm:min-w-full sm:rounded-xl sm:pb-1',
          )}
        >
          <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted sm:hidden">{label}</p>
          {all.map((o) => (
            <button
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                box.current?.querySelector<HTMLButtonElement>('button')?.focus();
              }}
              className={cx(
                'flex min-h-[40px] w-full items-center gap-2 whitespace-nowrap rounded-lg px-3 text-left text-sm outline-none focus-visible:bg-fg/5',
                o.value === value ? 'bg-brand/10 font-semibold text-fg' : 'text-fg hover:bg-fg/5',
              )}
            >
              {o.dot ? <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: o.dot }} /> : <span className="w-2" />}
              <span className="flex-1">{o.label}</span>
              {o.value === value ? <Icon name="check" className="h-4 w-4 text-link" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Rótulo + controle. Use group para controles que não são input (Dropdown, listas). */
export function Field({ label, hint, children, group }: { label: string; hint?: string; children: ReactNode; group?: boolean }) {
  const Tag = group ? 'div' : 'label';
  return (
    <Tag className="block">
      <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-dim">{hint}</span> : null}
    </Tag>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-fg shadow-sm placeholder:text-dim focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, 'min-h-[96px]', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cx(inputCls, 'appearance-none pr-9', props.className)} />
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-5 shadow-lg sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-fg">{title}</h2>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:bg-fg/5 hover:text-fg" onClick={onClose} aria-label="Fechar">
            <Icon name="x" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const DEMO_BG: Record<string, string> = {
  violet: 'from-violet/70 to-violet/20',
  azure: 'from-azure/70 to-azure/20',
  teal: 'from-teal/60 to-teal/15',
};

/** Mostra uma mídia do bucket post-media (imagem, vídeo ou bloco de demonstração). */
export function MediaView({ path, className }: { path: string; className?: string }) {
  const demo = parseDemoMedia(path);
  const url = useSignedUrl('post-media', demo ? null : path);
  if (demo) {
    return (
      <div className={cx('flex items-center justify-center bg-gradient-to-br text-xs font-semibold text-white/80', DEMO_BG[demo.color] ?? DEMO_BG.violet, className)}>
        {demo.label}
      </div>
    );
  }
  if (url.isLoading) return <Skeleton className={className} />;
  if (!url.data) {
    return <div className={cx('flex items-center justify-center bg-fg/5 text-xs text-dim', className)}>mídia indisponível</div>;
  }
  const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(path);
  return isVideo ? (
    <video src={url.data} className={cx('object-cover', className)} controls playsInline />
  ) : (
    <img src={url.data} alt="" className={cx('object-cover', className)} />
  );
}

/** Ação com confirmação na própria tela (sem caixa de diálogo do navegador). */
export function ConfirmButton({
  label,
  question,
  confirmLabel,
  onConfirm,
  variant = 'secondary',
  loading,
  disabled,
}: {
  label: string;
  question: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant={variant} loading={loading} disabled={disabled} onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div className="w-full space-y-2 rounded-xl border border-line bg-fg/[.04] p-3">
      <p className="text-sm text-fg">{question}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setAsking(false)}>
          Cancelar
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          loading={loading}
          onClick={() => {
            setAsking(false);
            onConfirm();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
