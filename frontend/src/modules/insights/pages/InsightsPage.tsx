import { useState } from "react"
import { useTranslation } from "react-i18next"
import { LineChart } from "lucide-react"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { SegmentedControl } from "../../../shared/components/SegmentedControl/SegmentedControl.js"
import { ChartCard } from "../../../shared/components/ChartCard/ChartCard.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { useResumoInsights, useCarteiraInsights } from "../hooks/useInsights.js"
import { TendenciaChart } from "../components/TendenciaChart.js"
import { PrevistoRecebidoChart } from "../components/PrevistoRecebidoChart.js"
import { CarteiraChart } from "../components/CarteiraChart.js"
import { GastosCategoriaChart } from "../components/GastosCategoriaChart.js"
import { ContribuicaoChart } from "../components/ContribuicaoChart.js"
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
  const carteira = useCarteiraInsights()
  const serie = resumo.data?.serie ?? []
  const isEmpty = !!resumo.data && todosZero(serie, "ambos")
  const carteiraEmpty =
    !!carteira.data &&
    carteira.data.carteira.total === 0 &&
    carteira.data.gastosPorCategoria.length === 0 &&
    carteira.data.contribuicaoOperadores.every((o) => o.recebido === 0)

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

      {/* F2 — carteira/envelhecimento (classe 3), gastos por categoria e contribuição */}
      <h2 className="pt-2 font-display text-lg font-semibold text-text-primary">{t("insights.carteiraTitle")}</h2>
      <EstadoTela
        loading={carteira.isLoading}
        error={carteira.isError ? t("insights.erroCarregar") : null}
        empty={carteiraEmpty}
        emptyMessage={t("insights.semDados")}
        onRetry={() => carteira.refetch()}
      >
        {carteira.data && !carteiraEmpty && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title={t("insights.carteiraTitle")}>
              <CarteiraChart carteira={carteira.data.carteira} ariaLabel={t("insights.carteiraAria")} />
            </ChartCard>
            <ChartCard title={t("insights.gastosCategoria")}>
              {carteira.data.gastosPorCategoria.length === 0 ? (
                <EstadoTela loading={false} error={null} empty emptyMessage={t("insights.semDadosPeriodo")} children={null} />
              ) : (
                <GastosCategoriaChart gastos={carteira.data.gastosPorCategoria} ariaLabel={t("insights.gastosCategoriaAria")} />
              )}
            </ChartCard>
            <ChartCard title={t("insights.contribuicao")}>
              {carteira.data.contribuicaoOperadores.every((o) => o.recebido === 0) ? (
                <EstadoTela loading={false} error={null} empty emptyMessage={t("insights.semDadosPeriodo")} children={null} />
              ) : (
                <ContribuicaoChart operadores={carteira.data.contribuicaoOperadores} ariaLabel={t("insights.contribuicaoAria")} />
              )}
            </ChartCard>
          </div>
        )}
      </EstadoTela>
    </div>
  )
}