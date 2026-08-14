import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { User, Wallet, Mail, XCircle, Ban, RefreshCw } from "lucide-react"
import { getOperador, reenviarConvite, revogarConvite, setSuspensao, type OperadorRow } from "../services/admin.service.js"
import { getCaixaStatus, ajustarCaixaBase, listarAuditoriaCaixa, type CaixaStatus, type AuditoriaCaixaItem } from "../../caixa/services/caixa.service.js"
import { AjustarCaixaModal } from "../../caixa/components/AjustarCaixaModal.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Avatar } from "../../../shared/components/Avatar/Avatar.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { Button } from "../../../shared/components/Button.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { ConfirmModal } from "../../../shared/components/ConfirmModal.js"
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { CollapsibleSection } from "../../../shared/components/CollapsibleSection/CollapsibleSection.js"
import { CaixaKpis } from "../../caixa/components/CaixaKpis.js"
import { AjusteRow } from "../../caixa/components/AjusteHistorico.js"
import { roleLabel, roleVariant } from "../../../shared/utils/role.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"

export function OperadorDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const empresaId = searchParams.get("empresaId") || undefined

  const [operador, setOperador] = useState<OperadorRow | null>(null)
  const [caixa, setCaixa] = useState<CaixaStatus | null>(null)
  const [erroCaixa, setErroCaixa] = useState<string | null>(null)
  const [auditoria, setAuditoria] = useState<AuditoriaCaixaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ajustarModalOpen, setAjustarModalOpen] = useState(false)
  const [revogarModalOpen, setRevogarModalOpen] = useState(false)
  const [suspenderAcao, setSuspenderAcao] = useState<"suspender" | "reativar" | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const op = await getOperador(id, empresaId)
      setOperador(op)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
      setLoading(false)
      return
    }

    // R3: o bloco de caixa é independente do operador — uma falha aqui não
    // derruba a página (as ações de conta continuam acessíveis).
    try {
      const [cx, aud] = await Promise.all([
        getCaixaStatus(undefined, undefined, id),
        listarAuditoriaCaixa({ limit: 20 }, id),
      ])
      setCaixa(cx)
      setErroCaixa(null)
      setAuditoria(aud.data)
    } catch (err) {
      setErroCaixa(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [id, empresaId, t])

  useEffect(() => { fetch() }, [fetch])

  async function onAjustarCaixa(valor: number, motivo: string) {
    if (!id) return
    await feedback.run({
      action: async () => {
        await ajustarCaixaBase(valor, motivo, id)
        await fetch()
      },
      loading: t("common.saving"),
      success: t("caixa.ajustarSucesso"),
      error: t("caixa.ajustarErro"),
    })
  }

  async function onReenviarConvite() {
    if (!id) return
    await feedback.run({
      action: async () => {
        await reenviarConvite(id, empresaId)
        await fetch()
      },
      loading: t("common.saving"),
      success: t("admin.reenviarSucesso"),
      error: t("admin.erroCarregar"),
    })
  }

  async function onRevogarConvite() {
    if (!id) return
    await feedback.run({
      action: async () => {
        await revogarConvite(id, empresaId)
        await fetch()
      },
      loading: t("common.saving"),
      success: t("admin.revogarSucesso"),
      error: t("admin.erroRevogar"),
    })
    setRevogarModalOpen(false)
  }

  async function onSuspensao(suspender: boolean) {
    if (!id) return
    await feedback.run({
      action: async () => {
        await setSuspensao(id, suspender, empresaId)
        await fetch()
      },
      loading: t("common.saving"),
      success: suspender ? t("admin.suspenderSucesso") : t("admin.reativarSucesso"),
      error: t("admin.erroSuspender"),
    })
    setSuspenderAcao(null)
  }

  const isSelf = user?.id === operador?.id
  const isSuspenso = Boolean(operador?.suspensoEm)
  const isConvidado = operador?.status === "convidado"
  const temConviteValido = operador?.conviteStatus === "PENDENTE"
  const badgeConvite = operador?.status === "convidado"
    ? operador.conviteStatus === "EXPIRADO" ? { variant: "warning" as const, label: t("admin.conviteExpirado") }
      : operador.conviteStatus === "REVOGADO" ? { variant: "danger" as const, label: t("admin.conviteRevogado") }
      : { variant: "warning" as const, label: t("admin.convitePendente") }
    : null

  return (
    <div className="mx-auto max-w-2xl p-4">
      <PageHeader
        icon={User}
        title={operador?.nome ?? t("admin.operadorDetail")}
        back={{ onClick: () => navigate(-1), title: t("common.back") }}
        action={operador ? (
          <div className="flex items-center gap-2">
            <Avatar nome={operador.nome} foto={operador.foto ?? null} size="sm" ampliar />
            <StatusBadge
              variant={roleVariant(operador.role)}
              size="sm"
              label={roleLabel(operador.role, t)}
            />
          </div>
        ) : undefined}
      />

      <EstadoTela loading={loading} error={error} onRetry={fetch} empty={!loading && !operador} emptyMessage={t("admin.erroCarregar")}>
        {operador && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Contato & Status */}
              <Card.Root tone="neutral" className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-text-primary">{t("admin.operadorData")}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary">{t("admin.email")}:</span>
                    <span className="truncate font-medium text-text-primary">{operador.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-text-secondary">{t("admin.telefone")}:</span>
                    <span className="truncate font-medium text-text-primary">{operador.telefone ?? t("admin.semTelefone")}</span>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-light pt-3">
                  {isSuspenso && <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />}
                  {operador.emailPendente && <StatusBadge variant="warning" size="sm" label={t("admin.verificacaoPendente")} />}
                  {badgeConvite && <StatusBadge variant={badgeConvite.variant} size="sm" label={badgeConvite.label} />}
                </div>
              </Card.Root>

              {/* Desempenho (KpiCard irmãos clicáveis — mesmo padrão do painel admin) */}
              <div className="grid grid-cols-2 gap-4 lg:col-span-2">
                <KpiCard title={t("admin.totalClientes")} value={operador.totalClientes.toString()} variant="green"
                  onClick={() => navigate(`/clientes?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`)} />
                <KpiCard title={t("admin.contratosAtivos")} value={operador.contratosAtivos.toString()} variant="yellow"
                  onClick={() => navigate(`/contratos?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`)} />
              </div>

              {/* Status da conta (isSelf oculta — segurança) */}
              {!isSelf && (
                <Card.Root tone="warning" className="flex flex-col gap-3 lg:col-span-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{t("admin.statusConta")}</p>
                    {isSuspenso ? (
                      <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />
                    ) : isConvidado ? (
                      <StatusBadge variant="warning" size="sm" label={t("perfil.statusConvidado")} />
                    ) : (
                      <StatusBadge variant="success" size="sm" label={t("admin.statusAtivo")} />
                    )}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {isConvidado && (
                      <Button type="button" variant="soft" onClick={onReenviarConvite}>
                        <Mail className="size-4" aria-hidden /> {t("admin.reenviarConvite")}
                      </Button>
                    )}
                    {isConvidado && temConviteValido && (
                      <Button type="button" variant="secondary" onClick={() => setRevogarModalOpen(true)}>
                        <XCircle className="size-4" aria-hidden /> {t("admin.revogarConvite")}
                      </Button>
                    )}
                    {isSuspenso ? (
                      <Button type="button" variant="primary" onClick={() => setSuspenderAcao("reativar")}>
                        <RefreshCw className="size-4" aria-hidden /> {t("admin.reativar")}
                      </Button>
                    ) : (
                      !isConvidado && (
                        <Button type="button" variant="danger" onClick={() => setSuspenderAcao("suspender")}>
                          <Ban className="size-4" aria-hidden /> {t("admin.suspender")}
                        </Button>
                      )
                    )}
                  </div>
                </Card.Root>
              )}
            </div>

            {caixa && (
              <>
                <SectionHeader title={t("admin.caixaOperador")} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <CaixaKpis caixa={caixa} />

                  <div className="flex flex-col gap-4">
                    <div>
                      <Button type="button" variant="primary" className="w-full" onClick={() => setAjustarModalOpen(true)}>
                        <Wallet className="size-4" aria-hidden />
                        {t("admin.ajustarCaixaOperador")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <CollapsibleSection
                    title={t("caixa.historicoAjustes")}
                    count={auditoria.length}
                    items={auditoria}
                    renderItem={(a) => <AjusteRow key={a.id} ajuste={a} />}
                    limit={8}
                    defaultCollapsed
                  />
                </div>
              </>
            )}

            {erroCaixa && !caixa && (
              <div className="mt-4 rounded-xl border border-warning bg-warning-light p-4 text-sm text-warning-text">
                {erroCaixa}
              </div>
            )}
            </>
          )}
      </EstadoTela>

      {caixa && (
        <AjustarCaixaModal
          open={ajustarModalOpen}
          onClose={() => setAjustarModalOpen(false)}
          caixaBase={caixa.caixaBase}
          saldoAtual={caixa.saldoAtual}
          title={t("admin.ajustarTituloOperador")}
          onAjustar={onAjustarCaixa}
        />
      )}

      <ConfirmModal
        open={revogarModalOpen}
        title={t("admin.revogarConfirmacao")}
        message={t("admin.revogarConfirmacaoMessage")}
        confirmLabel={t("admin.revogarConvite")}
        danger
        onConfirm={onRevogarConvite}
        onCancel={() => setRevogarModalOpen(false)}
      />

      <Modal
        open={suspenderAcao !== null}
        onClose={() => setSuspenderAcao(null)}
        title={t("admin.alterarStatus")}
        descricao={suspenderAcao === "suspender" ? t("admin.suspenderConfirmacaoMessage") : t("admin.reativarConfirmacaoMessage")}
        maxWidth="max-w-md"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={() => setSuspenderAcao(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              variant={suspenderAcao === "suspender" ? "danger" : "primary"}
              onClick={() => onSuspensao(suspenderAcao === "suspender")}
            >
              {suspenderAcao === "suspender" ? <Ban className="size-4" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
              {suspenderAcao === "suspender" ? t("admin.suspender") : t("admin.reativar")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-secondary p-3 text-sm">
            <span className="text-text-secondary">{t("admin.operadorData")}: {operador?.nome}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-text-secondary">{t("perfil.status")}</span>
            {isSuspenso ? (
              <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />
            ) : (
              <StatusBadge variant="success" size="sm" label={t("admin.statusAtivo")} />
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}
