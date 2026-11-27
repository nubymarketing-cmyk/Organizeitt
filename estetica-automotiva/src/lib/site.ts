/**
 * Configuração central do site.
 * Tudo o que muda de um cliente para outro (nome, contato, endereço, horários,
 * serviços, avaliações e mídias) fica aqui. Os componentes só leem este arquivo.
 */

export const site = {
  name: 'Impacto',
  fullName: 'Impacto Lavacar',
  tagline: 'Automotive Experience',
  logo: '/brand/logo.webp',
  description:
    'Estética automotiva premium e lava-jato de alto padrão. Lavagem detalhada, polimento técnico, vitrificação de pintura e higienização interna com tecnologia e cuidado em cada detalhe.',
  url: 'https://nubymarketing-cmyk.github.io/Organizeitt/estetica-automotiva',

  // SUBSTITUIR: número do WhatsApp com DDI + DDD, só dígitos
  whatsapp: '5511900000000',
  phoneDisplay: '(11) 90000-0000',
  instagram: 'impactolavacar', // SUBSTITUIR: @ real do Instagram
  email: 'contato@impactolavacar.com.br', // SUBSTITUIR

  // SUBSTITUIR: endereço real e a busca usada no mapa
  address: {
    street: 'Rua Exemplo, 1200',
    district: 'Jardins',
    city: 'São Paulo',
    state: 'SP',
    zip: '01400-000',
    mapQuery: 'Jardins, São Paulo - SP',
  },

  // 0 = domingo ... 6 = sábado. null = fechado
  hours: [
    { day: 0, label: 'Domingo', open: null, close: null },
    { day: 1, label: 'Segunda', open: 8, close: 18 },
    { day: 2, label: 'Terça', open: 8, close: 18 },
    { day: 3, label: 'Quarta', open: 8, close: 18 },
    { day: 4, label: 'Quinta', open: 8, close: 18 },
    { day: 5, label: 'Sexta', open: 8, close: 18 },
    { day: 6, label: 'Sábado', open: 8, close: 14 },
  ] as { day: number; label: string; open: number | null; close: number | null }[],

  // Horários que já estão ocupados (opcional): 'AAAA-MM-DD HH:00'
  blockedSlots: [] as string[],
  // Quantos dias à frente o cliente pode agendar
  bookingWindowDays: 21,
};

export type Service = {
  id: string;
  name: string;
  short: string;
  description: string;
  duration: string;
  image: string;
  includes: string[];
};

export const services: Service[] = [
  {
    id: 'lavagem-detalhada',
    name: 'Lavagem detalhada',
    short: 'Detalhada',
    description:
      'Pré-lavagem com snow foam, lavagem técnica em dois baldes e limpeza minuciosa de rodas, caixas e frisos.',
    duration: '1h30',
    image: '/media/services/lavagem-detalhada.webp',
    includes: ['Snow foam', 'Rodas e caixas', 'Secagem com ar'],
  },
  {
    id: 'lavagem-premium',
    name: 'Lavagem premium',
    short: 'Premium',
    description:
      'Tudo da lavagem detalhada, com descontaminação de pintura, cera de proteção e acabamento em plásticos e pneus.',
    duration: '2h30',
    image: '/media/services/lavagem-premium.webp',
    includes: ['Descontaminação', 'Cera de carnaúba', 'Acabamento externo'],
  },
  {
    id: 'higienizacao-interna',
    name: 'Higienização interna',
    short: 'Interna',
    description:
      'Aspiração técnica, limpeza a vapor e higienização de painel, carpetes, teto e saídas de ar com produtos neutros.',
    duration: '3h',
    image: '/media/services/higienizacao-interna.webp',
    includes: ['Vapor', 'Carpetes e teto', 'Ozonização'],
  },
  {
    id: 'polimento-tecnico',
    name: 'Polimento técnico',
    short: 'Polimento',
    description:
      'Correção de pintura em etapas para remover riscos, marcas de lavagem e hologramas, devolvendo profundidade ao brilho.',
    duration: '1 a 2 dias',
    image: '/media/services/polimento-tecnico.webp',
    includes: ['Medição de camada', 'Corte e refino', 'Inspeção com luz'],
  },
  {
    id: 'vitrificacao',
    name: 'Vitrificação de pintura',
    short: 'Vitrificação',
    description:
      'Proteção cerâmica de alta dureza que repele água e sujeira, com brilho espelhado e durabilidade de anos.',
    duration: '2 a 3 dias',
    image: '/media/services/vitrificacao.webp',
    includes: ['Coating cerâmico', 'Efeito hidrofóbico', 'Garantia'],
  },
  {
    id: 'limpeza-motor',
    name: 'Limpeza de motor',
    short: 'Motor',
    description:
      'Limpeza técnica do cofre com proteção de componentes elétricos, desengraxe controlado e acabamento protetor.',
    duration: '1h',
    image: '/media/services/limpeza-motor.webp',
    includes: ['Proteção elétrica', 'Desengraxe', 'Acabamento'],
  },
  {
    id: 'higienizacao-bancos',
    name: 'Higienização de bancos',
    short: 'Bancos',
    description:
      'Extração profunda em tecido ou limpeza e hidratação de couro, removendo manchas, odores e ácaros.',
    duration: '2h',
    image: '/media/services/higienizacao-bancos.webp',
    includes: ['Extração', 'Hidratação de couro', 'Antiodor'],
  },
  {
    id: 'estetica-completa',
    name: 'Estética automotiva completa',
    short: 'Completa',
    description:
      'O tratamento definitivo: lavagem premium, polimento, proteção cerâmica e higienização interna em um só processo.',
    duration: '3 a 4 dias',
    image: '/media/services/estetica-completa.webp',
    includes: ['Exterior', 'Interior', 'Proteção total'],
  },
];

