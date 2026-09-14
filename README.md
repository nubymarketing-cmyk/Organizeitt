# Organize It

Micro SaaS de organização pessoal em **um único arquivo**: `organizeit.html`.
Abra com dois cliques no navegador ou hospede em qualquer lugar (GitHub Pages, Vercel, Netlify).

## Telas

Dashboard · Finanças · Tarefas · Rotina · Treinos · Hábitos · Metas · **Achadinhos** (Shopee, foco academia) · **Plano Pro**

## Como funciona por dentro

- **Sem build.** HTML + CSS + JS puro. Os dados ficam no `localStorage` do navegador (chaves `organizeit_*`).
- **CSS do Tailwind já compilado** e embutido no `<style id="tailwind-css">`. Se você adicionar classes Tailwind novas no HTML, troque esse `<style>` por `<script src="https://cdn.tailwindcss.com"></script>` (o `tailwind.config` já está no arquivo) ou recompile.
- **Ícones:** subconjunto do Lucide embutido (`window.lucide.icons`). Para usar um ícone novo, adicione o SVG dele nesse objeto.
- **Gráficos:** Chart.js 4.4.4 via CDN com `defer`. Se o CDN não carregar, o app continua funcionando sem os gráficos.

## Cores

| Uso | Cor | Onde aparece |
|---|---|---|
| Marca e ação | `#FF7A00` laranja, token `app-brand` | logo, aba ativa, botões principais, gráficos |
| Dinheiro | `#F59E0B` âmbar, `amber-500` | preço e cupom dos achadinhos |
| Alerta | `red-500` | despesa, saldo negativo, tarefa atrasada, prioridade alta, excluir |
| Positivo | `green-500` | receita, prioridade baixa, meta concluída |
| Neutro informativo | `blue-500` | balanço positivo |

A regra é: **laranja só em coisa clicável**. Vermelho nunca é decoração, só sinal.
Ao mexer nas cores, altere o `tailwind.config` no topo do arquivo e recompile o
bloco `<style id="tailwind-css">`.

## Colocar no ar (GitHub Pages)

O deploy é automático: todo push publica o site no branch **`gh-pages`**
(workflow `.github/workflows/pages.yml`).

**Ativação, uma única vez**, em https://github.com/nubymarketing-cmyk/Organizeitt/settings/pages:

1. **Source**: `Deploy from a branch`
2. **Branch**: `gh-pages` · pasta `/ (root)`
3. **Save**

Em 1 a 2 minutos o app fica em `https://nubymarketing-cmyk.github.io/Organizeitt/`.
Depois disso não precisa mexer mais: cada push atualiza o site sozinho.

> Por que não o modo "GitHub Actions"? Ele exige que o robô **crie** o site do Pages
> via API, permissão que o `GITHUB_TOKEN` não tem neste repositório. O método por
> branch não precisa dessa permissão.

**Domínio próprio** (ex.: `app.organizeit.com.br`): Settings → Pages → Custom domain,
e no seu registrador crie um CNAME apontando para `nubymarketing-cmyk.github.io`.
Crie também um arquivo `CNAME` na raiz do projeto com o domínio dentro, senão o
deploy seguinte apaga a configuração.

## PWA (instalar no celular)

- `manifest.json` + `icons/`: nome, cores e ícones do app na tela inicial.
- `sw.js`: cache offline. O HTML busca a rede primeiro (atualizações chegam na hora);
  ícones, Chart.js e fontes ficam em cache.
- **Ao publicar uma versão nova**, mude `VERSION` no `sw.js` (ex.: `organizeit-v2`)
  para todos os aparelhos atualizarem.

Para instalar: abra o site no celular → menu do navegador → "Adicionar à tela de início".

## Analytics e erros

No topo do `organizeit.html`, em `window.ORGANIZEIT_CONFIG`:

- `GA4_ID`: ID do Google Analytics 4 (`G-XXXXXXXXXX`).
- `SENTRY_DSN`: DSN do Sentry para receber erros de JavaScript dos usuários.

Vazios = desligados, e nenhum dado sai do aparelho.
Eventos já instrumentados: `view` (troca de aba), `checkout_open`, `pro_activated`, `shopee_click`.

## Personalizar

- **Achadinhos:** constante `ACHADINHOS`. Cada item aceita `nome`, `emoji`, `img`
  (URL da foto, opcional), `preco`, `precoDe`, `nota`, `vendidos`, `cupom`, `tag`,
  `pro`, `desc` e `link` (use seu link de afiliado da Shopee).
- **Preços do Pro:** constante `PRO_PRICES`.
- **Pagamento real:** a função `activatePro()` é o ponto de integração (Mercado Pago,
  Stripe, Kiwify). Hoje ela apenas grava `organizeit_pro=true` no `localStorage`.

## Branches

- `claude/shopee-academia-page-dyz4xf` — desenvolvimento
- `main` — produção
- `gh-pages` — gerado pelo workflow, **não edite à mão**
