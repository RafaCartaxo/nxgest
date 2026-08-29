import type { SerieItem } from "../../domain/insights.entity.js"

/** Agregados de insights — fonte única por gráfico (D13, padrão PLAN-083). */
export interface IInsightsRepository {
  /** Série de recebidos por data (classe 1 — event log de pagamentos). */
  recebidoPorData(userId: string, dataInicio: string, dataFim: string): Promise<Record<string, number>>
  /** Série de previsto por data (classe 2 — cronograma imutável das parcelas). */
  previstoPorData(userId: string, dataInicio: string, dataFim: string): Promise<Record<string, number>>
}

export type { SerieItem }