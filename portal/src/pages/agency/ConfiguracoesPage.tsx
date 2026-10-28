import { useEffect, useRef, useState } from 'react';
import { useSession } from '../../hooks/useAuth';
import { useMyAgency, useUpdateBranding } from '../../hooks/useAgency';
import { useClients } from '../../hooks/useClients';
import { brandStyle } from '../../lib/brand';
import { AGENCY_STATUS_LABEL, PLAN_CLIENT_LIMIT, PLAN_LABEL, effectivePlan, formatDate } from '../../lib/format';
import type { Agency } from '../../types/database';
import { Button, Card, EmptyState, ErrorState, Field, InlineError, Input, PageHeader, Skeleton } from '../../components/ui';
import { AgencyBrand } from '../../components/layout/AgencyBrand';

const DEFAULT_COLOR = '#0E7C6B';

export function ConfiguracoesPage() {
  const { data: profile } = useSession();
  const agency = useMyAgency();

  if (profile?.role !== 'agency_admin') {
    return <EmptyState title="Só o admin da agência acessa as configurações" />;
  }
  if (agency.isLoading) return <Skeleton className="h-96" />;
  if (agency.isError || !agency.data) return <ErrorState error={agency.error} onRetry={() => agency.refetch()} />;

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Configurações" subtitle="Marca que suas clínicas veem no portal e o plano da agência." />
      <BrandingForm agency={agency.data} />
      <PlanCard agency={agency.data} />
    </div>
  );
}

/** Marca da agência. No onboarding, onSaved avança para o próximo passo. */
export function BrandingForm({ agency, onSaved, saveLabel = 'Salvar marca' }: { agency: Agency; onSaved?: () => void; saveLabel?: string }) {
  const save = useUpdateBranding();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(agency.name);
  const [color, setColor] = useState(agency.primary_color ?? DEFAULT_COLOR);
  const [logo, setLogo] = useState<File | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [saved, setSaved] = useState(false);

  // Prévia do logo escolhido antes de enviar.
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!logo) return setPreview(null);
    const url = URL.createObjectURL(logo);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logo]);

  const validColor = /^#[0-9a-fA-F]{6}$/.test(color);
  const previewAgency: Agency = {
    ...agency,
    name: name || agency.name,
    logo_url: preview ?? (removeLogo ? null : agency.logo_url),
  };

  return (
    <Card className="space-y-4">
      <h2 className="font-display text-lg font-bold text-fg">Marca no portal do cliente</h2>

      <Field label="Nome da agência">
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <Field label="Cor principal" hint="Usada nos botões e destaques do portal das suas clínicas.">
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={validColor ? color : DEFAULT_COLOR}
            onChange={(e) => setColor(e.target.value)}
            className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-transparent"
            aria-label="Escolher cor"
          />
          <Input value={color} onChange={(e) => setColor(e.target.value.trim())} className="max-w-[140px]" />
        </div>
      </Field>

      <div>
        <p className="mb-1.5 text-sm font-medium text-fg">Logo</p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            {agency.logo_url || logo ? 'Trocar logo' : 'Enviar logo'}
          </Button>
          {(agency.logo_url && !removeLogo) || logo ? (
            <Button
              variant="ghost"
              onClick={() => {
                setLogo(null);
                setRemoveLogo(true);
              }}
            >
              Remover logo
            </Button>
          ) : null}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            e.target.value = '';
            if (f) {
              setLogo(f);
              setRemoveLogo(false);
            }
          }}
        />
        <p className="mt-1 text-xs text-dim">PNG, JPG ou WEBP até 2 MB. De preferência com fundo transparente.</p>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-fg">Prévia</p>
        <div className="brand-scope rounded-2xl border border-line bg-night p-4" style={brandStyle(validColor ? color : null)}>
          <div className="flex items-center justify-between">
            <AgencyBrand agency={previewAgency} />
            <span className="text-xs text-muted">Sair</span>
          </div>
          <Button className="mt-4 w-full">Revisar agora</Button>
        </div>
      </div>

      <InlineError error={save.error} />
      {saved ? <p className="text-sm text-ok">Marca salva. As clínicas veem a mudança no próximo acesso.</p> : null}
      <Button
        loading={save.isPending}
        disabled={!validColor}
        onClick={() =>
          save.mutate(
            { name, color: validColor ? color : null, logo, removeLogo },
            {
              onSuccess: () => {
                setLogo(null);
                setRemoveLogo(false);
                setSaved(true);
                onSaved?.();
              },
            },
          )
        }
      >
        {saveLabel}
      </Button>
    </Card>
  );
}

function PlanCard({ agency }: { agency: Agency }) {
  const clients = useClients();
  const plan = effectivePlan(agency);
  const trialOver = plan !== agency.plan;
  const limit = PLAN_CLIENT_LIMIT[plan];
  const used = clients.data?.length ?? 0;

  return (
    <Card className="space-y-3">
      <h2 className="font-display text-lg font-bold text-fg">Plano</h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-brand px-3 py-1 text-sm font-bold text-brand-fg">{PLAN_LABEL[agency.plan]}</span>
        <span className="rounded-full bg-fg/5 px-3 py-1 text-xs font-bold text-muted">{AGENCY_STATUS_LABEL[agency.status]}</span>
      </div>
      {trialOver ? (
        <p className="text-sm text-warn">O teste acabou. Até o pagamento ser ligado, vale o limite do plano Starter.</p>
      ) : agency.status === 'trial' && agency.trial_ends_at ? (
        <p className="text-sm text-muted">Período de teste até {formatDate(agency.trial_ends_at)}.</p>
      ) : null}
      <p className="text-sm text-fg">
        {limit === null ? `${used} clientes ativos, sem limite no seu plano.` : `${used} de ${limit} clientes ativos usados.`}
      </p>
      {limit !== null && used >= limit ? (
        <p className="text-sm text-warn">Você chegou ao limite do plano. Para cadastrar mais clientes, mude de plano.</p>
      ) : null}
      <p className="text-xs text-dim">Mudança de plano e pagamento pelo portal chegam em breve. Por enquanto, fale com o suporte.</p>
    </Card>
  );
}
