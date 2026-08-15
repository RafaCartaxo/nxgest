import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { User, Wallet, Ban, RefreshCw, Edit3 } from "lucide-react"
import { getOperador, listOperadores, reenviarConvite, revogarConvite, setSuspensao, type OperadorRow } from "../services/admin.service.js"
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
import { Modal } from "../../../shared/components/Modal/Modal.js"
import { CollapsibleSection } from "../../../shared/components/CollapsibleSection/CollapsibleSection.js"
import { CaixaKpis } from "../../caixa/components/CaixaKpis.js"
import { AjusteRow } from "../../caixa/components/AjusteHistorico.js"
import { roleLabel } from "../../../shared/utils/role.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"
import { OperadorForm, type OperadorFormData, type OperadorFormHandle } from "../components/OperadorForm.js"
import { ReassignModal } from "../components/ReassignModal.js"
import { useEditarOperador } from "../hooks/useEditarOperador.js"

export function OperadorDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { user } = useAuth()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const empresaId = searchParams.get("empresaId") || undefined

  const [operador, setOperador] = useState<OperadorRow | null>(null)
  const [operadores, setOperadores] = useState<OperadorRow[]>([])
  const [caixa, setCaixa] = useState<CaixaStatus | null>(null)
  const [erroCaixa, setErroCaixa] = useState<string | null>(null)
  const [auditoria, setAuditoria] = useState<AuditoriaCaixaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ajustarModalOpen, setAjustarModalOpen] = useState(false)
  const [editarOpen, setEditarOpen] = useState(false)
  const [suspenderAcao, setSuspenderAcao] = useState<"suspender" | "reativar" | null>(null)
  const operadorFormRef = useRef<OperadorFormHandle>(null)

  const { saving: savingEdit, reassignState, handleUpdate, handleReassignConfirm, closeReassign } = useEditarOperador({ empresaId, onSaved: () => { setEditarOpen(false); void fetch() } })

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
    // Chefes (admins) carregados de forma independente para o ReassignModal.
    try {
      const [cx, aud, ops] = await Promise.all([
        getCaixaStatus(undefined, undefined, id),
        listarAuditoriaCaixa({ limit: 20 }, id),
        listOperadores(empresaId),
      ])
      setCaixa(cx)
      setErroCaixa(null)
      setAuditoria(aud.data)
      setOperadores(ops)
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

  async function onEditarSubmit(data: OperadorFormData) {
    if (!operador) return
    await handleUpdate(operador, data)
  }

  async function onReassignConfirm(novoChefeId: string) {
    await handleReassignConfirm(novoChefeId)
  }

  const isSelf = user?.id === operador?.id
  const isSuspenso = Boolean(operador?.suspensoEm)
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
            {!isSelf && (
              <Button type="button" variant="outline" size="sm" onClick={() => setEditarOpen(true)}>
                <Edit3 className="size-4" aria-hidden /> {t("admin.editar")}
              </Button>
            )}
          </div>
        ) : undefined}
      />

      <EstadoTela loading={loading} error={error} onRetry={fetch} empty={!loading && !operador} emptyMessage={t("admin.erroCarregar")}>
        {operador && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Contato & Status */}
              <Card.Root tone={isSuspenso ? "danger" : operador.status === "convidado" ? "warning" : "success"} className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-text-primary">{t("admin.dadosRole", { role: roleLabel(operador.role, t) })}</p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 whitespace-nowrap text-text-secondary">{t("admin.email")}:</span>
                    <span className="min-w-0 truncate font-medium text-text-primary">{operador.email}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="shrink-0 whitespace-nowrap text-text-secondary">{t("admin.telefone")}:</span>
                    <span className="min-w-0 truncate font-medium text-text-primary">{operador.telefone ?? t("admin.semTelefone")}</span>
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border-light pt-3">
                  {isSuspenso ? (
                    <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />
                  ) : operador.status === "convidado" ? (
                    <StatusBadge variant="warning" size="sm" label={t("perfil.statusConvidado")} />
                  ) : (
                    <StatusBadge variant="success" size="sm" label={t("admin.statusAtivo")} />
                  )}
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

      {operador && !isSelf && (
        <Modal
          open={editarOpen}
          onClose={() => setEditarOpen(false)}
          title={t("admin.editarRole", { role: roleLabel(operador.role, t) })}
          maxWidth="max-w-md"
          footer={
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => setEditarOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="button" disabled={savingEdit} onClick={() => void operadorFormRef.current?.submit()}>
                {t("common.save")}
              </Button>
            </div>
          }
        >
          <OperadorForm
            ref={operadorFormRef}
            editing={operador}
            onSubmit={onEditarSubmit}
            onCancel={() => setEditarOpen(false)}
            onAlterarStatus={() => setSuspenderAcao(operador.suspensoEm ? "reativar" : "suspender")}
            onReenviarConvite={onReenviarConvite}
            onRevogarConvite={onRevogarConvite}
          />
        </Modal>
      )}

      <ReassignModal
        open={reassignState !== null}
        reassign={reassignState}
        chefes={operadores.filter((op) => op.role === "admin")}
        saving={savingEdit}
        onConfirm={onReassignConfirm}
        onClose={closeReassign}
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
            <span className="shrink-0 whitespace-nowrap text-text-secondary">{t("admin.dadosRole", { role: roleLabel(operador?.role, t) })}:</span>
            <span className="min-w-0 truncate font-medium text-text-primary">{operador?.nome}</span>
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
