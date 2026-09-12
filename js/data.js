// ============================================================
// Organizeitt — Dados de exemplo (achadinhos Shopee)
// Troque os links abaixo pelos seus links de afiliado Shopee.
// ============================================================

const CATEGORIAS = [
  { id: 'academia', nome: 'Academia', emoji: '🏋️', cor: '#FF6B35', desc: 'Acessórios, roupas e itens de treino que valem cada centavo.' },
  { id: 'casa', nome: 'Casa & Organização', emoji: '🏠', cor: '#7C5CFF', desc: 'Organizadores, potes e soluções para deixar tudo no lugar.' },
  { id: 'cozinha', nome: 'Cozinha', emoji: '🍳', cor: '#2EC4B6', desc: 'Utensílios que facilitam a rotina e cabem no bolso.' },
  { id: 'beleza', nome: 'Beleza & Autocuidado', emoji: '✨', cor: '#FF5C8A', desc: 'Skincare, cabelo e acessórios com ótimo custo-benefício.' },
];

// Subcategorias da página Academia
const SUB_ACADEMIA = [
  { id: 'todos', nome: 'Todos' },
  { id: 'acessorios', nome: 'Acessórios' },
  { id: 'roupas', nome: 'Roupas' },
  { id: 'hidratacao', nome: 'Hidratação' },
  { id: 'recuperacao', nome: 'Recuperação' },
  { id: 'tech', nome: 'Tech' },
];

const shopee = (q) => 'https://shopee.com.br/search?keyword=' + encodeURIComponent(q);

