import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { PublicPageShell } from "../components/PublicPageShell.js"
import { esquecerSenha } from "../services/auth.service.js"
import { ApiError } from "../../../api/client.js"

export function RecuperarSenhaPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    if (!email.trim() || !email.includes("@")) {
      setErro(t("auth.validacaoEmail"))
      return
    }
    setLoading(true)
    try {
      await esquecerSenha(email.trim())
      setEnviado(true)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : t("auth.erroRecuperar"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicPageShell>
      <h2 className="font-display text-[22px] font-semibold">{t("auth.recuperarTitle")}</h2>
      <p className="mt-1 mb-5 text-sm text-text-secondary">{t("auth.recuperarSubtitle")}</p>

      {enviado ? (
        <SuccessState
          title={t("auth.recuperarEnviado")}
          detail={t("auth.recuperarEnviadoDetail")}
          linkLabel={t("auth.voltarLogin")}
          onLinkClick={() => navigate("/login")}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          {erro && <ErrorBanner message={erro} onDismiss={() => setErro("")} />}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? t("common.loading") : t("auth.enviarLink")}
            {!loading && <ArrowRight className="size-4" aria-hidden />}
          </Button>

          <Link
            to="/login"
            className="flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t("auth.voltarLogin")}
          </Link>
        </form>
      )}
    </PublicPageShell>
  )
}
