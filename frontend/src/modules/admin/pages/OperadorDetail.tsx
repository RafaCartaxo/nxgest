import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { ChevronLeft } from "lucide-react"
import { getOperador, type OperadorRow } from "../services/admin.service.js"
import { getCaixaStatus, type CaixaStatus } from "../../caixa/services/caixa.service.js"
import { ApiError } from "../../../api/client.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { SectionHeader } from "../../../shared/components/SectionHeader/SectionHeader.js"
import { KpiCard } from "../../../shared/components/KpiCard/KpiCard.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"

export function OperadorDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const empresaId = searchParams.get("empresaId") || undefined

  const [operador, setOperador] = useState<OperadorRow | null>(null)
  const [caixa, setCaixa] = useState<CaixaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const [op, cx] = await Promise.all([
        getOperador(id, empresaId),
        getCaixaStatus(undefined, undefined, id),
      ])
      setOperador(op)
      setCaixa(cx)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("admin.erroCarregar"))
    } finally {
      setLoading(false)
    }
  }, [id, empresaId, t])

  useEffect(() => { fetch() }, [fetch])

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
          </>
        )}
      </EstadoTela>
    </div>
  )
}
