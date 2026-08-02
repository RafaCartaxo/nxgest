import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronLeft, ArrowRight } from "lucide-react"
import { getOperador, type OperadorRow } from "../services/admin.service.js"
import { getCaixaStatus, ajustarCaixaBase, listarAuditoriaCaixa, type CaixaStatus, type AuditoriaCaixaItem } from "../../caixa/services/caixa.service.js"
import { listContratos, type Contrato } from "../../contrato/services/contrato.service.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { maskMonetario, unmaskMonetario } from "../../../shared/utils/masks.js"
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ajusteValor, setAjusteValor] = useState("")
  const [ajusteMotivo, setAjusteMotivo] = useState("")

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [op, cx, aud, ctr] = await Promise.all([
        getOperador(id, empresaId),
        getCaixaStatus(undefined, undefined, id),
        listarAuditoriaCaixa({ limit: 20 }, id),
        listContratos({ limit: 50 }, id),
      ])
      setOperador(op)
      setCaixa(cx)
      setAuditoria(aud.data)
      setContratos(ctr.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [id, empresaId, t])

  useEffect(() => { fetch() }, [fetch])

  async function handleAjustar() {
    if (!id) return
    const valor = unmaskMonetario(ajusteValor)
    const motivo = ajusteMotivo.trim()
    if (valor <= 0) {
      feedback.show({ status: "error", message: t("caixa.ajustarValorInvalido") })
      return
    }
    if (!motivo) {
      feedback.show({ status: "error", message: t("caixa.motivoObrigatorio") })
      return
    }
    await feedback.run({
      action: async () => {
        await ajustarCaixaBase(valor, motivo, id)
        setAjusteValor("")
        setAjusteMotivo("")
        await fetch()
      },
      loading: t("common.saving"),
      success: t("caixa.ajustarSucesso"),
      error: t("caixa.ajustarErro"),
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
        <h1 className="flex-1 text-3xl font-semibold">{operador?.nome ?? t("admin.operadorDetail")}</h1>
        {operador && (
          <StatusBadge
            variant={operador.role === "operator" ? "neutral" : "info"}
            size="sm"
            label={operador.role === "super_admin" ? t("admin.roleSuperAdmin") : operador.role === "admin" ? t("admin.roleAdmin") : t("admin.roleOperator")}
          />
        )}
      </div>

      <EstadoTela loading={loading} error={error} onRetry={fetch} empty={!loading && !operador} emptyMessage={t("admin.erroCarregar")}>
        {operador && caixa && (
          <>
            <div className="mb-4 rounded-md bg-surface-secondary px-3 py-2 text-sm">
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

            <SectionHeader title={t("admin.ajustarCaixaOperador")} />
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={ajusteValor}
                onChange={(e) => setAjusteValor(maskMonetario(e.target.value))}
                placeholder="R$ 0,00"
                className="block w-full min-w-0 rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
<button
                  type="button"
                  onClick={handleAjustar}
                  className="flex-shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
                >
                  {t("caixa.ajustarSalvar")}
                </button>
              </div>
              <input
                type="text"
                value={ajusteMotivo}
                onChange={(e) => setAjusteMotivo(e.target.value)}
                placeholder={t("caixa.motivoPlaceholder")}
                className="mt-2 block w-full rounded-md border border-border bg-surface px-3 py-2 text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />

            <SectionHeader title={t("caixa.historicoAjustes")} />
            {auditoria.length === 0 ? (
              <p className="text-text-secondary">{t("caixa.ajusteSemRegistros")}</p>
            ) : (
              <div className="mt-2 space-y-1">
                {auditoria.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-border-light bg-surface px-3 py-2"
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
                  <Card.Root key={c.id} variant="list-item">
                    <Card.Body>
                      <p className="truncate text-sm font-medium text-text-primary">
                        {c.clienteNome ?? c.clienteId}
                      </p>
                      <Card.Indicators>
                        <Card.Indicator
                          label={t("cliente.parcelas")}
                          value={`${c.parcelasPagas ?? 0}/${c.quantidadeParcelas}`}
                        />
                      </Card.Indicators>
                    </Card.Body>
                    <Card.Actions
                      actions={[
                        {
                          icon: ArrowRight,
                          label: t("admin.acessar"),
                          onClick: () => navigate(`/contratos/${c.id}?usuarioId=${id}${empresaId ? `&empresaId=${empresaId}` : ""}`),
                        },
                      ]}
                    />
                  </Card.Root>
                ))}
              </div>
            )}
            </>
          )}
      </EstadoTela>
    </div>
  )
}
