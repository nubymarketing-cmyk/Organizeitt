import { Suspense, lazy, type ComponentType } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AgencyLayout } from './components/layout/AgencyLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { HomeRedirect, RequireAuth } from './components/layout/RequireAuth';
import { useAuthListener } from './hooks/useAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { PageFallback } from './components/ui';

/** Página carregada só quando é aberta (o login vem junto, por ser a primeira tela). */
function page<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })));
}

const CadastroPage = page(() => import('./pages/auth/CadastroPage'), 'CadastroPage');
const BoasVindasPage = page(() => import('./pages/agency/BoasVindasPage'), 'BoasVindasPage');
const InicioPage = page(() => import('./pages/client/InicioPage'), 'InicioPage');
const PostDetalhePage = page(() => import('./pages/client/PostDetalhePage'), 'PostDetalhePage');
const MeusPostsPage = page(() => import('./pages/client/MeusPostsPage'), 'MeusPostsPage');
const ResultadosPage = page(() => import('./pages/client/ResultadosPage'), 'ResultadosPage');
const AprovarPage = page(() => import('./pages/client/AprovarPage'), 'AprovarPage');
const ArquivosPage = page(() => import('./pages/client/ArquivosPage'), 'ArquivosPage');
const ClientesPage = page(() => import('./pages/agency/ClientesPage'), 'ClientesPage');
const ClienteDetalhePage = page(() => import('./pages/agency/ClienteDetalhePage'), 'ClienteDetalhePage');
const PostEditorPage = page(() => import('./pages/agency/PostEditorPage'), 'PostEditorPage');
const EquipePage = page(() => import('./pages/agency/EquipePage'), 'EquipePage');
const VisaoGeralPage = page(() => import('./pages/agency/VisaoGeralPage'), 'VisaoGeralPage');
const AgendaPage = page(() => import('./pages/agency/AgendaPage'), 'AgendaPage');
const RelatoriosPendentesPage = page(() => import('./pages/agency/RelatoriosPendentesPage'), 'RelatoriosPendentesPage');
const ConfiguracoesPage = page(() => import('./pages/agency/ConfiguracoesPage'), 'ConfiguracoesPage');
const PlataformaPage = page(() => import('./pages/platform/PlataformaPage'), 'PlataformaPage');

export function App() {
  useAuthListener();
  return (
    <Suspense fallback={<PageFallback />}>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />

      <Route element={<RequireAuth area="client" />}>
        <Route path="/app" element={<ClientLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="posts" element={<MeusPostsPage />} />
          <Route path="posts/:id" element={<PostDetalhePage />} />
          <Route path="resultados" element={<ResultadosPage />} />
          {/* Endereços antigos */}
          <Route path="calendario" element={<Navigate to="/app/posts" replace />} />
          <Route path="relatorios" element={<Navigate to="/app/resultados" replace />} />
          <Route path="arquivos" element={<ArquivosPage />} />
        </Route>
        {/* Aprovação em tela cheia, sem o menu de baixo. */}
        <Route path="/app/aprovar" element={<AprovarPage />} />
      </Route>

      <Route element={<RequireAuth area="staff" />}>
        <Route element={<AgencyLayout />}>
          <Route path="/agencia">
            <Route index element={<VisaoGeralPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="agenda" element={<AgendaPage />} />
            {/* Endereços antigos: calendário e lista gerais viraram a Agenda */}
            <Route path="posts" element={<ToAgenda view="lista" />} />
            <Route path="calendario" element={<ToAgenda />} />
            <Route path="relatorios-pendentes" element={<RelatoriosPendentesPage />} />
            <Route path="clientes/:clientId" element={<ClienteDetalhePage />} />
            <Route path="clientes/:clientId/posts/novo" element={<PostEditorPage />} />
            <Route path="posts/:id" element={<PostEditorPage />} />
            <Route path="equipe" element={<EquipePage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
            <Route path="boas-vindas" element={<BoasVindasPage />} />
          </Route>
          <Route path="/plataforma" element={<PlataformaPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </Suspense>
  );
}

/** Redireciona para a Agenda mantendo os filtros da URL antiga. */
function ToAgenda({ view }: { view?: 'lista' }) {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  if (view) params.set('visao', view);
  const q = params.toString();
  return <Navigate to={`/agencia/agenda${q ? `?${q}` : ''}`} replace />;
}
