import { Navigate, Route, Routes } from 'react-router-dom';
import { AgencyLayout } from './components/layout/AgencyLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { HomeRedirect, RequireAuth } from './components/layout/RequireAuth';
import { useAuthListener } from './hooks/useAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { CadastroPage } from './pages/auth/CadastroPage';
import { BoasVindasPage } from './pages/agency/BoasVindasPage';
import { InicioPage } from './pages/client/InicioPage';
import { PostDetalhePage } from './pages/client/PostDetalhePage';
import { MeusPostsPage } from './pages/client/MeusPostsPage';
import { ResultadosPage } from './pages/client/ResultadosPage';
import { AprovarPage } from './pages/client/AprovarPage';
import { ArquivosPage } from './pages/client/ArquivosPage';
import { ClientesPage } from './pages/agency/ClientesPage';
import { ClienteDetalhePage } from './pages/agency/ClienteDetalhePage';
import { PostEditorPage } from './pages/agency/PostEditorPage';
import { EquipePage } from './pages/agency/EquipePage';
import { VisaoGeralPage } from './pages/agency/VisaoGeralPage';
import { PostsGeralPage } from './pages/agency/PostsGeralPage';
import { CalendarioGeralPage } from './pages/agency/CalendarioGeralPage';
import { RelatoriosPendentesPage } from './pages/agency/RelatoriosPendentesPage';
import { ConfiguracoesPage } from './pages/agency/ConfiguracoesPage';
import { PlataformaPage } from './pages/platform/PlataformaPage';

export function App() {
  useAuthListener();
  return (
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
            <Route path="posts" element={<PostsGeralPage />} />
            <Route path="calendario" element={<CalendarioGeralPage />} />
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
  );
}
