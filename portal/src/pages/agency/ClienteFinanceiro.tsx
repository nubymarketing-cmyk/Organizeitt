import { useState } from 'react';
import { useCharges, useCreateCharge, useDeleteCharge, useSetChargePaid } from '../../hooks/useClients';
import { formatCurrency, formatDate, formatDay } from '../../lib/format';
import type { Client, ClientCharge } from '../../types/database';
import { Button, Card, ConfirmButton, EmptyState, ErrorState, Field, InlineError, Input, SkeletonList, cx } from '../../components/ui';

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Vencimento sugerido: o dia de cobrança do cliente neste mês. */
function suggestedDue(client: Client) {
  const d = new Date();
  const day = client.billing_day ?? 10;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Mensalidade da clínica: controle manual da agência (sem integração de pagamento). */
export function ClienteFinanceiro({ client }: { client: Client }) {
  const charges = useCharges(client.id);
  const create = useCreateCharge();
  const [form, setForm] = useState({ due: suggestedDue(client), amount: client.monthly_fee?.toString() ?? '', notes: '' });
  const amount = Number(form.amount.replace(',', '.'));

  return (
    <div className="space-y-5">
      <Card className="space-y-3">
        <p className="text-sm text-muted">
          {client.monthly_fee !== null
            ? `Mensalidade de ${formatCurrency(client.monthly_fee)}${client.billing_day ? `, vence todo dia ${client.billing_day}` : ''}.`
            : 'Sem mensalidade cadastrada. Use Editar, no topo, para definir o valor e o dia de vencimento.'}
        </p>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr]">
          <Field label="Vencimento">
            <Input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} />
          </Field>
          <Field label="Valor (R$)">
            <Input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
          </Field>
          <Field label="Observação">
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Opcional" />
          </Field>
        </div>
        <InlineError error={create.error} />
        <Button
          loading={create.isPending}
          disabled={!form.due || !form.amount || Number.isNaN(amount)}
          onClick={() =>
            create.mutate(
              { clientId: client.id, dueDate: form.due, amount, notes: form.notes },
              { onSuccess: () => setForm({ ...form, notes: '' }) },
            )
          }
        >
          Lançar cobrança
        </Button>
      </Card>

      {charges.isLoading ? (
        <SkeletonList rows={2} />
      ) : charges.isError ? (
        <ErrorState error={charges.error} onRetry={() => charges.refetch()} />
      ) : !charges.data?.length ? (
        <EmptyState illustration="inbox" title="Nenhuma cobrança lançada" text="Lance a mensalidade do mês acima e marque como paga quando a clínica pagar." />
      ) : (
        <div className="space-y-2">
          {charges.data.map((c) => (
            <ChargeRow key={c.id} charge={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChargeRow({ charge }: { charge: ClientCharge }) {
  const setPaid = useSetChargePaid();
  const remove = useDeleteCharge();
  const overdue = !charge.paid_at && charge.due_date < todayIso();
  const label = charge.paid_at ? `Paga em ${formatDate(charge.paid_at)}` : overdue ? 'Vencida' : 'A vencer';

  return (
    <Card className="space-y-2 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-semibold text-fg">
            {formatCurrency(charge.amount)} · vence {formatDay(charge.due_date)}
          </p>
          {charge.notes ? <p className="text-xs text-muted">{charge.notes}</p> : null}
        </div>
        <span
          className={cx(
            'rounded-full px-2.5 py-1 text-xs font-bold',
            charge.paid_at ? 'bg-ok/15 text-ok' : overdue ? 'bg-bad/15 text-bad' : 'bg-fg/5 text-muted',
          )}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant={charge.paid_at ? 'secondary' : 'primary'}
          loading={setPaid.isPending}
          onClick={() => setPaid.mutate({ id: charge.id, paid: !charge.paid_at })}
        >
          {charge.paid_at ? 'Desfazer pagamento' : 'Marcar como paga'}
        </Button>
        <ConfirmButton
          variant="ghost"
          label="Excluir"
          question="Excluir esta cobrança?"
          confirmLabel="Excluir"
          loading={remove.isPending}
          onConfirm={() => remove.mutate(charge.id)}
        />
      </div>
      <InlineError error={setPaid.error || remove.error} />
    </Card>
  );
}
