import { lazy, Suspense, type ComponentType } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { AppLayout } from "./shared/layout/AppLayout.js"
import { ErrorBoundary } from "./shared/components/ErrorBoundary.js"
import { FeedbackProvider } from "./shared/feedback/FeedbackProvider.js"
import { AuthProvider } from "./shared/auth/AuthContext.js"
import { ProtectedRoute } from "./shared/auth/ProtectedRoute.js"
import { AdminRoute } from "./shared/auth/AdminRoute.js"
import { SuperAdminRoute } from "./shared/auth/SuperAdminRoute.js"
import { RequireModule } from "./shared/auth/RequireModule.js"

// PLAN-077 (performance): code-splitting por rota — cada página vira um chunk próprio.
// Antes, 28 páginas eram import estático no topo (bundle único; HMR recompilava tudo).
// As páginas do projeto exportam por NOME (`export function X`), então o loader resolve
// o componente pelo nome informado.
const lazyPage = (name: string, loader: () => Promise<Record<string, unknown>>) => {
  const Lazy = lazy(async () => {
    const mod = await loader()
    const Component = mod[name]
    if (typeof Component !== "function") {
      throw new Error(`Página "${name}" não encontrada no módulo lazy`)
    }
    return { default: Component as ComponentType }
  })
  return (
    <Suspense fallback={<div className="flex min-h-40 items-center justify-center"><div className="size-6 animate-spin rounded-full border-b-2 border-primary" /></div>}>
      <Lazy />
    </Suspense>
  )
}

const LoginPage = () => lazyPage("LoginPage", () => import("./modules/auth/pages/LoginPage.js"))
const PerfilPage = () => lazyPage("PerfilPage", () => import("./modules/auth/pages/PerfilPage.js"))
const RecuperarSenhaPage = () => lazyPage("RecuperarSenhaPage", () => import("./modules/auth/pages/RecuperarSenhaPage.js"))
const ResetarSenhaPage = () => lazyPage("ResetarSenhaPage", () => import("./modules/auth/pages/ResetarSenhaPage.js"))
const AtivarPage = () => lazyPage("AtivarPage", () => import("./modules/auth/pages/AtivarPage.js"))
const VerificarEmailPage = () => lazyPage("VerificarEmailPage", () => import("./modules/auth/pages/VerificarEmailPage.js"))
const QueroConhecerPage = () => lazyPage("QueroConhecerPage", () => import("./modules/leads/pages/QueroConhecerPage.js"))
const ConfirmarLeadPage = () => lazyPage("ConfirmarLeadPage", () => import("./modules/leads/pages/ConfirmarLeadPage.js"))
const LeadsAdminPage = () => lazyPage("LeadsAdminPage", () => import("./modules/leads/pages/LeadsAdminPage.js"))
const OperacoesDashboard = () => lazyPage("OperacoesDashboard", () => import("./modules/operacoes/pages/OperacoesDashboard.js"))
const CobrancaListPage = () => lazyPage("CobrancaListPage", () => import("./modules/operacoes/pages/CobrancaListPage.js"))
const AtendidosPage = () => lazyPage("AtendidosPage", () => import("./modules/operacoes/pages/AtendidosPage.js"))
const RotaPage = () => lazyPage("RotaPage", () => import("./modules/operacoes/pages/RotaPage.js"))
const ClienteList = () => lazyPage("ClienteList", () => import("./modules/cliente/pages/ClienteList.js"))
const ClienteDetail = () => lazyPage("ClienteDetail", () => import("./modules/cliente/pages/ClienteDetail.js"))
const ClienteNovo = () => lazyPage("ClienteNovo", () => import("./modules/cliente/pages/ClienteNovo.js"))
const ClienteEdit = () => lazyPage("ClienteEdit", () => import("./modules/cliente/pages/ClienteEdit.js"))
const ContratoList = () => lazyPage("ContratoList", () => import("./modules/contrato/pages/ContratoList.js"))
const ContratoDetail = () => lazyPage("ContratoDetail", () => import("./modules/contrato/pages/ContratoDetail.js"))
const ContratoNovo = () => lazyPage("ContratoNovo", () => import("./modules/contrato/pages/ContratoNovo.js"))
const ContratoEdit = () => lazyPage("ContratoEdit", () => import("./modules/contrato/pages/ContratoEdit.js"))
const CaixaPage = () => lazyPage("CaixaPage", () => import("./modules/caixa/pages/CaixaPage.js"))
const GastoPage = () => lazyPage("GastoPage", () => import("./modules/gasto/pages/GastoPage.js"))
const AdminPage = () => lazyPage("AdminPage", () => import("./modules/admin/pages/AdminPage.js"))
const SuperAdminPage = () => lazyPage("SuperAdminPage", () => import("./modules/admin/pages/SuperAdminPage.js"))
const OperadorDetail = () => lazyPage("OperadorDetail", () => import("./modules/admin/pages/OperadorDetail.js"))

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
        <Route path="/verificar-email" element={<VerificarEmailPage />} />
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
