import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from '../../hooks/useAuth';
import { useMyAgency } from '../../hooks/useAgency';
import { useCreateClient, useInviteUser } from '../../hooks/useClients';
import { completeOnboarding } from '../../services/agency';
import { Button, Card, ErrorState, Field, InlineError, Input, Skeleton, cx } from '../../components/ui';
import { BrandingForm } from './ConfiguracoesPage';

const STEPS = ['Sua marca', 'Primeiro cliente', 'Convidar a clínica'];

/** Onboarding da agência nova: marca, primeiro cliente e convite da clínica. Cada passo pode ser pulado. */
export function BoasVindasPage() {
  const { data: profile } = useSession();
  const agency = useMyAgency();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [client, setClient] = useState<{ id: string; name: string } | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<unknown>(null);

  if (profile && profile.role !== 'agency_admin') return <Navigate to="/agencia" replace />;
  if (agency.isLoading) return <Skeleton className="h-96" />;
  if (agency.isError || !agency.data) return <ErrorState error={agency.error} onRetry={() => agency.refetch()} />;

  const finish = async () => {
    setFinishing(true);
    setError(null);
    try {
      await completeOnboarding();
      await qc.invalidateQueries({ queryKey: ['agency'] });
      navigate('/agencia', { replace: true });
    } catch (e) {
      setError(e);
      setFinishing(false);
    }
  };
  const next = () => (step === STEPS.length - 1 ? void finish() : setStep(step + 1));

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-fg">Boas-vindas, {agency.data.name}</h1>
        <p className="text-sm text-muted">Três passos rápidos para deixar o portal pronto para suas clínicas.</p>
      </div>

      <ol className="flex gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1">
            <div className={cx('h-1.5 rounded-full', i <= step ? 'bg-brand' : 'bg-fg/10')} />
            <p className={cx('mt-1.5 text-xs', i === step ? 'font-semibold text-fg' : 'text-dim')}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <BrandingForm agency={agency.data} onSaved={next} saveLabel="Salvar e continuar" />
      ) : step === 1 ? (
        <FirstClient
          onCreated={(c) => {
            setClient(c);
            next();
          }}
        />
      ) : (
        <InviteClinic client={client} onDone={next} />
      )}

      <InlineError error={error} />
      <div className="flex justify-between">
        <Button variant="ghost" disabled={step === 0 || finishing} onClick={() => setStep(step - 1)}>
          Voltar
        </Button>
        <Button variant="ghost" loading={finishing} onClick={next}>
          {step === STEPS.length - 1 ? 'Pular e ir para o portal' : 'Pular este passo'}
        </Button>
      </div>
    </div>
  );
}

function FirstClient({ onCreated }: { onCreated: (c: { id: string; name: string }) => void }) {
  const create = useCreateClient();
  const [form, setForm] = useState({ name: '', specialty: '', contact_email: '' });
  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate(form, { onSuccess: (c) => onCreated({ id: c.id, name: c.name }) });
        }}
      >
        <h2 className="font-display text-lg font-bold text-fg">Cadastre a primeira clínica</h2>
        <Field label="Nome da clínica">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
        </Field>
        <Field label="Especialidade">
          <Input placeholder="Odontologia, Psicologia…" value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
        </Field>
        <Field label="E-mail de contato">
          <Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        </Field>
        <InlineError error={create.error} />
        <Button type="submit" className="w-full" loading={create.isPending}>
          Cadastrar e continuar
        </Button>
      </form>
    </Card>
  );
}

function InviteClinic({ client, onDone }: { client: { id: string; name: string } | null; onDone: () => void }) {
  const invite = useInviteUser();
  const [form, setForm] = useState({ full_name: '', email: '' });
  if (!client) {
    return (
      <Card className="text-sm text-muted">
        Você pulou o cadastro da clínica. Quando cadastrar, convide o responsável pela tela do cliente, na aba Usuários.
      </Card>
    );
  }
  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          invite.mutate({ ...form, role: 'client_owner', client_id: client.id }, { onSuccess: onDone });
        }}
      >
        <h2 className="font-display text-lg font-bold text-fg">Convide o responsável pela {client.name}</h2>
        <p className="text-sm text-muted">A pessoa recebe um link por e-mail e entra sem senha, já na área da clínica.</p>
        <Field label="Nome">
          <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required autoFocus />
        </Field>
        <Field label="E-mail">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <InlineError error={invite.error} />
        <Button type="submit" className="w-full" loading={invite.isPending}>
          Enviar convite e concluir
        </Button>
      </form>
    </Card>
  );
}
