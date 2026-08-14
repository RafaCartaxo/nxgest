import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Check, Save, User, Mail, Undo2, BadgeCheck, Info } from "lucide-react"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { Button } from "../../../shared/components/Button.js"
import { Field } from "../../../shared/components/Field/Field.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { AvatarField } from "../../../shared/components/Avatar/Avatar.js"
import { roleLabel, roleVariant } from "../../../shared/utils/role.js"
import { alterarSenha, alterarFoto, atualizarPerfil, trocarEmail, cancelarTrocaEmail } from "../services/auth.service.js"
import { ApiError } from "../../../api/client.js"

interface PerfilErros {
  novoEmail?: string
  senhaTroca?: string
}

export function PerfilPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { user, refreshUser } = useAuth()

  const [nome, setNome] = useState(user?.nome ?? "")
  const [telefone, setTelefone] = useState(user?.telefone ?? "")
  const [savingDados, setSavingDados] = useState(false)

  const [foto, setFoto] = useState<string | null>(user?.foto ?? null)
  const [enviandoFoto, setEnviandoFoto] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState("")
  const [novaSenha, setNovaSenha] = useState("")
  const [confirmarSenha, setConfirmarSenha] = useState("")
  const [erros, setErros] = useState<{ senhaAtual?: string; novaSenha?: string; confirmarSenha?: string }>({})

  const [trocarModalOpen, setTrocarModalOpen] = useState(false)
  const [novoEmail, setNovoEmail] = useState("")
  const [senhaTroca, setSenhaTroca] = useState("")
  const [trocarErros, setTrocarErros] = useState<PerfilErros>({})
  const [savingTroca, setSavingTroca] = useState(false)

  const [cancelarModalOpen, setCancelarModalOpen] = useState(false)
  const [senhaCancelar, setSenhaCancelar] = useState("")
  const [savingCancelar, setSavingCancelar] = useState(false)

  async function handleFoto(novaFoto: string | null) {
    setEnviandoFoto(true)
    try {
      await alterarFoto(novaFoto)
      setFoto(novaFoto)
      await refreshUser()
      feedback.show({ status: "success", message: novaFoto ? t("avatar.fotoSalva") : t("avatar.fotoRemovida") })
    } catch {
      feedback.show({ status: "error", message: t("avatar.falha") })
    } finally {
      setEnviandoFoto(false)
    }
  }

  async function handleSalvarDados(e: React.FormEvent) {
    e.preventDefault()
    if (!nome.trim()) {
      feedback.show({ status: "error", message: t("perfil.erroSalvarDados") })
      return
    }
    setSavingDados(true)
    try {
      await atualizarPerfil({ nome: nome.trim(), telefone: telefone.trim() === "" ? null : telefone.trim() })
      await refreshUser()
      feedback.show({ status: "success", message: t("perfil.dadosSalvos") })
    } catch {
      feedback.show({ status: "error", message: t("perfil.erroSalvarDados") })
    } finally {
      setSavingDados(false)
    }
  }

  async function handleTrocarEmail(e: React.FormEvent) {
    e.preventDefault()
    const errs: PerfilErros = {}
    if (!novoEmail.trim()) errs.novoEmail = t("perfil.novoEmailObrigatorio")
    else if (!novoEmail.includes("@")) errs.novoEmail = t("perfil.emailInvalido")
    if (!senhaTroca) errs.senhaTroca = t("perfil.erroTrocarRequerSenha")
    setTrocarErros(errs)
    if (Object.keys(errs).length > 0) return
    setSavingTroca(true)
    try {
      await trocarEmail(novoEmail.trim(), senhaTroca)
      await refreshUser()
      setTrocarModalOpen(false)
      setNovoEmail("")
      setSenhaTroca("")
      feedback.show({ status: "success", message: t("perfil.trocarEmailEnviado") })
    } catch (err) {
      // ApiError traz a mensagem traduzida (ex.: EMAIL_DUPLICATED, VALIDATION_ERROR).
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("perfil.erroTrocarEmail") })
    } finally {
      setSavingTroca(false)
    }
  }

  async function handleCancelarTroca(e: React.FormEvent) {
    e.preventDefault()
    if (!senhaCancelar) {
      feedback.show({ status: "error", message: t("perfil.erroTrocarRequerSenha") })
      return
    }
    setSavingCancelar(true)
    try {
      await cancelarTrocaEmail(senhaCancelar)
      await refreshUser()
      setCancelarModalOpen(false)
      setSenhaCancelar("")
      feedback.show({ status: "success", message: t("perfil.trocaCancelada") })
    } catch (err) {
      // ApiError traz a mensagem traduzida (ex.: INVALID_CURRENT_PASSWORD).
      feedback.show({ status: "error", message: err instanceof ApiError ? err.message : t("perfil.erroCancelarTroca") })
    } finally {
      setSavingCancelar(false)
    }
  }

  async function handleSenha(e: React.FormEvent) {
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

  const statusBadge =
    user?.status === "suspenso"
      ? { variant: "danger" as const, label: t("perfil.statusSuspenso") }
      : user?.status === "convidado"
        ? { variant: "warning" as const, label: t("perfil.statusConvidado") }
        : { variant: "success" as const, label: t("perfil.statusAtivo") }

  return (
    <div className="mx-auto max-w-5xl p-4 space-y-6">
      <PageHeader
        icon={User}
        title={t("perfil.title")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
      />

      {/* Banner de pendência de e-mail */}
      {user?.emailPendente && (
        <div className="relative flex flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center md:justify-between">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-warning" />
          <div className="flex items-start gap-2 pl-2 md:items-center">
            <Info className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
            <div>
              <p className="text-sm font-medium text-text-primary">{t("perfil.emailPendenteAviso")}</p>
              <p className="text-sm text-text-secondary">{t("perfil.emailPendenteDetail", { email: user.emailPendente })}</p>
            </div>
          </div>
          <Button type="button" variant="soft" size="sm" className="self-start md:self-center" onClick={() => setCancelarModalOpen(true)}>
            <Undo2 className="size-4" aria-hidden /> {t("perfil.cancelarTroca")}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Coluna principal: Dados pessoais + Conta */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Dados pessoais */}
          <Card.Root tone="success" className="p-4">
            <h2 className="mb-4 pl-2 font-display text-[20px] font-semibold text-text-primary">{t("perfil.secaoDadosPessoais")}</h2>
            <form onSubmit={handleSalvarDados} className="space-y-4">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex shrink-0 flex-col items-center gap-3 md:pt-1">
                  <AvatarField
                    nome={nome}
                    foto={foto}
                    onChange={(f) => void handleFoto(f)}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <Field
                    label={t("perfil.nome")}
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                  <Field
                    label={t("perfil.telefone")}
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder={t("perfil.telefoneOpcional")}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button type="submit" disabled={savingDados}>
                  <Save className="size-4" /> {savingDados ? t("common.saving") : t("perfil.salvarDados")}
                </Button>
              </div>
            </form>
          </Card.Root>

          {/* Conta */}
          <Card.Root tone="info" className="p-4">
            <h2 className="mb-4 pl-2 font-display text-[20px] font-semibold text-text-primary">{t("perfil.secaoConta")}</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-xs font-medium text-text-secondary">{t("perfil.email")}</p>
                <div className="mt-1 flex min-w-0 items-center gap-2">
                  <span className="truncate font-medium text-text-primary">{user?.email}</span>
                  {user?.emailVerificado && !user?.emailPendente ? (
                    <BadgeCheck className="size-4 shrink-0 text-success" aria-hidden />
                  ) : user?.emailPendente ? (
                    <StatusBadge variant="warning" size="sm" label={t("perfil.emailPendenteAviso")} />
                  ) : null}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface-secondary p-3">
                <p className="text-xs font-medium text-text-secondary">{t("perfil.empresa")}</p>
                <p className="mt-1 truncate font-medium text-text-primary">{user?.empresaNome ?? t("perfil.semEmpresa")}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge variant={statusBadge.variant} size="sm" label={statusBadge.label} />
              <StatusBadge variant={roleVariant(user?.role)} size="sm" label={roleLabel(user?.role, t)} />
            </div>
            <div className="mt-4 flex gap-2 border-t border-border-light pt-3">
              <Button type="button" variant="outline" className="w-full" onClick={() => setTrocarModalOpen(true)}>
                <Mail className="size-4" /> {t("perfil.trocarEmail")}
              </Button>
            </div>
          </Card.Root>
        </div>

        {/* Coluna lateral: Segurança */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          <Card.Root tone="neutral" className="p-4">
            <h2 className="mb-4 pl-2 font-display text-[20px] font-semibold text-text-primary">{t("perfil.secaoSeguranca")}</h2>
            <form onSubmit={handleSenha} className="space-y-4">
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
                <Button type="submit"><Check className="size-4" /> {t("perfil.trocarSenha")}</Button>
              </div>
            </form>
          </Card.Root>
        </div>
      </div>

      <Modal
        open={trocarModalOpen}
        onClose={() => setTrocarModalOpen(false)}
        title={t("perfil.trocarEmailTitle")}
        descricao={t("perfil.trocarEmailSubtitle")}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleTrocarEmail} className="mt-4 space-y-4">
          <Field
            label={t("perfil.novoEmail")}
            type="email"
            value={novoEmail}
            onChange={(e) => setNovoEmail(e.target.value)}
            error={trocarErros.novoEmail}
          />
          <Field
            label={t("perfil.senhaAtual")}
            type="password"
            value={senhaTroca}
            onChange={(e) => setSenhaTroca(e.target.value)}
            autoComplete="current-password"
            error={trocarErros.senhaTroca}
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setTrocarModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={savingTroca}>
              {savingTroca ? t("common.saving") : t("perfil.trocarEmail")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={cancelarModalOpen}
        onClose={() => setCancelarModalOpen(false)}
        title={t("perfil.cancelarTrocaConfirmacao")}
        descricao={t("perfil.cancelarTrocaConfirmacaoMessage")}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCancelarTroca} className="mt-4 space-y-4">
          <Field
            label={t("perfil.senhaAtual")}
            type="password"
            value={senhaCancelar}
            onChange={(e) => setSenhaCancelar(e.target.value)}
            autoComplete="current-password"
          />
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={() => setCancelarModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="danger" disabled={savingCancelar}>
              {savingCancelar ? t("common.saving") : t("perfil.cancelarTroca")}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}