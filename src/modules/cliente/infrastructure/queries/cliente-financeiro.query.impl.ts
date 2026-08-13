import { rawQuery } from "../../../../database.js"
import type {
  IClienteFinanceiroQuery,
  ClienteFinanceiroResumo,
} from "../../application/ports/cliente-financeiro.query.js"
import { getLocalDateString, parseDateLocal } from "../../../../shared/utils/parseDateLocal.js"

interface AtrasoRow {
  valor_em_atraso: number
  parcelas_em_atraso: number
  mais_antiga: string | null
}

interface ValorRow {
  valor_vence_hoje: number
}

interface PagamentoRow {
  data: string
  valor: number
}

interface LucroRow {
  lucro_por_estado: number
}

export class ClienteFinanceiroQuery implements IClienteFinanceiroQuery {
  /** Soma do lucro (valorFinal − valorBase) dos contratos do cliente num estado ('Ativo' = previsto · 'Finalizado' = realizado). */
  private async sumLucroPorEstado(userId: string, clienteId: string, estado: string): Promise<number> {
    const { rows } = await rawQuery<LucroRow>(`
        SELECT COALESCE(SUM(ct."valor_final" - ct."valor_base"), 0) AS "lucro_por_estado"
        FROM contratos ct
        WHERE ct."cliente_id" = ?
          AND ct."user_id" = ?
          AND ct."estado" = ?
          AND ct."deleted_at" IS NULL
      `, [clienteId, userId, estado])
    return rows[0]?.lucro_por_estado ?? 0
  }

  async resumoByClienteId(userId: string, clienteId: string): Promise<ClienteFinanceiroResumo> {
    const hoje = getLocalDateString(new Date())

    const { rows: atrasoRows } = await rawQuery<AtrasoRow>(`
        SELECT
          COALESCE(SUM(p."saldo_pendente"), 0) AS "valor_em_atraso",
          COUNT(p.id) AS "parcelas_em_atraso",
          MIN(p."data_vencimento") AS "mais_antiga"
        FROM parcelas p
        JOIN contratos ct ON ct.id = p."contrato_id"
        WHERE ct."cliente_id" = ?
          AND ct."user_id" = ?
          AND p."data_vencimento" < ?
          AND p."saldo_pendente" > 0
          AND p."deleted_at" IS NULL
          AND ct."deleted_at" IS NULL
          AND ct."estado" = 'Ativo'
      `, [clienteId, userId, hoje])
    const atraso = atrasoRows[0]

    const { rows: venceHojeRows } = await rawQuery<ValorRow>(`
        SELECT COALESCE(SUM(p."saldo_pendente"), 0) AS "valor_vence_hoje"
        FROM parcelas p
        JOIN contratos ct ON ct.id = p."contrato_id"
        WHERE ct."cliente_id" = ?
          AND ct."user_id" = ?
          AND p."data_vencimento" = ?
          AND p."saldo_pendente" > 0
          AND p."deleted_at" IS NULL
          AND ct."deleted_at" IS NULL
          AND ct."estado" = 'Ativo'
      `, [clienteId, userId, hoje])
    const venceHoje = venceHojeRows[0]

    const { rows: ultimoRows } = await rawQuery<PagamentoRow>(`
        SELECT p.data, p.valor
        FROM pagamentos p
        JOIN contratos ct ON ct.id = p."contrato_id"
        WHERE ct."cliente_id" = ?
          AND ct."user_id" = ?
          AND p."estornado_em" IS NULL
          AND ct."deleted_at" IS NULL
        ORDER BY p.data DESC, p."created_at" DESC
        LIMIT 1
      `, [clienteId, userId])
    const ultimoPagamento = ultimoRows[0]

    const [lucroPrevisto, lucroRealizado] = await Promise.all([
      this.sumLucroPorEstado(userId, clienteId, "Ativo"),
      this.sumLucroPorEstado(userId, clienteId, "Finalizado"),
    ])

    const diasEmAtraso =
      atraso?.mais_antiga != null
        ? Math.round(
            (parseDateLocal(hoje).getTime() - parseDateLocal(atraso.mais_antiga).getTime()) /
              86_400_000
          )
        : 0

    return {
      valorEmAtraso: Math.round((atraso?.valor_em_atraso ?? 0) * 100) / 100,
      parcelasEmAtraso: atraso?.parcelas_em_atraso ?? 0,
      diasEmAtraso,
      valorVenceHoje: Math.round((venceHoje?.valor_vence_hoje ?? 0) * 100) / 100,
      ultimoPagamento: ultimoPagamento
        ? { data: ultimoPagamento.data, valor: Math.round(ultimoPagamento.valor * 100) / 100 }
        : null,
      lucroPrevisto: Math.round(lucroPrevisto * 100) / 100,
      lucroRealizado: Math.round(lucroRealizado * 100) / 100,
    }
  }
}
