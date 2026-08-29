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

/** Carteira — snapshot do presente (classe 3), nunca série. */
export interface CarteiraSnapshot {
  emAtraso: number
  aVencer: number
  pagas: number
  total: number
}

export interface GastoCategoria {
  categoria: string
  total: number
}

export interface ContribuicaoOperador {
  usuarioId: string
  nome: string
  recebido: number
}

export interface ResumoCarteira {
  carteira: CarteiraSnapshot
  gastosPorCategoria: GastoCategoria[]
  contribuicaoOperadores: ContribuicaoOperador[]
}