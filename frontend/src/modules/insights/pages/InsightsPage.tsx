import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LineChart } from "lucide-react"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { SegmentedControl } from "../../../shared/components/SegmentedControl/SegmentedControl.js"
import { ChartCard } from "../../../shared/components/ChartCard/ChartCard.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { useResumoInsights } from "../hooks/useInsights.js"
import { TendenciaChart } from "../components/TendenciaChart.js"
import { PrevistoRecebidoChart } from "../components/PrevistoRecebidoChart.js"
import type { PeriodoInsight, SerieItem } from "../services/insights.service.js"

function todosZero(serie: SerieItem[], key: "recebido" | "ambos"): boolean {
  return serie.every((s) => (key === "ambos" ? s.recebido === 0 && s.previsto === 0 : s[key] === 0))
}

/**
 * Página de insights (PLAN-080 F1) — módulo read-only, alcançável por URL.
 * Estados por `EstadoTela` (loading/erro/empty) — F1-f1/f2/f6.
 */
export function InsightsPage() {
  const { t } = useTranslation()
  const [periodo, setPeriodo] = useState<PeriodoInsight>("semana")

  const resumo = useResumoInsights(periodo)
  const serie = resumo.data?.serie ?? []
  const isEmpty = !!resumo.data && todosZero(serie, "ambos")

  const periodos: { value: PeriodoInsight; label: string }[] = [
    { value: "dia", label: t("insights.periodo.dia") },
    { value: "semana", label: t("insights.periodo.semana") },
    { value: "mes", label: t("insights.periodo.mes") },
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4">
      <PageHeader
        icon={LineChart}
        title={t("insights.title")}
        subtitle={t("insights.subtitle")}
        action={
          <SegmentedControl
            value={periodo}
            onChange={setPeriodo}
            items={periodos}
            label={t("insights.periodo.label")}
            className="sm:w-auto"
          />
        }
      />

      <EstadoTela
        loading={resumo.isLoading}
        error={resumo.isError ? t("insights.erroCarregar") : null}
        empty={isEmpty}
        emptyMessage={t("insights.semDados")}
        onRetry={() => resumo.refetch()}
      >
        {resumo.data && !isEmpty && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ChartCard title={t("insights.tendencia")}>
              {todosZero(serie, "recebido") ? (
                <EstadoTela loading={false} error={null} empty emptyMessage={t("insights.semDadosPeriodo")} children={null} />
              ) : (
                <TendenciaChart serie={serie} ariaLabel={t("insights.tendenciaAria")} />
              )}
            </ChartCard>
            <ChartCard title={t("insights.previstoRecebido")}>
              {todosZero(serie, "ambos") ? (
                <EstadoTela loading={false} error={null} empty emptyMessage={t("insights.semDadosPeriodo")} children={null} />
              ) : (
                <PrevistoRecebidoChart serie={serie} ariaLabel={t("insights.previstoRecebidoAria")} />
              )}
            </ChartCard>
          </div>
        )}
      </EstadoTela>
    </div>
  )
}