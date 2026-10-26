import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import type { PostStatus } from '../../types/database';
import { CLIENT_STATUS_LABEL, STATUS_LABEL, STATUS_STYLE } from '../../lib/format';
import { useSignedUrl } from '../../hooks/useSignedUrl';
import { parseDemoMedia } from '../../services/storage';

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
    primary: 'bg-brand text-white shadow-[0_10px_30px_-12px_rgba(139,92,246,.8)]',
    secondary: 'bg-white/[.06] text-white border border-line',
    ghost: 'text-lilac hover:text-teal',
    danger: 'bg-bad/15 text-bad border border-bad/30',
  };
  return (
    <button
      className={cx(
        'inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : null}
      {children}
    </button>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-2xl border border-line bg-card p-4', className)}>{children}</div>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-white/[.07]', className)} />;
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

export function EmptyState({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/[.06] text-lilac">✓</div>
      <p className="font-display text-base font-bold text-white">{title}</p>
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
      <p className="font-semibold text-white">Não deu para carregar.</p>
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

/** friendly: nomes do portal do cliente ("Esperando seu ok", "Já no ar"). */
export function StatusBadge({ status, friendly }: { status: PostStatus; friendly?: boolean }) {
  return (
    <span className={cx('inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold', STATUS_STYLE[status])}>
      {(friendly ? CLIENT_STATUS_LABEL : STATUS_LABEL)[status]}
    </span>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-extrabold text-white">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-dim">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  'w-full rounded-xl border border-line bg-white/[.04] px-3 py-2.5 text-sm text-white placeholder:text-dim focus:border-violet focus:outline-none';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputCls, props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputCls, 'min-h-[96px]', props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputCls, 'bg-panel', props.className)} />;
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-panel p-5 sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">{title}</h2>
          <button className="text-2xl leading-none text-muted" onClick={onClose} aria-label="Fechar">
            ×
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
    return <div className={cx('flex items-center justify-center bg-white/5 text-xs text-dim', className)}>mídia indisponível</div>;
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
    <div className="w-full space-y-2 rounded-xl border border-line bg-white/[.04] p-3">
      <p className="text-sm text-white">{question}</p>
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
