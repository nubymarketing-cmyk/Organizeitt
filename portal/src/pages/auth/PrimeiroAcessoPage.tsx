import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useClaimAccess, useSession } from '../../hooks/useAuth';
import { isStaffRole } from '../../lib/roles';
import { Button, Field, InlineError, Input } from '../../components/ui';
import { Logo } from '../../components/layout/Logo';

/** Criar a senha com o código de acesso que a agência passou. Serve também para senha esquecida. */
export function PrimeiroAcessoPage() {
  const session = useSession();
  const claim = useClaimAccess();
  const [form, setForm] = useState({ email: '', code: '', password: '', confirm: '' });
  const mismatch = form.confirm.length > 0 && form.confirm !== form.password;

  if (session.data) return <Navigate to={isStaffRole(session.data.role) ? '/agencia' : '/app'} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!mismatch) claim.mutate({ email: form.email, code: form.code, password: form.password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-night px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo />
          <p className="mt-3 font-display text-xl font-bold text-fg">Crie sua senha</p>
          <p className="mt-1 text-sm text-muted">Use o código de acesso que a agência te passou.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-md">
          <Field label="E-mail">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoFocus
            />
          </Field>
          <Field label="Código de acesso" hint="6 letras e números.">
            <Input
              autoComplete="one-time-code"
              autoCapitalize="characters"
              maxLength={8}
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              className="text-center text-lg tracking-[0.3em]"
              required
            />
          </Field>
          <Field label="Crie uma senha" hint="Pelo menos 8 caracteres.">
            <Input
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </Field>
          <Field label="Repita a senha">
            <Input type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} required />
          </Field>
          {mismatch ? <p className="text-sm text-bad">As senhas não são iguais.</p> : null}
          <InlineError error={claim.error} />
          <Button type="submit" className="w-full py-3" loading={claim.isPending} disabled={mismatch}>
            Criar senha e entrar
          </Button>
          <p className="text-center text-xs text-dim">Esqueceu a senha? Peça um código novo à agência e crie outra aqui.</p>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Já tem senha?{' '}
          <Link to="/login" className="text-link">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
