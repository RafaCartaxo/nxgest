import { apiRequest } from "../../../api/client.js"

export type PeriodoInsight = "dia" | "semana" | "mes"

export interface SerieItem {
  data: string
  recebido: number
  previsto: number
}

export interface ResumoInsights {
  periodo: PeriodoInsight
  dataInicio: string
  dataFim: string
  serie: SerieItem[]
}

export function getResumoInsights(periodo: PeriodoInsight = "semana"): Promise<ResumoInsights> {
  return apiRequest<ResumoInsights>("GET", `/insights/resumo?periodo=${periodo}`)
}

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

export function getCarteiraInsights(): Promise<ResumoCarteira> {
  return apiRequest<ResumoCarteira>("GET", "/insights/carteira")
}