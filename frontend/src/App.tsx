import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Navbar } from "./shared/components/Navbar.js"
import { ErrorBoundary } from "./shared/components/ErrorBoundary.js"
import { FeedbackProvider } from "./shared/feedback/FeedbackProvider.js"
import { AuthProvider } from "./shared/auth/AuthContext.js"
import { ProtectedRoute } from "./shared/auth/ProtectedRoute.js"
import { AdminRoute } from "./shared/auth/AdminRoute.js"
import { LoginPage } from "./modules/auth/pages/LoginPage.js"
import { PerfilPage } from "./modules/auth/pages/PerfilPage.js"
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
        <Route path="*" element={
          <ProtectedRoute>
            <>
              <Navbar />
              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<OperacoesDashboard />} />
                  <Route path="/rota" element={<RotaPage />} />
                  <Route path="/cobrancas" element={<CobrancaListPage />} />
                  <Route path="/atendidos" element={<AtendidosPage />} />
                  <Route path="/clientes" element={<ClienteList />} />
                  <Route path="/clientes/novo" element={<ClienteNovo />} />
                  <Route path="/clientes/:id" element={<ClienteDetail />} />
                  <Route path="/clientes/:id/editar" element={<ClienteEdit />} />
                  <Route path="/contratos" element={<ContratoList />} />
                  <Route path="/contratos/novo" element={<ContratoNovo />} />
                  <Route path="/contratos/:id" element={<ContratoDetail />} />
                  <Route path="/contratos/:id/editar" element={<ContratoEdit />} />
                  <Route path="/caixa" element={<CaixaPage />} />
                  <Route path="/gastos" element={<GastoPage />} />
                   <Route path="/perfil" element={<PerfilPage />} />
                   <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                   <Route path="/admin/operadores/:id" element={<AdminRoute><OperadorDetail /></AdminRoute>} />
                   <Route path="/admin/empresas" element={<AdminRoute><SuperAdminPage /></AdminRoute>} />
                   <Route path="/admin/empresas/:id" element={<AdminRoute><AdminPage /></AdminRoute>} />
                </Routes>
              </ErrorBoundary>
            </>
          </ProtectedRoute>
        } />
      </Routes>
      </FeedbackProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