const PRODUTOS = [
  // ---------------- ACADEMIA ----------------
  { id: 'aca-01', cat: 'academia', sub: 'hidratacao', nome: 'Garrafa Térmica 1L com Marcador de Horário', emoji: '🥤', preco: 34.90, precoDe: 59.90, nota: 4.9, vendidos: 12400, cupom: 'FRETEGRATIS', tags: ['mais vendido'], pro: false,
    desc: 'Mantém gelada por até 12h. Marcações de horário para você bater a meta de água do dia.', link: shopee('garrafa termica 1l marcador horario') },
  { id: 'aca-02', cat: 'academia', sub: 'acessorios', nome: 'Kit Elásticos de Resistência (5 níveis)', emoji: '🔗', preco: 19.90, precoDe: 39.90, nota: 4.8, vendidos: 31200, cupom: null, tags: ['custo-benefício'], pro: false,
    desc: 'Cinco intensidades para treinar glúteo, perna e mobilidade em casa ou na academia.', link: shopee('kit elastico resistencia 5 niveis') },
  { id: 'aca-03', cat: 'academia', sub: 'acessorios', nome: 'Luva de Treino com Munhequeira', emoji: '🧤', preco: 27.50, precoDe: 45.00, nota: 4.7, vendidos: 8900, cupom: 'ACAD10', tags: [], pro: false,
    desc: 'Protege as mãos de calos e dá firmeza no punho para exercícios de puxada.', link: shopee('luva treino musculacao munhequeira') },
  { id: 'aca-04', cat: 'academia', sub: 'hidratacao', nome: 'Coqueteleira Shaker 600ml com Mola', emoji: '🥛', preco: 15.90, precoDe: 29.90, nota: 4.8, vendidos: 22100, cupom: null, tags: ['mais vendido'], pro: false,
    desc: 'Não vaza, mistura o whey sem grumos e cabe em qualquer mochila.', link: shopee('coqueteleira shaker 600ml') },
  { id: 'aca-05', cat: 'academia', sub: 'tech', nome: 'Fone Bluetooth Esportivo à Prova de Suor', emoji: '🎧', preco: 69.90, precoDe: 129.90, nota: 4.6, vendidos: 5600, cupom: 'TECH15', tags: ['achado pro'], pro: true,
    desc: 'Encaixe firme na orelha, 8h de bateria e resistência IPX5 para suar sem medo.', link: shopee('fone bluetooth esportivo ipx5') },
  { id: 'aca-06', cat: 'academia', sub: 'acessorios', nome: 'Strap de Levantamento (par)', emoji: '🪢', preco: 14.90, precoDe: 24.90, nota: 4.9, vendidos: 9800, cupom: null, tags: [], pro: false,
    desc: 'Mais pegada no terra e na remada. Algodão reforçado que não escorrega.', link: shopee('strap levantamento peso par') },
  { id: 'aca-07', cat: 'academia', sub: 'roupas', nome: 'Legging Cintura Alta Suplex Sem Transparência', emoji: '🩳', preco: 39.90, precoDe: 79.90, nota: 4.7, vendidos: 44000, cupom: 'MODA20', tags: ['mais vendido'], pro: false,
    desc: 'Tecido grosso, compressão média e não marca. Disponível em várias cores.', link: shopee('legging cintura alta suplex') },
  { id: 'aca-08', cat: 'academia', sub: 'roupas', nome: 'Camiseta Dry Fit Masculina Básica', emoji: '👕', preco: 22.90, precoDe: 39.90, nota: 4.6, vendidos: 27600, cupom: null, tags: ['custo-benefício'], pro: false,
    desc: 'Seca rápido e não fica pesada de suor. Ideal para comprar em kit.', link: shopee('camiseta dry fit masculina') },
  { id: 'aca-09', cat: 'academia', sub: 'recuperacao', nome: 'Rolo de Liberação Miofascial (Foam Roller)', emoji: '🧻', preco: 44.90, precoDe: 89.90, nota: 4.8, vendidos: 4300, cupom: 'RECUPERA', tags: ['achado pro'], pro: true,
    desc: 'Alivia dor muscular pós-treino e melhora a mobilidade em 10 minutos por dia.', link: shopee('rolo liberacao miofascial foam roller') },
  { id: 'aca-10', cat: 'academia', sub: 'recuperacao', nome: 'Massageador Elétrico Portátil Tipo Pistola', emoji: '🔫', preco: 119.90, precoDe: 249.90, nota: 4.7, vendidos: 3100, cupom: 'PRO50', tags: ['achado pro'], pro: true,
    desc: 'Seis cabeçotes e 4 velocidades. O mesmo efeito das massage guns caras.', link: shopee('massageador eletrico pistola portatil') },
  { id: 'aca-11', cat: 'academia', sub: 'acessorios', nome: 'Corda de Pular com Rolamento e Contador', emoji: '🪄', preco: 18.90, precoDe: 34.90, nota: 4.8, vendidos: 15700, cupom: null, tags: [], pro: false,
    desc: 'Cardio rápido em casa. Cabo ajustável e pegada antiderrapante.', link: shopee('corda de pular rolamento contador') },
  { id: 'aca-12', cat: 'academia', sub: 'acessorios', nome: 'Tapete de Yoga Antiderrapante 6mm', emoji: '🧘', preco: 42.90, precoDe: 79.90, nota: 4.7, vendidos: 19300, cupom: 'YOGA10', tags: ['mais vendido'], pro: false,
    desc: 'Grosso, confortável e vem com alça para transporte.', link: shopee('tapete yoga antiderrapante 6mm') },
  { id: 'aca-13', cat: 'academia', sub: 'tech', nome: 'Balança Digital de Bioimpedância com App', emoji: '⚖️', preco: 79.90, precoDe: 159.90, nota: 4.6, vendidos: 7200, cupom: null, tags: ['achado pro'], pro: true,
    desc: 'Mede peso, gordura, massa muscular e sincroniza com o celular.', link: shopee('balanca bioimpedancia bluetooth app') },
  { id: 'aca-14', cat: 'academia', sub: 'roupas', nome: 'Top Fitness com Bojo e Alta Sustentação', emoji: '🎽', preco: 29.90, precoDe: 59.90, nota: 4.7, vendidos: 33800, cupom: 'MODA20', tags: [], pro: false,
    desc: 'Segura de verdade em treinos de impacto. Alças largas e tecido respirável.', link: shopee('top fitness bojo alta sustentacao') },
  { id: 'aca-15', cat: 'academia', sub: 'acessorios', nome: 'Bolsa de Academia com Compartimento para Tênis', emoji: '🎒', preco: 59.90, precoDe: 109.90, nota: 4.8, vendidos: 6100, cupom: null, tags: [], pro: false,
    desc: 'Cabe roupa, tênis, garrafa e ainda tem bolso térmico. Impermeável.', link: shopee('bolsa academia compartimento tenis') },
  { id: 'aca-16', cat: 'academia', sub: 'acessorios', nome: 'Meia Antiderrapante para Pilates e Yoga (3 pares)', emoji: '🧦', preco: 24.90, precoDe: 44.90, nota: 4.8, vendidos: 11500, cupom: null, tags: ['custo-benefício'], pro: false,
    desc: 'Grip de silicone na sola. Ótima para treino funcional e pilates.', link: shopee('meia antiderrapante pilates 3 pares') },
  { id: 'aca-17', cat: 'academia', sub: 'recuperacao', nome: 'Joelheira de Compressão Esportiva (par)', emoji: '🦵', preco: 25.90, precoDe: 49.90, nota: 4.7, vendidos: 8400, cupom: 'ACAD10', tags: [], pro: false,
    desc: 'Estabiliza o joelho no agachamento e no leg press. Tamanhos P ao GG.', link: shopee('joelheira compressao esportiva par') },
  { id: 'aca-18', cat: 'academia', sub: 'tech', nome: 'Relógio Smartwatch com Monitor Cardíaco', emoji: '⌚', preco: 89.90, precoDe: 199.90, nota: 4.5, vendidos: 14200, cupom: 'TECH15', tags: [], pro: false,
    desc: 'Conta passos, calorias, batimentos e tem mais de 20 modos de esporte.', link: shopee('smartwatch monitor cardiaco esporte') },

  // ---------------- CASA & ORGANIZAÇÃO ----------------
  { id: 'cas-01', cat: 'casa', sub: null, nome: 'Kit 10 Potes Herméticos Empilháveis', emoji: '🫙', preco: 49.90, precoDe: 89.90, nota: 4.8, vendidos: 25000, cupom: 'CASA10', tags: ['mais vendido'], pro: false,
    desc: 'Deixa a despensa organizada e os alimentos frescos por mais tempo.', link: shopee('kit potes hermeticos empilhaveis') },
  { id: 'cas-02', cat: 'casa', sub: null, nome: 'Organizador de Gaveta Ajustável (6 peças)', emoji: '🗂️', preco: 21.90, precoDe: 39.90, nota: 4.7, vendidos: 18000, cupom: null, tags: ['custo-benefício'], pro: false,
    desc: 'Divisórias moduláveis para roupas íntimas, meias e acessórios.', link: shopee('organizador gaveta ajustavel') },
  { id: 'cas-03', cat: 'casa', sub: null, nome: 'Cabides Veludo Antideslizantes (30 un.)', emoji: '🧥', preco: 39.90, precoDe: 69.90, nota: 4.9, vendidos: 40100, cupom: 'CASA10', tags: ['mais vendido'], pro: false,
    desc: 'Finos, ganham espaço no guarda-roupa e não deixam a roupa cair.', link: shopee('cabides veludo 30 unidades') },
  { id: 'cas-04', cat: 'casa', sub: null, nome: 'Sapateira Vertical Modular 20 Pares', emoji: '👟', preco: 79.90, precoDe: 149.90, nota: 4.6, vendidos: 6800, cupom: null, tags: ['achado pro'], pro: true,
    desc: 'Encaixe fácil, sem ferramentas. Cabe no canto do quarto.', link: shopee('sapateira vertical modular 20 pares') },

  // ---------------- COZINHA ----------------
  { id: 'coz-01', cat: 'cozinha', sub: null, nome: 'Cortador de Legumes Multifuncional 12 em 1', emoji: '🥕', preco: 34.90, precoDe: 69.90, nota: 4.6, vendidos: 21000, cupom: 'COZ15', tags: ['mais vendido'], pro: false,
    desc: 'Corta, rala e fatia em segundos. Vem com recipiente coletor.', link: shopee('cortador legumes multifuncional 12 em 1') },
  { id: 'coz-02', cat: 'cozinha', sub: null, nome: 'Jogo de Facas com Suporte Acrílico', emoji: '🔪', preco: 59.90, precoDe: 119.90, nota: 4.7, vendidos: 9400, cupom: null, tags: [], pro: false,
    desc: 'Aço inox afiado e cabo ergonômico. Ótimo presente.', link: shopee('jogo facas suporte acrilico') },
  { id: 'coz-03', cat: 'cozinha', sub: null, nome: 'Balança de Cozinha Digital 10kg', emoji: '⚖️', preco: 24.90, precoDe: 44.90, nota: 4.8, vendidos: 17300, cupom: 'COZ15', tags: ['custo-benefício'], pro: false,
    desc: 'Precisão de 1g. Essencial para quem faz dieta ou confeitaria.', link: shopee('balanca cozinha digital 10kg') },

  // ---------------- BELEZA ----------------
  { id: 'bel-01', cat: 'beleza', sub: null, nome: 'Escova Secadora 3 em 1 Bivolt', emoji: '💇', preco: 89.90, precoDe: 179.90, nota: 4.6, vendidos: 30500, cupom: 'BELA20', tags: ['mais vendido'], pro: false,
    desc: 'Seca, alisa e dá volume. Cerdas que não puxam o cabelo.', link: shopee('escova secadora 3 em 1 bivolt') },
  { id: 'bel-02', cat: 'beleza', sub: null, nome: 'Organizador de Maquiagem Acrílico Giratório', emoji: '💄', preco: 44.90, precoDe: 89.90, nota: 4.8, vendidos: 12800, cupom: null, tags: [], pro: false,
    desc: 'Gira 360° e cabe tudo: batons, bases, pincéis e skincare.', link: shopee('organizador maquiagem acrilico giratorio') },
  { id: 'bel-03', cat: 'beleza', sub: null, nome: 'Massageador Facial Gua Sha + Roller de Quartzo', emoji: '🪨', preco: 19.90, precoDe: 39.90, nota: 4.7, vendidos: 8700, cupom: 'BELA20', tags: ['achado pro'], pro: true,
    desc: 'Reduz inchaço e ajuda na absorção do sérum. Pedra natural.', link: shopee('gua sha roller quartzo rosa') },
];

