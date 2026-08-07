import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { ArrowRight, ArrowLeft, ShieldCheck } from "lucide-react"
import { z } from "zod"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { ErrorBanner } from "../../../shared/components/ErrorBanner/ErrorBanner.js"
import { SuccessState } from "../../../shared/components/SuccessState/SuccessState.js"
import { Logo } from "../../../shared/components/Logo.js"
import { criarLead, reenviarConfirmacao } from "../services/leads.service.js"
import { ApiError } from "../../../api/client.js"

const schema = z.object({
  nomeResponsavel: z.string().min(2, "lead.validacaoNome"),
  empresa: z.string().min(2, "lead.validacaoEmpresa"),
  email: z.string().email("lead.validacaoEmail"),
  telefone: z.string().optional(),
})

type Erros = Partial<Record<"nomeResponsavel" | "empresa" | "email" | "telefone", string>>

export function QueroConhecerPage() {
  const { t } = useTranslation()
  const [nomeResponsavel, setNomeResponsavel] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [email, setEmail] = useState("")
  const [telefone, setTelefone] = useState("")
  const [erros, setErros] = useState<Erros>({})
  const [erro, setErro] = useState("")
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [jaExistia, setJaExistia] = useState(false)
  const [reenviado, setReenviado] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro("")
    setErros({})
    const parsed = schema.safeParse({ nomeResponsavel, empresa, email, telefone })
    if (!parsed.success) {
      const e: Erros = {}
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0] as keyof Erros
        if (campo && !e[campo]) e[campo] = t(issue.message)
      }
      setErros(e)
      return
    }
    setLoading(true)
    try {
      const result = await criarLead({
        nomeResponsavel: nomeResponsavel.trim(),
        empresa: empresa.trim(),
        email: email.trim(),
        telefone: telefone.trim() || undefined,
        origem: "Site",
      })
      if (result.jaExistia) {
        setJaExistia(true)
        setEnviado(true)
        return
      }
      setEnviado(true)
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : t("lead.erroEnviar"))
    } finally {
      setLoading(false)
    }
  }

  async function handleReenviar() {
    setReenviado(false)
    try {
      await reenviarConfirmacao(email.trim())
      setReenviado(true)
    } catch {
      setReenviado(false)
    }
  }

  return (
    <div className="relative min-h-[100dvh] bg-gradient-page px-4">
      <div aria-hidden className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-5 py-6">
        <Logo variant="lg" className="mx-auto h-20 w-20 text-primary" />
        <div className="w-full max-w-sm rounded-lg border border-border-light bg-surface p-6 shadow-sm">
          <h2 className="font-display text-[22px] font-semibold">{t("lead.queroConhecerTitle")}</h2>
          <p className="mt-1 mb-5 text-sm text-text-secondary">{t("lead.queroConhecerSubtitle")}</p>

          {enviado ? (
            <div>
              <SuccessState
                title={jaExistia ? t("lead.jaExistia") : t("lead.enviado")}
                detail={t("lead.enviadoDetail")}
              />
              {!jaExistia && (
                <div className="mt-3 text-center">
                  <button type="button" onClick={handleReenviar} className="text-sm font-medium text-primary hover:underline">
                    {t("lead.naoRecebeu")}
                  </button>
                  {reenviado && <p className="mt-1 text-xs text-success-text">{t("lead.reenviado")}</p>}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field
                label={t("lead.nomeResponsavel")}
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                required
                error={erros.nomeResponsavel}
                autoComplete="name"
              />
              <Field
                label={t("lead.empresa")}
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
                required
                error={erros.empresa}
                autoComplete="organization"
              />
              <Field
                label={t("lead.email")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                error={erros.email}
                autoComplete="email"
              />
              <Field
                label={t("lead.telefone")}
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                error={erros.telefone}
                autoComplete="tel"
              />

              {erro && <ErrorBanner message={erro} onDismiss={() => setErro("")} />}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? t("common.loading") : t("lead.enviarInteresse")}
                {!loading && <ArrowRight className="size-4" aria-hidden />}
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-xs text-text-muted">
                <ShieldCheck className="size-3.5 text-success" aria-hidden />
                {t("lead.privacidade")}
              </div>
            </form>
          )}

          <Link
            to="/login"
            className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            {t("auth.voltarLogin")}
          </Link>
        </div>
      </div>
    </div>
  )
}
