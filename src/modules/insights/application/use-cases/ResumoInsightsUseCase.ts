import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"
import type { ResumoInsights, PeriodoInsight } from "../../domain/insights.entity.js"
import type { IInsightsRepository } from "../ports/insights.repository.js"

/** Range de datas por período (dia = hoje · semana = últimos 7 · mes = últimos 30). */
export function rangeDoPeriodo(periodo: PeriodoInsight, hoje = new Date()): { dataInicio: string; dataFim: string } {
  const fim = new Date(hoje)
  const inicio = new Date(hoje)
  if (periodo === "dia") {
    // mesmo dia
  } else if (periodo === "semana") {
    inicio.setDate(inicio.getDate() - 6)
  } else {
    inicio.setDate(inicio.getDate() - 29)
  }
  return { dataInicio: getLocalDateString(inicio), dataFim: getLocalDateString(fim) }
}

/**
 * Resumo de insights (PLAN-080 F1): séries de recebido (classe 1) e previsto
 * (classe 2) por dia no período. Endpoint único `/api/insights/resumo?periodo=`.
 */
export class ResumoInsightsUseCase {
  constructor(private readonly repository: IInsightsRepository) {}

  async execute(userId: string, periodo: PeriodoInsight, hoje = new Date()): Promise<ResumoInsights> {
    const { dataInicio, dataFim } = rangeDoPeriodo(periodo, hoje)

    const [recebido, previsto] = await Promise.all([
      this.repository.recebidoPorData(userId, dataInicio, dataFim),
      this.repository.previstoPorData(userId, dataInicio, dataFim),
    ])

    const serie = []
    const fim = new Date(dataFim + "T12:00:00Z")
    for (let d = new Date(dataInicio + "T12:00:00Z"); d <= fim; d.setUTCDate(d.getUTCDate() + 1)) {
      const data = d.toISOString().slice(0, 10)
      serie.push({ data, recebido: recebido[data] ?? 0, previsto: previsto[data] ?? 0 })
    }

    return { periodo, dataInicio, dataFim, serie }
  }
}