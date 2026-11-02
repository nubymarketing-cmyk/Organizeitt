import { useState } from 'react';
import { useSession, useSetMyPassword } from '../hooks/useAuth';
import { Button, Field, InlineError, Input, Modal } from './ui';

/** Definir senha para entrar com e-mail e senha (útil no celular, sem depender do link). */
export function PasswordModal({ onClose }: { onClose: () => void }) {
  const { data: profile } = useSession();
  const save = useSetMyPassword();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <Modal open onClose={onClose} title="Definir senha">
      {save.isSuccess ? (
        <div className="space-y-4 text-center">
          <p className="text-fg">Senha salva.</p>
          <p className="text-sm text-muted">
            Agora você pode entrar com <span className="text-fg">{profile?.email}</span> e essa senha, em "Sou da agência, entrar com senha".
          </p>
          <Button className="w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!mismatch) save.mutate(password);
          }}
        >
          <p className="text-sm text-muted">
            Com uma senha você entra em qualquer aparelho sem esperar o link no e-mail. O link continua funcionando.
          </p>
          <Field label="Nova senha" hint="Pelo menos 8 caracteres.">
            <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required autoFocus />
          </Field>
          <Field label="Repita a senha">
            <Input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>
          {mismatch ? <p className="text-sm text-bad">As senhas não são iguais.</p> : null}
          <InlineError error={save.error} />
          <Button type="submit" className="w-full" loading={save.isPending} disabled={mismatch || password.length < 8}>
            Salvar senha
          </Button>
        </form>
      )}
    </Modal>
  );
}
