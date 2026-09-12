# Organizeitt 🛍️

Web app de **achadinhos da Shopee organizados por categoria**, em formato de celular, com landing page de entrada e **Plano Pro**.

Sem build, sem dependências: HTML + CSS + JS puro. Funciona em qualquer hospedagem estática (GitHub Pages, Vercel, Netlify).

## Estrutura

| Arquivo | O que é |
|---|---|
| `index.html` | Landing page (LP) que apresenta o app e o plano Pro antes de entrar |
| `app.html` | O app em si, dentro de uma moldura de celular (tela cheia no mobile) |
| `js/data.js` | Categorias, produtos, kits e configuração do plano Pro |
| `js/app.js` | Rotas (`#/home`, `#/c/academia`, `#/pro`, `#/favoritos`, `#/perfil`), paywall, favoritos |
| `css/app.css` | Estilos do app |
| `css/lp.css` | Estilos da landing page |

## Rodar localmente

Abra `index.html` no navegador, ou sirva a pasta:

```bash
npx serve .
# ou
python3 -m http.server 8080
```

## Páginas do app

- **Início** — busca, categorias, mais vendidos e banner do Pro.
- **Academia** (`#/c/academia`) — página dedicada com kits prontos, filtros por subcategoria (acessórios, roupas, hidratação, recuperação, tech), ordenação e seção de exclusivos Pro.
- **Casa, Cozinha, Beleza** — páginas genéricas de categoria (mesmo template).
- **Plano Pro** (`#/pro`) — planos mensal/anual, benefícios, comparativo e checkout de demonstração.
- **Favoritos** — limite de 5 no grátis, ilimitado no Pro.
- **Perfil** — nome, status da assinatura, limpar dados.

## Personalizar

- **Links de afiliado:** edite o campo `link` de cada produto em `js/data.js`. Hoje eles apontam para a busca da Shopee (`shopee.com.br/search?keyword=...`).
- **Preços do Pro:** `PLANO_PRO.precoMes` e `PLANO_PRO.precoAno` em `js/data.js`.
- **Pagamento real:** a função `ativarPro()` em `js/app.js` é o ponto de integração. Hoje ela só grava `organizeitt_pro=true` no `localStorage` (demonstração). Conecte Mercado Pago, Stripe, Hotmart ou Kiwify e chame `ativarPro(plano)` no retorno do pagamento.
- **Nova categoria:** adicione um item em `CATEGORIAS` e produtos com o mesmo `cat`. A rota `#/c/<id>` passa a funcionar automaticamente.
