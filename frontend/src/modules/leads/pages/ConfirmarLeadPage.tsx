import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { confirmarLead, reenviarConfirmacao } from "../services/leads.service.js"
import { ApiError } from "../../../api/client.js"
import { PublicPageShell } from "../../auth/components/PublicPageShell.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { Button } from "../../../shared/components/Button.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"

type Estado =
  | { fase: "loading" }
  | { fase: "sucesso" }
  | { fase: "erro"; mensagem: string }
  | { fase: "tokenAusente" }

export function ConfirmarLeadPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") ?? ""

  const [estado, setEstado] = useState<Estado>({ fase: "loading" })
  const [email, setEmail] = useState("")
  const [reenviando, setReenviando] = useState(false)
  const [reenviado, setReenviado] = useState(false)
  const [erroReenviar, setErroReenviar] = useState("")

  useEffect(() => {
    if (!token) {
      setEstado({ fase: "tokenAusente" })
      return
    }
    confirmarLead(token)
      .then(() => setEstado({ fase: "sucesso" }))
      .catch((err: unknown) => setEstado({ fase: "erro", mensagem: err instanceof ApiError ? err.message : t("lead.erroConfirmar") }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleReenviar(e: React.FormEvent) {
    e.preventDefault()
    setErroReenviar("")
    setReenviado(false)
    if (!email.includes("@")) {
      setErroReenviar(t("lead.validacaoEmail"))
      return
    }
    setReenviando(true)
    try {
      await reenviarConfirmacao(email.trim())
      setReenviado(true)
    } catch (err) {
      setErroReenviar(err instanceof ApiError ? err.message : t("lead.erroReenviar"))
    } finally {
      setReenviando(false)
    }
  }

  return (
    <PublicPageShell>
      <h2 className="font-display text-[22px] font-semibold">{t("lead.confirmarTitle")}</h2>
      <p className="mt-1 mb-5 text-sm text-text-secondary">{t("lead.confirmarSubtitle")}</p>

      {estado.fase === "loading" && <p className="py-6 text-center text-sm text-text-secondary">{t("common.loading")}</p>}

      {estado.fase === "tokenAusente" && <ErrorBanner message={t("lead.linkInvalido")} />}

      {estado.fase === "sucesso" && (
        <SuccessState title={t("lead.confirmado")} detail={t("lead.confirmadoDetail")} />
      )}

      {estado.fase === "erro" && (
        <div className="space-y-4">
          <ErrorBanner message={estado.mensagem} />
          <p className="text-sm text-text-secondary">{t("lead.reenviarHint")}</p>
          <form onSubmit={handleReenviar} className="space-y-3">
            <Field
              label={t("lead.email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              error={erroReenviar}
            />
            <Button type="submit" disabled={reenviando} className="w-full">
              {reenviando ? t("common.loading") : t("lead.reenviar")}
            </Button>
            {reenviado && <p className="text-center text-xs text-success-text">{t("lead.reenviado")}</p>}
          </form>
        </div>
      )}
    </PublicPageShell>
  )
}
