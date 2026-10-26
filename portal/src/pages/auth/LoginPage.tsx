import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useOpenMagicLinkDemo, usePasswordSignIn, useSendMagicLink, useSession } from '../../hooks/useAuth';
import { ROLE_LABEL } from '../../lib/format';
import { isStaffRole } from '../../lib/roles';
import { IS_DEMO, listDemoUsers, resetDemo } from '../../services/auth';
import { Button, InlineError, Input } from '../../components/ui';
import { Logo } from '../../components/layout/Logo';

export function LoginPage() {
  const session = useSession();
  const navigate = useNavigate();
  const send = useSendMagicLink();
  const openDemo = useOpenMagicLinkDemo();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [linkError] = useState(readLinkError);
  // Clínicas entram pelo link; a equipe da agência pode usar senha.
  const [mode, setMode] = useState<'link' | 'senha'>('link');
  const [password, setPassword] = useState('');
  const passwordSignIn = usePasswordSignIn();

  if (session.data) return <Navigate to={isStaffRole(session.data.role) ? '/agencia' : '/app'} replace />;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'senha') passwordSignIn.mutate({ email, password });
    else send.mutate(email, { onSuccess: () => setSentTo(email.trim().toLowerCase()) });
  };

  const enter = (address: string) =>
    openDemo.mutate(address, {
      onSuccess: (p) => navigate(isStaffRole(p.role) ? '/agencia' : '/app', { replace: true }),
    });

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-night px-5 py-10">
      <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-violet/35 blur-[80px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-azure/25 blur-[80px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-10 text-center">
          <Logo />
          <p className="mt-3 font-display text-xl font-bold text-white">Portal do cliente</p>
          <p className="mt-1 text-sm text-muted">Calendário, aprovações, relatórios e arquivos num lugar só.</p>
        </div>

        {sentTo ? (
          <div className="rounded-2xl border border-line bg-card p-5 text-center">
            <p className="font-semibold text-white">Confira seu e-mail</p>
            <p className="mt-1 text-sm text-muted">
              Se <span className="text-white">{sentTo}</span> tiver convite, o link de acesso chega em instantes.
            </p>
            {IS_DEMO ? (
              <>
                <Button variant="secondary" className="mt-4 w-full" loading={openDemo.isPending} onClick={() => enter(sentTo)}>
                  Abrir o link (demonstração)
                </Button>
                <InlineError error={openDemo.error} />
              </>
            ) : null}
            <button className="mt-3 text-xs text-lilac" onClick={() => setSentTo(null)}>
              Usar outro e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {mode === 'senha' ? (
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            ) : null}
            <Button type="submit" className="w-full py-3" loading={send.isPending || passwordSignIn.isPending}>
              {mode === 'senha' ? 'Entrar' : 'Receber link de acesso'}
            </Button>
            <InlineError error={(mode === 'senha' ? passwordSignIn.error : send.error) ?? linkError} />
            {!IS_DEMO ? (
              <button
                type="button"
                className="block min-h-[44px] w-full text-center text-sm text-lilac"
                onClick={() => setMode(mode === 'senha' ? 'link' : 'senha')}
              >
                {mode === 'senha' ? 'Entrar sem senha, com link no e-mail' : 'Sou da agência, entrar com senha'}
              </button>
            ) : null}
            <p className="text-center text-xs text-dim">
              {mode === 'senha' ? 'Esqueceu a senha? Use o link no e-mail.' : 'Clínicas entram sem senha, pelo convite da agência.'}
            </p>
          </form>
        )}

        {!IS_DEMO ? (
          <p className="mt-6 text-center text-sm text-muted">
            Tem uma agência?{' '}
            <Link to="/cadastro" className="text-lilac">
              Crie sua conta grátis
            </Link>
          </p>
        ) : null}

        {IS_DEMO ? (
          <div className="mt-10 rounded-2xl border border-dashed border-line p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-dim">Modo demonstração · entrar como</p>
            <div className="space-y-2">
              {listDemoUsers().map((u) => (
                <button
                  key={u.id}
                  onClick={() => enter(u.email)}
                  className="flex w-full items-center justify-between rounded-xl bg-white/[.04] px-3 py-2 text-left text-sm hover:bg-white/[.08]"
                >
                  <span className="text-white">{u.full_name}</span>
                  <span className="text-xs text-muted">{ROLE_LABEL[u.role]}</span>
                </button>
              ))}
            </div>
            <button className="mt-3 text-xs text-dim underline-offset-2 hover:underline" onClick={resetDemo}>
              Restaurar dados de exemplo
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Link mágico vencido ou e-mail sem convite: o Supabase volta para cá com o erro na URL. */
function readLinkError(): Error | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, '') || window.location.search);
  if (!params.get('error') && !params.get('error_description')) return null;
  window.history.replaceState(null, '', window.location.pathname);
  return new Error(
    params.get('error_code') === 'otp_expired'
      ? 'O link de acesso venceu ou já foi usado. Peça um novo abaixo.'
      : 'Não foi possível entrar com este link. Confira se o e-mail tem convite da agência e peça um novo.',
  );
}
