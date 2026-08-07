import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./shared/layout/AppLayout.js"
import { ErrorBoundary } from "./shared/components/ErrorBoundary.js"
import { FeedbackProvider } from "./shared/feedback/FeedbackProvider.js"
import { AuthProvider } from "./shared/auth/AuthContext.js"
import { ProtectedRoute } from "./shared/auth/ProtectedRoute.js"
import { AdminRoute } from "./shared/auth/AdminRoute.js"
import { SuperAdminRoute } from "./shared/auth/SuperAdminRoute.js"
import { RequireModule } from "./shared/auth/RequireModule.js"
import { LoginPage } from "./modules/auth/pages/LoginPage.js"
import { PerfilPage } from "./modules/auth/pages/PerfilPage.js"
import { RecuperarSenhaPage } from "./modules/auth/pages/RecuperarSenhaPage.js"
import { ResetarSenhaPage } from "./modules/auth/pages/ResetarSenhaPage.js"
import { AtivarPage } from "./modules/auth/pages/AtivarPage.js"
import { QueroConhecerPage } from "./modules/leads/pages/QueroConhecerPage.js"
import { ConfirmarLeadPage } from "./modules/leads/pages/ConfirmarLeadPage.js"
import { LeadsAdminPage } from "./modules/leads/pages/LeadsAdminPage.js"
import { OperacoesDashboard } from "./modules/operacoes/pages/OperacoesDashboard.js"
import { CobrancaListPage } from "./modules/operacoes/pages/CobrancaListPage.js"
import { AtendidosPage } from "./modules/operacoes/pages/AtendidosPage.js"
import { RotaPage } from "./modules/operacoes/pages/RotaPage.js"
import { ClienteList } from "./modules/cliente/pages/ClienteList.js"
import { ClienteDetail } from "./modules/cliente/pages/ClienteDetail.js"
import { ClienteNovo } from "./modules/cliente/pages/ClienteNovo.js"
import { ClienteEdit } from "./modules/cliente/pages/ClienteEdit.js"
import { ContratoList } from "./modules/contrato/pages/ContratoList.js"
import { ContratoDetail } from "./modules/contrato/pages/ContratoDetail.js"
import { ContratoNovo } from "./modules/contrato/pages/ContratoNovo.js"
import { ContratoEdit } from "./modules/contrato/pages/ContratoEdit.js"
import { CaixaPage } from "./modules/caixa/pages/CaixaPage.js"
import { GastoPage } from "./modules/gasto/pages/GastoPage.js"
import { AdminPage } from "./modules/admin/pages/AdminPage.js"
import { SuperAdminPage } from "./modules/admin/pages/SuperAdminPage.js"
import { OperadorDetail } from "./modules/admin/pages/OperadorDetail.js"

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <FeedbackProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
        <Route path="/resetar-senha" element={<ResetarSenhaPage />} />
        <Route path="/ativar" element={<AtivarPage />} />
        <Route path="/quero-conhecer" element={<QueroConhecerPage />} />
        <Route path="/quero-conhecer/confirmar" element={<ConfirmarLeadPage />} />
        <Route path="*" element={
          <ProtectedRoute>
            <AppLayout>
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<OperacoesDashboard />} />
                  <Route path="/rota" element={<RequireModule mod="rota"><RotaPage /></RequireModule>} />
                  <Route path="/cobrancas" element={<RequireModule mod="cobrancas"><CobrancaListPage /></RequireModule>} />
                  <Route path="/atendidos" element={<RequireModule mod="atendidos"><AtendidosPage /></RequireModule>} />
                  <Route path="/clientes" element={<RequireModule mod="clientes"><ClienteList /></RequireModule>} />
                  <Route path="/clientes/novo" element={<RequireModule mod="clientes"><ClienteNovo /></RequireModule>} />
                  <Route path="/clientes/:id" element={<RequireModule mod="clientes"><ClienteDetail /></RequireModule>} />
                  <Route path="/clientes/:id/editar" element={<RequireModule mod="clientes"><ClienteEdit /></RequireModule>} />
                  <Route path="/contratos" element={<RequireModule mod="contratos"><ContratoList /></RequireModule>} />
                  <Route path="/contratos/novo" element={<RequireModule mod="contratos"><ContratoNovo /></RequireModule>} />
                  <Route path="/contratos/:id" element={<RequireModule mod="contratos"><ContratoDetail /></RequireModule>} />
                  <Route path="/contratos/:id/editar" element={<RequireModule mod="contratos"><ContratoEdit /></RequireModule>} />
                  <Route path="/caixa" element={<RequireModule mod="caixa"><CaixaPage /></RequireModule>} />
                  <Route path="/gastos" element={<RequireModule mod="gastos"><GastoPage /></RequireModule>} />
                   <Route path="/perfil" element={<PerfilPage />} />
                   <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                   <Route path="/admin/operadores/:id" element={<AdminRoute><OperadorDetail /></AdminRoute>} />
                   <Route path="/admin/empresas" element={<SuperAdminRoute><SuperAdminPage /></SuperAdminRoute>} />
                   <Route path="/admin/empresas/:id" element={<SuperAdminRoute><AdminPage /></SuperAdminRoute>} />
                   <Route path="/admin/leads" element={<SuperAdminRoute><LeadsAdminPage /></SuperAdminRoute>} />
                 </Routes>
              </ErrorBoundary>
            </AppLayout>
          </ProtectedRoute>
        } />
      </Routes>
      </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
