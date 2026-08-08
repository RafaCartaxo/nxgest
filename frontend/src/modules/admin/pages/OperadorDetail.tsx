import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom"
import { User } from "lucide-react"
import { getOperador, type OperadorRow } from "../services/admin.service.js"
import { getCaixaStatus, ajustarCaixaBase, listarAuditoriaCaixa, type CaixaStatus, type AuditoriaCaixaItem } from "../../caixa/services/caixa.service.js"
import { AjusteCaixaCard } from "../components/AjusteCaixaCard.js"
import { listContratos, type Contrato } from "../../contrato/services/contrato.service.js"
import { ContratoCard } from "../../contrato/components/ContratoCard.js"
import { listClientes, type Cliente } from "../../cliente/services/cliente.service.js"
import { ClienteCard } from "../../cliente/components/ClienteCard.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Avatar } from "../../../shared/components/Avatar/Avatar.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { Button } from "../../../shared/components/Button.js"
import { getLocalDateString } from "../../../shared/utils/parseDateLocal.js"
import { roleLabel, roleVariant } from "../../../shared/utils/role.js"
import { useFeedback } from "../../../shared/feedback/useFeedback.js"

export function OperadorDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const feedback = useFeedback()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const empresaId = searchParams.get("empresaId") || undefined

  const [operador, setOperador] = useState<OperadorRow | null>(null)
  const [caixa, setCaixa] = useState<CaixaStatus | null>(null)
  const [auditoria, setAuditoria] = useState<AuditoriaCaixaItem[]>([])
  const [contratos, setContratos] = useState<Contrato[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [op, cx, aud, ctr, cli] = await Promise.all([
        getOperador(id, empresaId),
        getCaixaStatus(undefined, undefined, id),
        listarAuditoriaCaixa({ limit: 20 }, id),
        listContratos({ limit: 50 }, id),
        listClientes({ limit: 50, usuarioId: id }),
      ])
      setOperador(op)
      setCaixa(cx)
      setAuditoria(aud.data)
      setContratos(ctr.data)
      setClientes(cli.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
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
        {operador && caixa && (
          <>
            <div className="mb-4 rounded-xl bg-surface-secondary px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">{t("admin.email")}:</span>
                <span className="font-medium text-text-primary">{operador.email}</span>
              </div>
            </div>

            <SectionHeader title={t("admin.operadorData")} />
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KpiCard title={t("admin.totalClientes")} value={operador.totalClientes.toString()} variant="green" />
              <KpiCard title={t("admin.contratosAtivos")} value={operador.contratosAtivos.toString()} variant="yellow" />
            </div>

            <SectionHeader title={t("admin.caixaOperador")} />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <KpiCard title={t("caixa.caixaBase")} value={`R$ ${caixa.caixaBase.toFixed(2)}`} variant="blue" />
              <KpiCard title={t("caixa.saldoAtual")} value={`R$ ${caixa.saldoAtual.toFixed(2)}`} variant="gray" />
              <KpiCard
                title={t("caixa.lucro")}
                value={`R$ ${caixa.lucro.toFixed(2)}`}
                variant={caixa.lucro >= 0 ? "green" : "gray"}
                valueClassName={caixa.lucro >= 0 ? "text-success-text" : "text-danger-text"}
              />
              <KpiCard title={t("caixa.aReceberHoje")} value={`R$ ${caixa.aReceberHoje.toFixed(2)}`} variant="blue" />
              <KpiCard title={t("caixa.recebidoSemana")} value={`R$ ${caixa.recebidoSemana.toFixed(2)}`} variant="green" />
              <KpiCard title={t("caixa.cobradoHoje")} value={`R$ ${caixa.recebidoHoje.toFixed(2)}`} variant="green" />
            </div>

            <AjusteCaixaCard caixaBase={caixa.caixaBase} saldoAtual={caixa.saldoAtual} onAjustar={onAjustarCaixa} />

            <SectionHeader title={t("caixa.historicoAjustes")} />
            {auditoria.length === 0 ? (
              <p className="text-text-secondary">{t("caixa.ajusteSemRegistros")}</p>
            ) : (
              <div className="mt-2 space-y-1">
                {auditoria.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-text-primary">
                        R$ {a.valorAnterior.toFixed(2)} → R$ {a.valorNovo.toFixed(2)}
                      </span>
                      <span className="text-xs text-text-secondary">
                        {a.adminNome ? `${t("caixa.ajustePor")} ${a.adminNome}` : ""}
                      </span>
                      <span className="text-xs text-text-muted">{a.motivo}</span>
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <SectionHeader title={t("admin.contratosOperador")} />
            {contratos.length === 0 ? (
              <p className="text-text-secondary">{t("admin.semContratosOperador")}</p>
            ) : (
              <div className="mt-2 space-y-3">
                {contratos.map((c) => (
                  <Link
                    key={c.id}
                    to={`/contratos/${c.id}?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`}
                    className="block"
                  >
                    <ContratoCard variant="list-item" contrato={c} />
                  </Link>
                ))}
              </div>
            )}

            <SectionHeader title={t("admin.clientesOperador")} />
            {clientes.length === 0 ? (
              <p className="text-text-secondary">{t("admin.semClientesOperador")}</p>
            ) : (
              <div className="mt-2 space-y-3">
                {clientes.map((c) => (
                  <Link
                    key={c.id}
                    to={`/clientes/${c.id}?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`}
                    className="block"
                  >
                    <ClienteCard variant="list-item" cliente={c} />
                  </Link>
                ))}
              </div>
            )}
            </>
          )}
      </EstadoTela>
    </div>
  )
}
