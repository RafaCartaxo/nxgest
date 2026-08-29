import { rawQuery } from "../../../../database.js"
import type { IInsightsRepository } from "../../application/ports/insights.repository.js"
import type { CarteiraSnapshot, ContribuicaoOperador, GastoCategoria } from "../../domain/insights.entity.js"

function inPlaceholders(ids: string[]): string {
  return ids.map(() => "?").join(", ")
}

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

  async carteiraSnapshot(userIds: string[], hoje: string): Promise<CarteiraSnapshot> {
    // Classe 3 (estado mutável) — snapshot do presente, nunca série.
    const { rows } = await rawQuery<{ emAtraso: number; aVencer: number; pagas: number; total: number }>(
      `SELECT
        COALESCE(SUM(p."saldo_pendente") FILTER (WHERE p."data_vencimento" < ?::date AND p."saldo_pendente" > 0), 0)::numeric AS "emAtraso",
        COALESCE(SUM(p."saldo_pendente") FILTER (WHERE p."data_vencimento" >= ?::date AND p."saldo_pendente" > 0), 0)::numeric AS "aVencer",
        COALESCE(SUM(p."valor_pago") FILTER (WHERE p."saldo_pendente" = 0), 0)::numeric AS pagas,
        COALESCE(SUM(p."valor_previsto"), 0)::numeric AS total
       FROM parcelas p
       JOIN contratos ct ON ct.id = p."contrato_id"
       WHERE ct."user_id" IN (${inPlaceholders(userIds)}) AND p."deleted_at" IS NULL AND ct."deleted_at" IS NULL`,
      [hoje, hoje, ...userIds],
    )
    const r = rows[0]
    return {
      emAtraso: Number(r?.emAtraso) || 0,
      aVencer: Number(r?.aVencer) || 0,
      pagas: Number(r?.pagas) || 0,
      total: Number(r?.total) || 0,
    }
  }

  async gastosPorCategoria(userIds: string[]): Promise<GastoCategoria[]> {
    const { rows } = await rawQuery<{ categoria: string; total: number }>(
      `SELECT categoria, COALESCE(SUM(valor), 0)::numeric AS total
       FROM gastos
       WHERE "user_id" IN (${inPlaceholders(userIds)}) AND "deleted_at" IS NULL
       GROUP BY categoria
       ORDER BY total DESC`,
      userIds,
    )
    return rows.map((r) => ({ categoria: r.categoria, total: Number(r.total) }))
  }

  async contribuicaoOperadores(userIds: string[]): Promise<ContribuicaoOperador[]> {
    // Composição do total por operador (classe 1 — pagamentos não estornados), sem placar.
    const { rows } = await rawQuery<{ usuarioId: string; nome: string; recebido: number }>(
      `SELECT u.id AS "usuarioId", u.nome AS nome, COALESCE(SUM(p.valor), 0)::numeric AS recebido
       FROM usuarios u
       LEFT JOIN pagamentos p ON p."user_id" = u.id AND p."estornado_em" IS NULL
       WHERE u.id IN (${inPlaceholders(userIds)})
       GROUP BY u.id, u.nome
       ORDER BY u.nome ASC`,
      userIds,
    )
    return rows.map((r) => ({ usuarioId: r.usuarioId, nome: r.nome, recebido: Number(r.recebido) }))
  }

  async userIdsDaEmpresa(empresaId: string): Promise<string[]> {
    const { rows } = await rawQuery<{ id: string }>(
      `SELECT id FROM usuarios WHERE "empresa_id" = ? AND "deleted_at" IS NULL`,
      [empresaId],
    )
    return rows.map((r) => r.id)
  }
}