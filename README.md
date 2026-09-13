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

## Personalizar

- **Links de afiliado Shopee:** constante `ACHADINHOS` (campo `link`).
- **Preços do Pro:** constante `PRO_PRICES`.
- **Pagamento real:** a função `activatePro()` é o ponto de integração (Mercado Pago, Stripe, Kiwify). Hoje ela apenas grava `organizeit_pro=true` no `localStorage`.
