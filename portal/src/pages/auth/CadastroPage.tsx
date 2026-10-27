import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSession, useSignUpAgency } from '../../hooks/useAuth';
import { isStaffRole } from '../../lib/roles';
import { IS_DEMO } from '../../services/auth';
import { Button, Field, InlineError, Input } from '../../components/ui';
import { Logo } from '../../components/layout/Logo';

/** Cadastro de agência: cria a agência e o admin, com 14 dias de teste no plano Pro. */
export function CadastroPage() {
  const session = useSession();
  const navigate = useNavigate();
  const signUp = useSignUpAgency();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [confirmTo, setConfirmTo] = useState<string | null>(null);

  if (session.data) return <Navigate to={isStaffRole(session.data.role) ? '/agencia' : '/app'} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    signUp.mutate(form, {
      onSuccess: (r) => (r.signedIn ? navigate('/agencia/boas-vindas', { replace: true }) : setConfirmTo(form.email.trim().toLowerCase())),
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-5 py-10">

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Logo />
          <p className="mt-3 font-display text-xl font-bold text-fg">Crie a conta da sua agência</p>
          <p className="mt-1 text-sm text-muted">14 dias grátis no plano Pro. Sem cartão.</p>
        </div>

        {confirmTo ? (
          <div className="rounded-2xl border border-line bg-card p-5 text-center">
            <p className="font-semibold text-fg">Confirme seu e-mail</p>
            <p className="mt-1 text-sm text-muted">
              Mandamos um link para <span className="text-fg">{confirmTo}</span>. Clique nele para entrar e configurar a agência.
            </p>
            <Link to="/login" className="mt-4 block text-sm text-lilac">
              Ir para o login
            </Link>
          </div>
        ) : IS_DEMO ? (
          <p className="rounded-2xl border border-line bg-card p-5 text-center text-sm text-muted">
            O cadastro de agência funciona só com o Supabase ligado.
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-line bg-surface p-5 shadow-md">
            <Field label="Nome da agência">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="organization" required autoFocus />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Senha" hint="Pelo menos 8 caracteres.">
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </Field>
            <InlineError error={signUp.error} />
            <Button type="submit" className="w-full py-3" loading={signUp.isPending}>
              Criar conta
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted">
          Já tem conta?{' '}
          <Link to="/login" className="text-lilac">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
