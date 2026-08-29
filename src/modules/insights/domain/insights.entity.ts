export type PeriodoInsight = "dia" | "semana" | "mes"

export interface SerieItem {
  data: string
  /** Recebido no dia (event log — classe 1: pagamentos não estornados). */
  recebido: number
  /** Previsto no dia (cronograma imutável — classe 2: parcelas). */
  previsto: number
}

export interface ResumoInsights {
  periodo: PeriodoInsight
  dataInicio: string
  dataFim: string
  serie: SerieItem[]
}