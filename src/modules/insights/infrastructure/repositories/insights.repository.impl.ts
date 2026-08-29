import { rawQuery } from "../../../../database.js"
import type { IInsightsRepository } from "../../application/ports/insights.repository.js"

export class InsightsRepository implements IInsightsRepository {
  async recebidoPorData(userId: string, dataInicio: string, dataFim: string): Promise<Record<string, number>> {
    // Classe 1 (event log): pagamentos não estornados, agrupados por dia.
    const { rows } = await rawQuery<{ data: string; valor: number }>(
      `SELECT data, COALESCE(SUM(valor), 0)::numeric AS valor
       FROM pagamentos
       WHERE "user_id" = ? AND data BETWEEN ?::date AND ?::date AND "estornado_em" IS NULL
       GROUP BY data`,
      [userId, dataInicio, dataFim],
    )
    return Object.fromEntries(rows.map((r) => [r.data, Number(r.valor)]))
  }

  async previstoPorData(userId: string, dataInicio: string, dataFim: string): Promise<Record<string, number>> {
    // Classe 2 (cronograma imutável): parcelas por data_vencimento (zero UPDATE nessas colunas).
    const { rows } = await rawQuery<{ data: string; valor: number }>(
      `SELECT p."data_vencimento" AS data, COALESCE(SUM(p."valor_previsto"), 0)::numeric AS valor
       FROM parcelas p
       JOIN contratos ct ON ct.id = p."contrato_id"
       WHERE ct."user_id" = ? AND p."deleted_at" IS NULL AND ct."deleted_at" IS NULL
         AND p."data_vencimento" BETWEEN ?::date AND ?::date
       GROUP BY p."data_vencimento"`,
      [userId, dataInicio, dataFim],
    )
    return Object.fromEntries(rows.map((r) => [r.data, Number(r.valor)]))
  }
}