// Kits prontos para a página Academia
const KITS_ACADEMIA = [
  { id: 'kit-iniciante', nome: 'Kit Iniciante', emoji: '🚀', desc: 'O básico para começar sem gastar muito.', itens: ['aca-01', 'aca-02', 'aca-04', 'aca-08'] },
  { id: 'kit-forca', nome: 'Kit Força', emoji: '💪', desc: 'Para quem quer subir carga com segurança.', itens: ['aca-03', 'aca-06', 'aca-17', 'aca-15'] },
  { id: 'kit-recuperacao', nome: 'Kit Recuperação', emoji: '🧊', desc: 'Menos dor no dia seguinte.', itens: ['aca-09', 'aca-10', 'aca-12', 'aca-16'], pro: true },
];

// Plano Pro
const PLANO_PRO = {
  precoMes: 9.90,
  precoAno: 79.90,
  beneficios: [
    { emoji: '🔓', titulo: 'Achadinhos exclusivos', desc: 'Produtos e kits marcados como "Pro" liberados todos os dias.' },
    { emoji: '🎟️', titulo: 'Cupons em primeira mão', desc: 'Receba códigos de desconto antes de todo mundo.' },
    { emoji: '🔔', titulo: 'Alertas de queda de preço', desc: 'Avisamos quando um favorito seu ficar mais barato.' },
    { emoji: '❤️', titulo: 'Favoritos ilimitados', desc: 'Salve quantos produtos quiser (grátis: até 5).' },
    { emoji: '🚫', titulo: 'Sem anúncios', desc: 'Navegue limpo, sem interrupções.' },
    { emoji: '📋', titulo: 'Listas de compras', desc: 'Monte listas por objetivo e compartilhe com amigos.' },
  ],
  comparativo: [
    { recurso: 'Achadinhos gratuitos', gratis: true, pro: true },
    { recurso: 'Busca e filtros', gratis: true, pro: true },
    { recurso: 'Favoritos', gratis: 'até 5', pro: 'ilimitado' },
    { recurso: 'Achadinhos e kits exclusivos', gratis: false, pro: true },
    { recurso: 'Cupons antecipados', gratis: false, pro: true },
    { recurso: 'Alertas de preço', gratis: false, pro: true },
    { recurso: 'Sem anúncios', gratis: false, pro: true },
  ],
};

const LIMITE_FAVORITOS_GRATIS = 5;
