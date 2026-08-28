import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowRight, Eye, EyeOff } from "lucide-react"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { PublicPageShell } from "../components/PublicPageShell.js"
import { ativarConta } from "../services/auth.service.js"
import { ApiError } from "../../../api/client.js"

export function AtivarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  // PLAN-087: código da API → mensagem i18n específica (ativa as chaves órfãs).
  function mensagemAtivacao(code: string, fallback: string): string {
    const mapa: Record<string, string> = {
      TOKEN_EXPIRED: t("auth.conviteExpiradoDetail"),
      TOKEN_INVALID: t("auth.conviteInvalidoDetail"),
      CONVITE_REVOGADO: t("auth.conviteRevogadoDetail"),
      CONVITE_JA_USADO: t("auth.conviteJaUsadoDetail"),
      CONVITE_SUBSTITUIDO: t("auth.conviteSubstituidoDetail"),
      CONVITE_EMAIL_NAO_CONFERE: t("auth.conviteEmailNaoConfereDetail"),
    }
    return mapa[code] ?? fallback
  }

  const [senha, setSenha] = useState("")
  const [confirmar, setConfirmar] = useState("")
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [feito, setFeito] = useState(false)

  function validar(): string {
    if (senha.length < 6) return t("auth.senhaCurta")
    if (senha !== confirmar) return t("auth.senhasDiferem")
    return ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const v = validar()
    setErro(v)
    if (v) return
    setLoading(true)
    try {
      await ativarConta(token, senha)
      setFeito(true)
    } catch (err) {
      if (err instanceof ApiError) {
        // PLAN-087: cada código de falha do convite tem mensagem própria (fim da
        // mensagem genérica "Token inválido ou já utilizado" — incidente real).
        setErro(mensagemAtivacao(err.code, err.message))
      } else {
        setErro(t("auth.erroAtivar"))
      }
    } finally {
      setLoading(false)
    }
  }

  const tokenInvalido = !token

  // PLAN-087: ação de saída (dívida AC-07) — erro nunca deixa o usuário preso na tela.
  function renderErroComSaida(mensagem: string, aoDescartar?: () => void) {
    return (
      <div className="space-y-2">
        <ErrorBanner message={mensagem} onDismiss={aoDescartar} />
        <Button variant="ghost" onClick={() => navigate("/login")} className="w-full">
          {t("auth.irLogin")}
        </Button>
      </div>
    )
  }

  return (
    <PublicPageShell>
      <h2 className="font-display text-[22px] font-semibold">{t("auth.ativarTitle")}</h2>
      <p className="mt-1 mb-5 text-sm text-text-secondary">{t("auth.ativarSubtitle")}</p>

      {tokenInvalido ? (
        renderErroComSaida(t("auth.linkInvalido"))
      ) : feito ? (
        <SuccessState
          title={t("auth.ativarFeito")}
          detail={t("auth.ativarFeitoDetail")}
          linkLabel={t("auth.irLogin")}
          onLinkClick={() => navigate("/login")}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label={t("auth.novaSenha")}
            type={mostrarSenha ? "text" : "password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            autoComplete="new-password"
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

          <Field
            label={t("auth.confirmarSenha")}
            type={mostrarSenha ? "text" : "password"}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
            autoComplete="new-password"
          />

          {erro && renderErroComSaida(erro, () => setErro(""))}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden /> : null}
            {loading ? t("common.loading") : t("auth.ativarConta")}
            {!loading && <ArrowRight className="size-4" aria-hidden />}
          </Button>
        </form>
      )}
    </PublicPageShell>
  )
}