export type Testimonial = { name: string; car: string; text: string; rating: number; source: string };

// SUBSTITUIR antes de publicar: copie avaliações reais do Google ou do Instagram
// (com autorização do cliente). Não publique depoimentos inventados.
export const testimonials: Testimonial[] = [
  {
    name: 'Rafael M.',
    car: 'BMW M340i',
    text: 'Fiz o polimento técnico e a vitrificação. A pintura ficou com uma profundidade que eu não via nem quando o carro era zero.',
    rating: 5,
    source: 'Google',
  },
  {
    name: 'Camila S.',
    car: 'Volvo XC60',
    text: 'Atendimento impecável do início ao fim. Agendei pelo WhatsApp em dois minutos e recebi fotos de cada etapa.',
    rating: 5,
    source: 'Google',
  },
  {
    name: 'Eduardo P.',
    car: 'Porsche Macan',
    text: 'Ambiente organizado, equipe técnica e muito cuidado com cada detalhe. Virou o único lugar onde deixo o meu carro.',
    rating: 5,
    source: 'Google',
  },
  {
    name: 'Juliana R.',
    car: 'Jeep Compass',
    text: 'A higienização interna tirou manchas que eu achava permanentes. O carro voltou com cheiro de novo.',
    rating: 5,
    source: 'Instagram',
  },
  {
    name: 'Thiago L.',
    car: 'Toyota Corolla',
    text: 'Pontualidade, transparência no orçamento e resultado acima do esperado. Recomendo a lavagem premium.',
    rating: 5,
    source: 'Google',
  },
  {
    name: 'Fernanda A.',
    car: 'Audi A3',
    text: 'Dá para ver que eles usam produtos de outro nível. A água escorre da pintura sozinha depois da vitrificação.',
    rating: 5,
    source: 'Google',
  },
];

export const media = {
  heroPoster: '/media/hero-poster.webp',
  // Opcional: coloque um vídeo real em public/media/hero.mp4 e preencha aqui.
  // Com vídeo definido, o hero usa o vídeo de fundo e o carro 3D continua nas seções seguintes.
  heroVideo: '' as string,
  before: '/media/before.webp',
  after: '/media/after.webp',
  structure: [
    {
      title: 'Box de lavagem',
      caption: 'Iluminação técnica de estúdio e água tratada.',
      video: '/media/structure/box',
    },
    {
      title: 'Correção de pintura',
      caption: 'Inspeção com luz direcional em cada painel.',
      video: '/media/structure/polimento',
    },
    {
      title: 'Rodas e detalhes',
      caption: 'Ferramentas dedicadas para cada superfície.',
      video: '/media/structure/rodas',
    },
    {
      title: 'Ambiente controlado',
      caption: 'Climatizado, limpo e livre de poeira.',
      video: '/media/structure/ambiente',
    },
  ],
  finalCta: '/media/final-cta.webp',
};

export const nav = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#resultados', label: 'Resultados' },
  { href: '#estrutura', label: 'Estrutura' },
  { href: '#diferenciais', label: 'Diferenciais' },
  { href: '#avaliacoes', label: 'Avaliações' },
  { href: '#contato', label: 'Contato' },
];

/** Prefixa caminhos de /public com o basePath (GitHub Pages em subpasta). */
export function asset(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return `${base}${path}`;
}

export function whatsappLink(text?: string) {
  const q = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${site.whatsapp}${q}`;
}
