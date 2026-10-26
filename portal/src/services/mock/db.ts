// Banco em memória do modo demonstração (sem .env.local).
// Mesmo formato das tabelas da seção 4 do escopo. Some ao recarregar a página.

import type {
  Agency,
  Client,
  FileRecord,
  Post,
  PostComment,
  PostVersion,
  Profile,
  Report,
} from '../../types/database';
import { monthKey } from '../../lib/format';

export function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function nowIso(): string {
  return new Date().toISOString();
}

const today = new Date();
function at(days: number, hour = 10): string {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}
function month(offset: number): string {
  return monthKey(new Date(today.getFullYear(), today.getMonth() + offset, 1));
}

const AG = 'agency-nuby';
const ANA = 'client-odonto-ana';
const BEM = 'client-bem-viver';
const MOV = 'client-movere';
const ADMIN = 'user-nuby-admin';
const MEMBER = 'user-nuby-rafa';
const DRA_ANA = 'user-dra-ana';
const RECEP = 'user-recepcao-ana';
const HELENA = 'user-helena';

const agencies: Agency[] = [
  { id: AG, created_at: at(-200), name: 'Nuby Marketing', slug: 'nuby', logo_url: null, primary_color: '#8B5CF6', plan: 'agencia', status: 'active', trial_ends_at: null, onboarding_done_at: at(-200) },
];

const clients: Client[] = [
  { id: ANA, created_at: at(-180), agency_id: AG, name: 'Odonto Ana', specialty: 'Odontologia', contact_email: 'contato@odontoana.com.br', active: true, color: null, monthly_fee: null, billing_day: null },
  { id: BEM, created_at: at(-120), agency_id: AG, name: 'Espaço Bem-Viver', specialty: 'Psicologia', contact_email: 'ola@bemviver.com.br', active: true, color: null, monthly_fee: null, billing_day: null },
  { id: MOV, created_at: at(-90), agency_id: AG, name: 'Clínica Movere', specialty: 'Fisioterapia', contact_email: 'adm@movere.com.br', active: true, color: null, monthly_fee: null, billing_day: null },
];

const profiles: Profile[] = [
  { id: ADMIN, created_at: at(-200), agency_id: AG, client_id: null, role: 'agency_admin', full_name: 'Marina Nuby', email: 'marina@nuby.com.br', tour_done_at: null },
  { id: MEMBER, created_at: at(-150), agency_id: AG, client_id: null, role: 'agency_member', full_name: 'Rafa Criação', email: 'rafa@nuby.com.br', tour_done_at: null },
  { id: DRA_ANA, created_at: at(-180), agency_id: AG, client_id: ANA, role: 'client_owner', full_name: 'Dra. Ana Souza', email: 'ana@odontoana.com.br', tour_done_at: null },
  { id: RECEP, created_at: at(-60), agency_id: AG, client_id: ANA, role: 'client_member', full_name: 'Juliana Recepção', email: 'recepcao@odontoana.com.br', tour_done_at: null },
  { id: HELENA, created_at: at(-120), agency_id: AG, client_id: BEM, role: 'client_owner', full_name: 'Helena Braga', email: 'helena@bemviver.com.br', tour_done_at: null },
];

// Mídia de demonstração: "demo:<cor>:<rótulo>" vira um bloco colorido na tela.
interface SeedPost {
  id: string;
  client: string;
  title: string;
  caption: string;
  network: Post['network'];
  format: Post['format'];
  day: number;
  status: Post['status'];
  versions: number;
  media: string[];
}

