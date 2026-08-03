import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff } from "lucide-react"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { Button } from "../../../shared/components/Button.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [senha, setSenha] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setLoading(true)

    try {
      const response = await login(email, senha)
      const role = response.usuario.role
      navigate(role === "super_admin" ? "/admin/empresas" : role === "admin" ? "/admin" : "/")
    } catch (err) {
      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setErro("Erro de conexão. Verifique sua internet.")
        setLoading(false)
        return
      }
      setErro(t("auth.erroLogin"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-page px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary">NX Gestão</h1>
          <p className="text-text-secondary mt-1 text-sm">{t("auth.title")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface rounded-lg border border-border-light p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t("auth.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">{t("auth.senha")}</label>
            <div className="relative">
              <input
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 pr-10 text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                aria-label={mostrarSenha ? t("auth.ocultarSenha") : t("auth.mostrarSenha")}
                title={mostrarSenha ? t("auth.ocultarSenha") : t("auth.mostrarSenha")}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-primary"
              >
                {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {erro && (
            <ErrorBanner message={erro} onDismiss={() => setErro("")} />
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("common.loading") : t("auth.entrar")}
          </Button>
        </form>
      </div>
    </div>
  )
}
