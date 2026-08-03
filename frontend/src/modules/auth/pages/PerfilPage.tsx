import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ChevronLeft } from "lucide-react"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { Button } from "../../../shared/components/Button.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { alterarSenha } from "../services/auth.service.js"

export function PerfilPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { user } = useAuth()

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erros, setErros] = useState<{ senhaAtual?: string; novaSenha?: string; confirmarSenha?: string }>({})

  const roleLabel =
    user?.role === "super_admin"
      ? t("admin.roleSuperAdmin")
      : user?.role === "admin"
        ? t("admin.roleAdmin")
        : t("admin.roleOperator")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof erros = {}
    if (!senhaAtual) errs.senhaAtual = t("perfil.senhaAtualObrigatoria")
    if (novaSenha.length < 6) errs.novaSenha = t("perfil.senhaCurta")
    if (confirmarSenha !== novaSenha) errs.confirmarSenha = t("perfil.senhasDiferem")
    setErros(errs)
    if (Object.keys(errs).length > 0) return

    await feedback.run({
      action: async () => {
        await alterarSenha(senhaAtual, novaSenha)
        setSenhaAtual("")
        setNovaSenha("")
        setConfirmarSenha("")
      },
      loading: t("common.saving"),
      success: t("perfil.senhaAlteradaSucesso"),
      error: t("perfil.erroAlterarSenha"),
    })
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <div className="mb-6 flex items-center gap-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-text-muted hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="flex-1 text-3xl font-semibold">{t("perfil.title")}</h1>
      </div>

      <div className="mb-6 rounded-md border border-border-light bg-surface p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">{user?.nome}</p>
            <p className="truncate text-sm text-text-secondary">{user?.email}</p>
          </div>
          <StatusBadge variant={user?.role === "operator" ? "neutral" : "info"} size="sm" label={roleLabel} />
        </div>
      </div>

      <SectionHeader title={t("perfil.trocarSenha")} />

      <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-md border border-border-light bg-surface p-4">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">{t("perfil.senhaAtual")}</label>
          <input
            type="password"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            autoComplete="current-password"
            className={`w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary ${erros.senhaAtual ? "border-danger" : "border-border"}`}
          />
          {erros.senhaAtual && <p className="text-danger text-xs mt-1">{erros.senhaAtual}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">{t("perfil.novaSenha")}</label>
          <input
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            autoComplete="new-password"
            className={`w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary ${erros.novaSenha ? "border-danger" : "border-border"}`}
          />
          {erros.novaSenha && <p className="text-danger text-xs mt-1">{erros.novaSenha}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-1">{t("perfil.confirmarSenha")}</label>
          <input
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            autoComplete="new-password"
            className={`w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:ring-primary focus:border-primary ${erros.confirmarSenha ? "border-danger" : "border-border"}`}
          />
          {erros.confirmarSenha && <p className="text-danger text-xs mt-1">{erros.confirmarSenha}</p>}
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button type="submit">{t("common.save")}</Button>
        </div>
      </form>
    </div>
  )
}