const seedPosts: SeedPost[] = [
  { id: 'post-1', client: ANA, title: '5 mitos sobre clareamento', caption: 'Clareamento não enfraquece o dente. Com acompanhamento certo você sai daqui com o sorriso mais claro e o esmalte intacto. Agende sua avaliação.', network: 'instagram', format: 'carrossel', day: 3, status: 'awaiting_approval', versions: 1, media: ['demo:violet:Slide 1', 'demo:azure:Slide 2', 'demo:teal:Slide 3'] },
  { id: 'post-2', client: ANA, title: 'Tour pelo consultório', caption: 'Vem conhecer onde a gente cuida do seu sorriso. Sem pressa, sem fila, com café.', network: 'instagram', format: 'reels', day: 6, status: 'awaiting_approval', versions: 1, media: ['demo:azure:Vídeo'] },
  { id: 'post-3', client: ANA, title: 'Bastidor da equipe', caption: 'Segunda começa assim: time reunido, agenda organizada, você bem atendido.', network: 'instagram', format: 'story', day: 8, status: 'changes_requested', versions: 1, media: ['demo:teal:Story'] },
  { id: 'post-4', client: ANA, title: 'Quando trocar a escova?', caption: 'A cada 3 meses, ou antes se as cerdas abrirem. Simples assim.', network: 'facebook', format: 'imagem', day: 10, status: 'approved', versions: 2, media: ['demo:violet:Arte'] },
  { id: 'post-5', client: ANA, title: 'Depoimento: aparelho invisível', caption: 'O que mudou depois do alinhador, contado por quem usou.', network: 'instagram', format: 'video', day: -4, status: 'published', versions: 1, media: ['demo:azure:Vídeo'] },
  { id: 'post-6', client: ANA, title: 'Convênio novo aceito', caption: 'Agora atendemos mais um convênio. Confira se o seu está na lista.', network: 'instagram', format: 'imagem', day: -9, status: 'published', versions: 1, media: ['demo:teal:Arte'] },
  { id: 'post-7', client: ANA, title: 'Campanha de dezembro (rascunho)', caption: 'Rascunho interno, ainda sem texto final.', network: 'instagram', format: 'carrossel', day: 14, status: 'in_creation', versions: 1, media: [] },
  { id: 'post-8', client: BEM, title: 'Ansiedade no fim de ano', caption: 'Cinco sinais de que vale conversar com alguém.', network: 'instagram', format: 'carrossel', day: 4, status: 'awaiting_approval', versions: 1, media: ['demo:violet:Slide 1', 'demo:teal:Slide 2'] },
  { id: 'post-9', client: BEM, title: 'Terapia online: como funciona', caption: 'Sessão por vídeo, com o mesmo sigilo do consultório.', network: 'linkedin', format: 'imagem', day: 9, status: 'approved', versions: 1, media: ['demo:azure:Arte'] },
  { id: 'post-10', client: MOV, title: 'Postura no home office', caption: 'Três ajustes rápidos na sua mesa.', network: 'instagram', format: 'reels', day: 5, status: 'in_creation', versions: 1, media: [] },
];

const posts: Post[] = [];
const post_versions: PostVersion[] = [];
const post_comments: PostComment[] = [];

for (const s of seedPosts) {
  const created = at(s.day - 12);
  posts.push({
    id: s.id,
    created_at: created,
    updated_at: created,
    agency_id: AG,
    client_id: s.client,
    title: s.title,
    caption: s.caption,
    network: s.network,
    format: s.format,
    scheduled_at: at(s.day, 11),
    status: s.status,
    current_version: s.versions,
    created_by: MEMBER,
    assignee_id: MEMBER,
    status_changed_at: created,
  });
  for (let v = 1; v <= s.versions; v++) {
    post_versions.push({
      id: `${s.id}-v${v}`,
      created_at: at(s.day - 12 + v),
      post_id: s.id,
      agency_id: AG,
      client_id: s.client,
      version_number: v,
      caption: v === s.versions ? s.caption : s.caption.replace('.', ' (primeira versão).'),
      media: s.media.map((m) => `${AG}/${s.client}/${s.id}/v${v}/${m}`),
      created_by: MEMBER,
    });
  }
}

post_comments.push(
  { id: uid(), created_at: at(-2, 15), post_id: 'post-3', agency_id: AG, client_id: ANA, author_id: DRA_ANA, body: 'Prefiro uma foto com a equipe toda, não só a recepção.', kind: 'change_request' },
  { id: uid(), created_at: at(-6, 9), post_id: 'post-4', agency_id: AG, client_id: ANA, author_id: DRA_ANA, body: 'Pode trocar a cor do fundo para o azul da marca?', kind: 'change_request' },
  { id: uid(), created_at: at(-3, 18), post_id: 'post-4', agency_id: AG, client_id: ANA, author_id: DRA_ANA, body: 'Aprovado.', kind: 'approval' },
  { id: uid(), created_at: at(-1, 10), post_id: 'post-1', agency_id: AG, client_id: ANA, author_id: MEMBER, body: 'Dra., esse carrossel abre a campanha de clareamento. Se aprovar hoje entra no ar sem atraso.', kind: 'comment' },
);

