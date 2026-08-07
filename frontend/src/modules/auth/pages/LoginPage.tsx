import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { Logo } from "../../../shared/components/Logo.js"
import { ApiError } from "../../../api/client.js"

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
      // ApiError já traz a mensagem traduzida (ex.: ACCOUNT_PENDING do convidado).
      setErro(err instanceof ApiError ? err.message : t("auth.erroLogin"))
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
            <Field
              label={t("auth.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Field
              label={t("auth.senha")}
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
              right={
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  aria-label={mostrarSenha ? t("auth.ocultarSenha") : t("auth.mostrarSenha")}
                  title={mostrarSenha ? t("auth.ocultarSenha") : t("auth.mostrarSenha")}
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-text-muted hover:text-text-primary"
                >
                  {mostrarSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />

            {erro && <ErrorBanner message={erro} onDismiss={() => setErro("")} />}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("common.loading") : t("auth.entrar")}
              {!loading && <ArrowRight className="size-4" aria-hidden />}
            </Button>
          </form>

          <Link
            to="/recuperar-senha"
            className="mt-4 block text-center text-sm font-medium text-primary hover:underline"
          >
            {t("auth.esqueciSenha")}
          </Link>
        </div>
      </div>
    </div>
  )
}
