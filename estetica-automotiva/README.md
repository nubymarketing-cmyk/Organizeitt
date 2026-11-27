# Impacto Lavacar · site institucional

Site de estética automotiva premium com experiência 3D em tempo real, feito em
**Next.js 15 + React 19 + Tailwind CSS 4 + Framer Motion + Three.js (React Three Fiber)**.
Exporta um site 100% estático (pasta `out/`), que roda em GitHub Pages, Vercel, Netlify ou qualquer hospedagem.

## Rodar

```bash
cd estetica-automotiva
npm install
npm run dev          # http://localhost:3000
npm run build        # gera out/
```

Para publicar em subpasta (ex.: GitHub Pages), defina `BASE_PATH`:
`BASE_PATH=/Organizeitt/estetica-automotiva npm run build`.
O workflow `.github/workflows/pages.yml` da raiz do repositório já faz isso.

## O que tem no site

| Seção | O que faz |
|---|---|
| Abertura | Logo + progresso real do carregamento do modelo 3D |
| Hero 3D | Carro em estúdio virtual, gotas em câmera lenta, reflexo de luz percorrendo a lataria, piso molhado com reflexo, câmera que segue o mouse |
| Narrativa em scroll | A câmera passa por Pintura, Rodas e Interior enquanto o texto entra e sai |
| Serviços | 8 cards com imagem, duração, itens inclusos e botão que já abre o agendamento com o serviço escolhido |
| Antes e depois | Comparador arrastável (mouse, toque e teclado) |
| Estrutura | Vídeos curtos em loop, sem áudio, que só carregam quando aparecem na tela |
| Diferenciais | Ícones próprios desenhados em traço, animados |
| Agendamento | Serviço, dia, horário livre, veículo, nome e telefone, com confirmação pelo WhatsApp |
| Avaliações | Duas faixas em movimento, pausam no hover |
| Localização | Google Maps, endereço, horário com "aberto agora", WhatsApp e Instagram |
| Botão flutuante | WhatsApp, aparece depois do hero |

SEO: metadata, Open Graph, `sitemap.xml`, `robots.txt` e dados estruturados `AutoWash` (schema.org).
Acessibilidade: navegação por teclado, foco visível, `prefers-reduced-motion` respeitado (sem scroll suave, sem câmera animada, vídeos parados).
Desempenho: 3D pausa fora da tela, qualidade cai sozinha em aparelho fraco (`PerformanceMonitor`), imagens WebP, vídeos MP4 + WebM com `preload="none"`.

## Personalizar

Quase tudo fica em **`src/lib/site.ts`**: nome, WhatsApp, Instagram, endereço, horários, serviços, avaliações e mídias.
As cores da marca ficam em `src/app/globals.css` (bloco `@theme`).

### Antes de publicar, substitua

- [ ] **WhatsApp, telefone, e-mail, Instagram e endereço** em `site.ts` (estão com valores de exemplo).
- [ ] **Avaliações**: os textos atuais são exemplos de layout. Troque por avaliações reais do Google ou Instagram, com autorização dos clientes. Não publique depoimentos inventados.
- [ ] **Horários ocupados**: o agendamento mostra todos os horários do expediente. Para bloquear um horário, adicione em `blockedSlots` (`'2026-12-05 10:00'`). A confirmação final é sempre humana, pelo WhatsApp.
- [ ] **Fotos e vídeos**: as imagens dos serviços, o antes/depois e os vídeos da estrutura foram **renderizados a partir da cena 3D** para o layout ficar completo. Para o site final, o ideal é trocar por fotos e vídeos reais do espaço e da equipe (mesmos nomes de arquivo em `public/media/`, ou ajuste os caminhos em `site.ts`).
- [ ] **Vídeo do hero (opcional)**: coloque o vídeo em `public/media/hero.mp4` e preencha `media.heroVideo`. O vídeo aparece no topo e o carro 3D continua na narrativa de scroll.

### Recomendações para vídeos e fotos reais

- Hero: 1920x1080, 8 a 12 s em loop, H.264, sem áudio, até ~4 MB (`ffmpeg -i bruto.mov -an -vf scale=1920:-2 -c:v libx264 -crf 26 -preset slow -movflags +faststart hero.mp4`).
- Estrutura: 1280x800, 5 a 8 s, gere `.mp4`, `.webm` e um `.webp` do primeiro quadro (poster).
- Fotos: WebP, 1000x1250 para serviços, 1600x1000 para antes/depois.

## Gerar de novo as imagens e vídeos 3D

```bash
node scripts/render.mjs                 # todas as imagens e vídeos
node scripts/render.mjs hero after      # só algumas
```

Os enquadramentos ficam em `src/studio/RenderStudio.tsx`. Precisa de Playwright com Chromium e `ffmpeg`.
O script cria a rota `/render` só enquanto roda; ela nunca vai para o site publicado.

## Modelo 3D e licenças

- Modelo "Ferrari 458 Italia" por [vicent091036](https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6), licença CC BY 4.0 (crédito no rodapé), o mesmo usado nos exemplos oficiais do three.js. Os emblemas foram escurecidos nos materiais.
  Como é um modelo de uma marca real, para uso comercial definitivo vale trocar por um esportivo genérico licenciado ou por um modelo do próprio carro de um cliente. Basta substituir `public/models/car.glb` e ajustar os nomes de materiais em `src/components/three/carMaterials.ts`.
- Fontes: Archivo, Geist e Geist Mono (Google Fonts, SIL OFL), servidas pelo próprio site via `next/font`.

## Estrutura

```
src/
  app/            layout (SEO, fontes, JSON-LD), página, sitemap, robots
  studio/         estúdio de renderização das imagens e vídeos
  components/
    three/        Car, Studio (iluminação), Floor, Water (gotas), HeroScene (câmera em scroll)
    sections/     Hero, Services, BeforeAfter, Structure, Differentials, Booking, Testimonials, Location, FinalCta
    ui/           Button magnético, Reveal, SectionHeading
  lib/            site.ts (conteúdo), booking.ts (datas, horários, mensagem), scroll.ts
public/
  brand/          logo
  models/         car.glb (Draco) + sombra
  draco/          decodificador Draco local
  media/          imagens e vídeos
scripts/render.mjs
```