function report(client: string, offset: number, r: Partial<Report>, published = true): Report {
  return {
    id: `report-${client}-${offset}`,
    created_at: at(offset * 30),
    updated_at: at(offset * 30),
    agency_id: AG,
    client_id: client,
    month: month(offset),
    reach: null,
    new_followers: null,
    contacts: null,
    appointments: null,
    ad_spend: null,
    cost_per_lead: null,
    notes: null,
    pdf_path: null,
    published,
    ...r,
  };
}

const reports: Report[] = [
  report(ANA, -3, { reach: 6100, new_followers: 120, contacts: 7, appointments: 5, ad_spend: 920, cost_per_lead: 131.43, notes: 'Base de comparação do trimestre.' }),
  report(ANA, -2, { reach: 7500, new_followers: 151, contacts: 9, appointments: 7, ad_spend: 1050, cost_per_lead: 116.67, notes: 'Primeiro mês da campanha de clareamento.', pdf_path: `${AG}/${ANA}/relatorio-2.pdf` }),
  report(ANA, -1, { reach: 8412, new_followers: 184, contacts: 12, appointments: 9, ad_spend: 1150, cost_per_lead: 95.83, notes: 'Instagram foi o melhor canal. Custo por contato caiu 18%.', pdf_path: `${AG}/${ANA}/relatorio-1.pdf` }),
  report(ANA, 0, { reach: 4100, contacts: 6, ad_spend: 600 }, false),
  report(BEM, -1, { reach: 3200, new_followers: 64, contacts: 6, appointments: 4, ad_spend: 860, cost_per_lead: 143.33 }),
];

function file(client: string, folder: FileRecord['folder'], name: string, mime: string, size: number, by = MEMBER): FileRecord {
  return {
    id: uid(),
    created_at: at(-20),
    agency_id: AG,
    client_id: client,
    folder,
    name,
    storage_path: `${AG}/${client}/${uid()}-${name}`,
    mime_type: mime,
    size_bytes: size,
    uploaded_by: by,
  };
}

const files: FileRecord[] = [
  file(ANA, 'marca', 'logo-horizontal.png', 'image/png', 240_000),
  file(ANA, 'marca', 'logo-fundo-escuro.png', 'image/png', 210_000),
  file(ANA, 'marca', 'manual-da-marca.pdf', 'application/pdf', 3_400_000),
  file(ANA, 'artes_finais', 'post-clareamento.png', 'image/png', 1_200_000),
  file(ANA, 'artes_finais', 'template-story.png', 'image/png', 800_000),
  file(ANA, 'fotos_videos', 'video-novo-aparelho.mp4', 'video/mp4', 48_000_000, DRA_ANA),
  file(BEM, 'marca', 'logo-bem-viver.png', 'image/png', 180_000),
];

const DB_KEY = 'nuby_mock_db_v1';
const seed = { agencies, clients, profiles, posts, post_versions, post_comments, reports, files };
type MockDb = typeof seed;

function loadStored(): MockDb | null {
  try {
    const raw = window.localStorage.getItem(DB_KEY);
    return raw ? (JSON.parse(raw) as MockDb) : null;
  } catch {
    return null;
  }
}

/** Dados da demonstração ficam salvos neste navegador para sobreviver a recarregamentos. */
export const db: MockDb = loadStored() ?? seed;

function persist() {
  try {
    window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // sem storage: a demonstração vale só até recarregar
  }
}

/** Volta para os dados de exemplo originais. */
export function resetMockDb() {
  try {
    window.localStorage.removeItem(DB_KEY);
  } catch {
    // nada a fazer
  }
  window.location.reload();
}

/** Arquivos enviados nesta sessão: caminho no storage -> URL local. */
export const storageObjects = new Map<string, string>();

/** Simula a latência da rede e salva o estado (leituras e escritas passam por aqui). */
export function delay<T>(value: T, ms = 250): Promise<T> {
  persist();
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}
