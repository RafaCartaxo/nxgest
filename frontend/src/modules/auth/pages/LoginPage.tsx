import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { Button } from "../../../shared/components/Button.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { Logo } from "../../../shared/components/Logo.js"

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
      navigate(role === "super_admin" ? "/admin/empresas" : role === "admin" || role === "socio" ? "/admin" : "/")
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
    <div className="relative min-h-[100dvh] bg-gradient-page px-4">
      <div aria-hidden className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col items-center justify-center gap-5 px-5 py-6 sm:gap-7 lg:flex-row lg:items-center lg:gap-16">
        {/* Marca */}
        <div className="w-full max-w-md text-center lg:text-left">
          <Logo
            variant="lg"
            className="mx-auto h-[clamp(4.5rem,14vh,7.5rem)] w-[clamp(4.5rem,14vh,7.5rem)] text-primary lg:mx-0 lg:h-32 lg:w-32"
          />
          <h1 className="mt-3 font-display text-[clamp(1.75rem,6vw,2.5rem)] font-semibold leading-tight">
            NX <span className="text-brand-gradient">Gestão</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary sm:text-base">{t("auth.tagline")}</p>
          {/* parágrafo só em sm+/desktop — no celular pequeno causa scroll */}
          <p className="mt-3 hidden text-sm text-text-muted sm:block">
            Um hub que conecta cobrança em campo, clientes, contratos e caixa — e cresce junto com novos
            segmentos.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs text-text-secondary">
            <ShieldCheck className="size-3.5 text-success" aria-hidden />
            {t("auth.acessoEmpresa")}
          </div>
        </div>

        {/* Card de acesso */}
        <div className="w-full max-w-sm rounded-lg border border-border-light bg-surface p-6 shadow-sm">
          <h2 className="font-display text-[22px] font-semibold">{t("auth.title")}</h2>
          <p className="mt-1 mb-5 text-sm text-text-secondary">{t("auth.loginCardSubtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">{t("auth.email")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-text-primary">{t("auth.senha")}</label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full rounded-md border border-border px-3 py-2 pr-10 text-base focus:ring-2 focus:ring-primary focus:border-primary"
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

            {erro && <ErrorBanner message={erro} onDismiss={() => setErro("")} />}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("common.loading") : t("auth.entrar")}
              {!loading && <ArrowRight className="size-4" aria-hidden />}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
