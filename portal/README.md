# Portal do Cliente Nuby

Portal onde a agência e as clínicas centralizam calendário de conteúdo, aprovação de posts,
relatórios mensais e arquivos da marca. O escopo completo está no documento do projeto.

## Estado atual: Etapa 0.5 (front com dados de demonstração)

- Telas do MVP prontas, com o visual do protótipo "Nuby · Painel do Cliente".
- Ainda **sem Supabase**: os dados vêm de um banco simulado em `src/services/mock/`,
  salvo no `localStorage` do navegador (chave `nuby_mock_db_v1`).
- O banco simulado já imita as regras de acesso do escopo (RLS): cliente só vê o
  próprio `client_id`, nunca vê post `in_creation` nem relatório não publicado.
- As mudanças de status seguem a seção 5, com as mesmas mensagens de erro das futuras RPCs.

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
| `src/types/database.ts` | Tipos das tabelas (vira `supabase gen types` na Etapa 2) |
| `src/services/<domínio>/` | Únicas funções que acessam dados: posts, reports, files, clients, auth |
| `src/services/storage.ts` | Upload, limites de tamanho e URL de download |
| `src/services/mock/` | Banco simulado e regras de acesso (sai quando o Supabase entrar) |
| `src/hooks/` | Hooks do TanStack Query usados pelas telas |
| `src/components/` | Componentes de interface e blocos compartilhados |
| `src/pages/client/` | Início, Calendário, Detalhe do post, Relatórios, Arquivos |
| `src/pages/agency/` | Clientes, Detalhe do cliente, Editor de post, Relatórios |

As telas nunca acessam dados direto: sempre `página -> hook -> service`. Para ligar o Supabase,
basta trocar o corpo das funções em `src/services/` mantendo as assinaturas.

## Rotas

- `/login` - link mágico (e-mail)
- `/app` - cliente: Início, `/app/calendario`, `/app/posts/:id`, `/app/relatorios`, `/app/arquivos`
- `/agencia` - equipe: lista de clientes, `/agencia/clientes/:id`, `/agencia/posts/:id`

## Deploy

`vercel.json` já redireciona todas as rotas para o `index.html`. Na Vercel, configurar
**Root Directory = `portal`**. Este diretório fica fora do deploy do Organize It no GitHub Pages.
