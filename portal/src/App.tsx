import { Navigate, Route, Routes } from 'react-router-dom';
import { AgencyLayout } from './components/layout/AgencyLayout';
import { ClientLayout } from './components/layout/ClientLayout';
import { HomeRedirect, RequireAuth } from './components/layout/RequireAuth';
import { LoginPage } from './pages/auth/LoginPage';
import { InicioPage } from './pages/client/InicioPage';
import { CalendarioPage } from './pages/client/CalendarioPage';
import { PostDetalhePage } from './pages/client/PostDetalhePage';
import { RelatoriosPage } from './pages/client/RelatoriosPage';
import { ArquivosPage } from './pages/client/ArquivosPage';
import { ClientesPage } from './pages/agency/ClientesPage';
import { ClienteDetalhePage } from './pages/agency/ClienteDetalhePage';
import { PostEditorPage } from './pages/agency/PostEditorPage';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuth area="client" />}>
        <Route path="/app" element={<ClientLayout />}>
          <Route index element={<InicioPage />} />
          <Route path="calendario" element={<CalendarioPage />} />
          <Route path="posts/:id" element={<PostDetalhePage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="arquivos" element={<ArquivosPage />} />
        </Route>
      </Route>

      <Route element={<RequireAuth area="staff" />}>
        <Route path="/agencia" element={<AgencyLayout />}>
          <Route index element={<ClientesPage />} />
          <Route path="clientes/:clientId" element={<ClienteDetalhePage />} />
          <Route path="clientes/:clientId/posts/novo" element={<PostEditorPage />} />
          <Route path="posts/:id" element={<PostEditorPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
