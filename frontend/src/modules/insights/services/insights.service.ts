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