import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { User, Wallet, ArrowRight, Mail, XCircle, Ban, RefreshCw } from "lucide-react"
import { getOperador, reenviarConvite, revogarConvite, setSuspensao, type OperadorRow } from "../services/admin.service.js"
import { getCaixaStatus, ajustarCaixaBase, listarAuditoriaCaixa, type CaixaStatus, type AuditoriaCaixaItem } from "../../caixa/services/caixa.service.js"
import { AjustarCaixaModal } from "../../caixa/components/AjustarCaixaModal.js"
import { listContratos, type Contrato } from "../../contrato/services/contrato.service.js"
import { listClientes, type Cliente } from "../../cliente/services/cliente.service.js"
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
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
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
      const [cx, aud, ctr, cli] = await Promise.all([
        getCaixaStatus(undefined, undefined, id),
        listarAuditoriaCaixa({ limit: 20 }, id),
        listContratos({ limit: 50 }, id),
        listClientes({ limit: 50, usuarioId: id }),
      ])
      setCaixa(cx)
      setErroCaixa(null)
      setAuditoria(aud.data)
      setContratos(ctr.data)
      setClientes(cli.data)
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
            <div className="mb-4 rounded-xl border border-border bg-card p-4">
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
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isSuspenso && <StatusBadge variant="danger" size="sm" label={t("admin.statusSuspenso")} />}
                {operador.emailPendente && <StatusBadge variant="warning" size="sm" label={t("admin.verificacaoPendente")} />}
                {badgeConvite && <StatusBadge variant={badgeConvite.variant} size="sm" label={badgeConvite.label} />}
              </div>
            </div>

            <SectionHeader title={t("admin.dadosOperador")} />
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KpiCard title={t("admin.totalClientes")} value={operador.totalClientes.toString()} variant="green" />
              <KpiCard title={t("admin.contratosAtivos")} value={operador.contratosAtivos.toString()} variant="yellow" />
            </div>

            {/* R3: área de conta independe do bloco de caixa — acessível mesmo se o caixa falhar. */}
            {!isSelf && (
              <>
                <SectionHeader title={t("admin.conta")} />
                <div className="mb-6 flex flex-wrap gap-2">
                  {isConvidado && (
                    <Button type="button" variant="soft" size="sm" onClick={onReenviarConvite}>
                      <Mail className="size-4" aria-hidden /> {t("admin.reenviarConvite")}
                    </Button>
                  )}
                  {isConvidado && temConviteValido && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setRevogarModalOpen(true)}>
                      <XCircle className="size-4" aria-hidden /> {t("admin.revogarConvite")}
                    </Button>
                  )}
                  {isSuspenso ? (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setSuspenderAcao("reativar")}>
                      <RefreshCw className="size-4" aria-hidden /> {t("admin.reativar")}
                    </Button>
                  ) : (
                    !isConvidado && (
                      <Button type="button" variant="danger" size="sm" onClick={() => setSuspenderAcao("suspender")}>
                        <Ban className="size-4" aria-hidden /> {t("admin.suspender")}
                      </Button>
                    )
                  )}
                </div>
              </>
            )}

            {caixa && (
              <>
                <SectionHeader title={t("admin.caixaOperador")} />
                <CaixaKpis caixa={caixa} />

                <SectionHeader title={t("admin.clientesOperador")} />
                <Card.Root variant="list-item">
                  <Card.Body>
                    <Card.Title className="mb-0.5">{t("admin.clientesOperador")}</Card.Title>
                    <Card.Indicators>
                      <Card.Indicator label={t("cliente.title")} value={`${clientes.length}`} />
                    </Card.Indicators>
                  </Card.Body>
                  <Card.Actions
                    actions={[
                      {
                        icon: ArrowRight,
                        label: t("admin.acessar"),
                        onClick: () => navigate(`/clientes?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`),
                      },
                    ]}
                  />
                </Card.Root>

                <SectionHeader title={t("admin.contratosOperador")} />
                <Card.Root variant="list-item">
                  <Card.Body>
                    <Card.Title className="mb-0.5">{t("admin.contratosOperador")}</Card.Title>
                    <Card.Indicators>
                      <Card.Indicator label={t("contrato.title")} value={`${contratos.length}`} />
                    </Card.Indicators>
                  </Card.Body>
                  <Card.Actions
                    actions={[
                      {
                        icon: ArrowRight,
                        label: t("admin.acessar"),
                        onClick: () => navigate(`/contratos?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`),
                      },
                    ]}
                  />
                </Card.Root>

                <div className="mt-6">
                  <SectionHeader title={t("admin.ajusteCaixaSecao")} />
                  <Button type="button" variant="primary" className="w-full" onClick={() => setAjustarModalOpen(true)}>
                    <Wallet className="size-4" aria-hidden />
                    {t("admin.ajustarCaixaOperador")}
                  </Button>
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

      <ConfirmModal
        open={suspenderAcao !== null}
        title={suspenderAcao === "suspender" ? t("admin.suspenderConfirmacao") : t("admin.reativarConfirmacao")}
        message={suspenderAcao === "suspender" ? t("admin.suspenderConfirmacaoMessage") : t("admin.reativarConfirmacaoMessage")}
        confirmLabel={suspenderAcao === "suspender" ? t("admin.suspender") : t("admin.reativar")}
        danger={suspenderAcao === "suspender"}
        onConfirm={() => onSuspensao(suspenderAcao === "suspender")}
        onCancel={() => setSuspenderAcao(null)}
      />
    </div>
  )
}
