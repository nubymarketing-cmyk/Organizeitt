import { useState } from 'react';
import type { UserRole } from '../types/database';
import { useClients, useInviteUser } from '../hooks/useClients';
import { ROLE_LABEL } from '../lib/format';
import { Button, Field, InlineError, Input, Modal, Select } from './ui';

const ROLES: UserRole[] = ['client_owner', 'client_member', 'agency_member', 'agency_admin'];

/** Convite de usuário. Na Etapa 4 chama a Edge Function invite-user. */
export function InviteUserModal({ open, onClose, clientId }: { open: boolean; onClose: () => void; clientId?: string }) {
  const clients = useClients();
  const invite = useInviteUser();
  const empty = { email: '', full_name: '', role: 'client_owner' as UserRole, client_id: clientId ?? '' };
  const [form, setForm] = useState(empty);
  const [done, setDone] = useState<string | null>(null);

  const isClientRole = form.role === 'client_owner' || form.role === 'client_member';
  const close = () => {
    setForm(empty);
    setDone(null);
    invite.reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={close} title="Convidar usuário">
      {done ? (
        <div className="space-y-4 text-center">
          <p className="text-white">Convite enviado para {done}.</p>
          <p className="text-sm text-muted">A pessoa recebe um link por e-mail e entra sem senha.</p>
          <Button className="w-full" onClick={close}>
            Fechar
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            invite.mutate(
              { email: form.email, full_name: form.full_name, role: form.role, client_id: isClientRole ? form.client_id || null : null },
              { onSuccess: () => setDone(form.email) },
            );
          }}
        >
          <Field label="Nome">
            <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required autoFocus />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
          <Field label="Papel">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </Select>
          </Field>
          {isClientRole ? (
            <Field label="Clínica">
              <Select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} disabled={!!clientId} required>
                <option value="">Escolha…</option>
                {(clients.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}
          <InlineError error={invite.error} />
          <Button type="submit" className="w-full" loading={invite.isPending}>
            Enviar convite
          </Button>
        </form>
      )}
    </Modal>
  );
}
