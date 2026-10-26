# Portal do Cliente Nuby

Portal onde a agência e as clínicas centralizam calendário de conteúdo, aprovação de posts,
relatórios mensais e arquivos da marca. O escopo completo está no documento do projeto.

## Estado atual: Supabase ligado (com modo demonstração de reserva)

- Telas do MVP prontas, com o visual do protótipo "Nuby · Painel do Cliente".
- Com `VITE_SUPABASE_URL` preenchido no `.env.local`, os dados vêm do Supabase: banco, login por
  link mágico e arquivos no Storage.
- Sem `.env.local`, o portal roda com dados de demonstração (`src/services/mock/`, salvos no
  `localStorage`). A página publicada como demonstração continua assim.
- As regras de acesso (seção 6) ficam no banco, em `supabase/migrations/0001_portal.sql`: cliente só
  vê o próprio `client_id`, nunca vê post `in_creation` nem relatório não publicado.
- O front só lê tabelas direto. Toda mudança passa por uma RPC com as regras da seção 5.
- Cadastro só por convite: um e-mail sem convite não consegue criar conta.

## Ligar o Supabase (uma vez)

1. Crie um projeto em [supabase.com](https://supabase.com) (região São Paulo).
2. Em **SQL Editor**, cole e rode cada arquivo de `supabase/migrations/`, em ordem (`0001`, `0002`, ...).
3. Abra `supabase/bootstrap.sql`, troque o nome e o e-mail do primeiro admin, cole no SQL Editor e rode.
4. Em **Authentication > URL Configuration**:
   - **Site URL**: o endereço do portal (`http://localhost:5173` enquanto testa).
   - **Redirect URLs**: adicione `http://localhost:5173/**` e, depois, o endereço de produção com `/**`.
5. Em **Project Settings > API**, copie a URL do projeto e a chave `anon` (ou `publishable`).
   Crie `portal/.env.local` a partir do `.env.example` e preencha `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
6. Rode `npm run dev`, entre com o e-mail do passo 3 e clique no link que chegar.

Depois disso, o admin convida as clínicas e a equipe pelo próprio portal (botão **Convidar usuário**).
A pessoa recebe o link por e-mail e, no primeiro acesso, a conta é criada com o papel do convite.

**E-mails:** o envio padrão do Supabase serve só para teste (poucos e-mails por hora). Para uso real,
configure um SMTP próprio (por exemplo, Resend) em **Authentication > Emails > SMTP Settings**.

## Rodar

```bash
cd portal
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build de produção
```

Na tela de login há o bloco **Modo demonstração** para entrar como agência ou como cliente,
e o link **Restaurar dados de exemplo**.

## Organização

| Pasta | O que tem |
|---|---|
| `supabase/migrations/` | Banco: tabelas, RLS, RPCs, gatilho de convite e buckets |
| `supabase/bootstrap.sql` | Cria a agência e o convite do primeiro admin |
| `src/types/database.ts` | Tipos das tabelas |
| `src/services/<domínio>/` | Únicas funções que acessam dados: posts, reports, files, clients, auth. `supabase.ts` e `mock.ts` têm as duas versões; `index.ts` escolhe |
| `src/services/storage.ts` | Upload, limites de tamanho e URL de download |
| `src/services/mock/` | Banco simulado do modo demonstração |
| `src/hooks/` | Hooks do TanStack Query usados pelas telas |
| `src/components/` | Componentes de interface e blocos compartilhados |
| `src/pages/client/` | Início, Calendário, Detalhe do post, Relatórios, Arquivos |
| `src/pages/agency/` | Clientes, Detalhe do cliente, Editor de post, Relatórios |

As telas nunca acessam dados direto: sempre `página -> hook -> service`.

## Papéis

| Papel | O que faz |
|---|---|
| Dono da plataforma (`platform_admins`) | Vê todas as agências em `/plataforma`, muda plano e status |
| Admin da agência | Tudo da própria agência: clientes, equipe, marca, convites |
| Equipe da agência | Só os clientes atribuídos a ela na tela Equipe |
| Dono da clínica | Aprova ou pede ajuste, vê resultados e arquivos |
| Equipe da clínica | Vê e comenta, não aprova |

Planos: Starter até 5 clientes, Pro até 20, Agência sem limite. Agência nova começa com 14 dias de Pro.

## Notificações

Cada aviso nasce no banco (gatilhos em `0006_notificacoes.sql`) e vai para dois lugares:

1. **Sino no portal** (`notifications`): já funciona.
2. **Fila de envio** (`notification_outbox`): uma linha por canal (e-mail sempre; WhatsApp quando a pessoa
   cadastra o telefone no sino).

O serviço `supabase/functions/notify-dispatch` lê a fila e envia. Cada canal é um arquivo em
`channels/`; trocar ou ligar provedor não mexe nas telas. Enquanto o canal não está configurado,
a mensagem fica como `skipped`.

Para ligar o e-mail (Resend):

```bash
supabase functions deploy notify-dispatch --no-verify-jwt
supabase secrets set RESEND_API_KEY=... EMAIL_FROM="Portal <avisos@seudominio.com>" APP_URL=https://seu-portal
```

E agendar a cada minuto no SQL Editor (precisa da extensão `pg_net`):

```sql
select cron.schedule('envio-notificacoes', '* * * * *',
  $$select net.http_post('https://<ref>.supabase.co/functions/v1/notify-dispatch', '{}'::jsonb)$$);
```

WhatsApp: configure `WHATSAPP_WEBHOOK_URL` e `WHATSAPP_TOKEN` do provedor escolhido e ajuste
`channels/whatsapp.ts` se o formato for outro. O lembrete de 48h já roda de hora em hora pelo `pg_cron`.

## Rotas

- `/login` - link mágico (e-mail)
- `/app` - cliente: Início, `/app/calendario`, `/app/posts/:id`, `/app/relatorios`, `/app/arquivos`
- `/agencia` - equipe: lista de clientes, `/agencia/clientes/:id`, `/agencia/posts/:id`, `/agencia/equipe`, `/agencia/configuracoes`
- `/plataforma` - dono da plataforma: agências, planos e uso

## Deploy

`vercel.json` já redireciona todas as rotas para o `index.html`. Na Vercel, configurar
**Root Directory = `portal`** e as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e
`VITE_APP_URL` (endereço de produção). Lembre de incluir esse endereço nas Redirect URLs do Supabase. Este diretório fica fora do deploy do Organize It no GitHub Pages.
