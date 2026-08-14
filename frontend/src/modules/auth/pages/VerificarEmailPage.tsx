import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { Button } from "../../../shared/components/Button.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { PublicPageShell } from "../components/PublicPageShell.js"
import { verificarEmail } from "../services/auth.service.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { ApiError } from "../../../api/client.js"

/**
 * PLAN-075 F4: destino do link de confirmação de troca de e-mail.
 * O endpoint exige sessão — sem login, redireciona pro login preservando
 * `state.from` pra voltar após autenticar (LoginPage já respeita).
 */
export function VerificarEmailPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [erro, setErro] = useState("")
  const [feito, setFeito] = useState(false)
  // Evita requisição dupla em StrictMode.
  const disparou = useRef(false)

  useEffect(() => {
    if (location.state?.from?.pathname && location.state?.from?.pathname !== location.pathname) {
      navigate(location.state.from, { replace: true })
    }
  }, [location, navigate])

  useEffect(() => {
    if (!token || loading || !user) return
    if (disparou.current) return
    disparou.current = true

    verificarEmail(token)
      .then(async () => {
        await refreshUser()
        setFeito(true)
      })
      .catch((err) => {
        if (err instanceof ApiError) {
          setErro(
            err.code === "TOKEN_EXPIRED" ? t("auth.verificarTokenExpirado") :
            err.code === "TOKEN_INVALID" ? t("auth.verificarTokenInvalido") :
            err.message
          )
        } else {
          setErro(t("auth.erroVerificar"))
        }
      })
  }, [token, loading, user, refreshUser, t])

  function irParaPerfil() {
    navigate("/perfil")
  }

  if (loading) {
    return (
      <PublicPageShell>
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </PublicPageShell>
    )
  }

  // Sem sessão: manda pro login, que volta pra cá após autenticar.
  if (!user) {
    navigate("/login", { replace: true, state: { from: location } })
    return null
  }

  return (
    <PublicPageShell>
      <h2 className="font-display text-[22px] font-semibold">{t("auth.verificarTitle")}</h2>
      <p className="mt-1 mb-5 text-sm text-text-secondary">{t("auth.verificarSubtitle")}</p>

      {!token ? (
        <ErrorBanner message={t("auth.verificarSemToken")} />
      ) : feito ? (
        <SuccessState
          title={t("auth.verificarFeito")}
          detail={t("auth.verificarFeitoDetail")}
          linkLabel={t("auth.verificarIrPerfil")}
          onLinkClick={irParaPerfil}
        />
      ) : erro ? (
        <ErrorBanner message={erro} onDismiss={() => setErro("")} />
      ) : (
        <div className="text-sm text-text-secondary">{t("common.loading")}</div>
      )}

      {erro && (
        <div className="mt-5">
          <Button onClick={() => navigate("/perfil")} className="w-full">
            {t("auth.verificarIrPerfil")}
            <ArrowRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
    </PublicPageShell>
  )
}