import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Check, User } from "lucide-react"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { roleLabel, roleVariant } from "../../../shared/utils/role.js"
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
      <PageHeader
        icon={User}
        title={t("perfil.title")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
      />

      <div className="mb-6 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">{user?.nome}</p>
            <p className="truncate text-sm text-text-secondary">{user?.email}</p>
          </div>
          <StatusBadge variant={roleVariant(user?.role)} size="sm" label={roleLabel(user?.role, t)} />
        </div>
      </div>

      <SectionHeader title={t("perfil.trocarSenha")} />

      <form onSubmit={handleSubmit} className="mt-3 space-y-4 rounded-xl border border-border bg-card p-4">
        <Field
          label={t("perfil.senhaAtual")}
          type="password"
          value={senhaAtual}
          onChange={(e) => setSenhaAtual(e.target.value)}
          autoComplete="current-password"
          error={erros.senhaAtual}
        />

        <Field
          label={t("perfil.novaSenha")}
          type="password"
          value={novaSenha}
          onChange={(e) => setNovaSenha(e.target.value)}
          autoComplete="new-password"
          error={erros.novaSenha}
        />

        <Field
          label={t("perfil.confirmarSenha")}
          type="password"
          value={confirmarSenha}
          onChange={(e) => setConfirmarSenha(e.target.value)}
          autoComplete="new-password"
          error={erros.confirmarSenha}
        />

        <div className="flex gap-2 justify-end pt-2">
          <Button type="submit"><Check className="size-4" /> {t("common.save")}</Button>
        </div>
      </form>
    </div>
  )
}
