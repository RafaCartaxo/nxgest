import { rawQuery } from "../../../../database.js"
import type {
  IClienteFinanceiroQuery,
  ClienteFinanceiroResumo,
} from "../../application/ports/cliente-financeiro.query.js"
import { getLocalDateString, parseDateLocal } from "../../../../shared/utils/parseDateLocal.js"

interface AtrasoRow {
  valorEmAtraso: number
  parcelasEmAtraso: number
  maisAntiga: string | null
}

interface ValorRow {
  valorVenceHoje: number
}

interface PagamentoRow {
  data: string
  valor: number
}

interface LucroRow {
  lucroPrevisto: number
}

export class ClienteFinanceiroQuery implements IClienteFinanceiroQuery {
  async resumoByClienteId(userId: string, clienteId: string): Promise<ClienteFinanceiroResumo> {
    const hoje = getLocalDateString(new Date())

    const { rows: atrasoRows } = await rawQuery<AtrasoRow>(`
        SELECT
          COALESCE(SUM(p."saldoPendente"), 0) AS "valorEmAtraso",
          COUNT(p.id) AS "parcelasEmAtraso",
          MIN(p."dataVencimento") AS "maisAntiga"
        FROM parcelas p
        JOIN contratos ct ON ct.id = p."contratoId"
        WHERE ct."clienteId" = ?
          AND ct."userId" = ?
          AND p."dataVencimento" < ?
          AND p."saldoPendente" > 0
          AND p."deletedAt" IS NULL
          AND ct."deletedAt" IS NULL
          AND ct."estado" = 'Ativo'
      `, [clienteId, userId, hoje])
    const atraso = atrasoRows[0]

    const { rows: venceHojeRows } = await rawQuery<ValorRow>(`
        SELECT COALESCE(SUM(p."saldoPendente"), 0) AS "valorVenceHoje"
        FROM parcelas p
        JOIN contratos ct ON ct.id = p."contratoId"
        WHERE ct."clienteId" = ?
          AND ct."userId" = ?
          AND p."dataVencimento" = ?
          AND p."saldoPendente" > 0
          AND p."deletedAt" IS NULL
          AND ct."deletedAt" IS NULL
          AND ct."estado" = 'Ativo'
      `, [clienteId, userId, hoje])
    const venceHoje = venceHojeRows[0]

    const { rows: ultimoRows } = await rawQuery<PagamentoRow>(`
        SELECT p.data, p.valor
        FROM pagamentos p
        JOIN contratos ct ON ct.id = p."contratoId"
        WHERE ct."clienteId" = ?
          AND ct."userId" = ?
          AND p."estornadoEm" IS NULL
          AND ct."deletedAt" IS NULL
        ORDER BY p.data DESC, p."createdAt" DESC
        LIMIT 1
      `, [clienteId, userId])
    const ultimoPagamento = ultimoRows[0]

    const { rows: lucroRows } = await rawQuery<LucroRow>(`
        SELECT COALESCE(SUM(ct."valorFinal" - ct."valorBase"), 0) AS "lucroPrevisto"
        FROM contratos ct
        WHERE ct."clienteId" = ?
          AND ct."userId" = ?
          AND ct."estado" = 'Ativo'
          AND ct."deletedAt" IS NULL
      `, [clienteId, userId])
    const lucro = lucroRows[0]

    const diasEmAtraso =
      atraso?.maisAntiga != null
        ? Math.round(
            (parseDateLocal(hoje).getTime() - parseDateLocal(atraso.maisAntiga).getTime()) /
              86_400_000
          )
        : 0

    return {
      valorEmAtraso: Math.round((atraso?.valorEmAtraso ?? 0) * 100) / 100,
      parcelasEmAtraso: atraso?.parcelasEmAtraso ?? 0,
      diasEmAtraso,
      valorVenceHoje: Math.round((venceHoje?.valorVenceHoje ?? 0) * 100) / 100,
      ultimoPagamento: ultimoPagamento
        ? { data: ultimoPagamento.data, valor: Math.round(ultimoPagamento.valor * 100) / 100 }
        : null,
      lucroPrevisto: Math.round((lucro?.lucroPrevisto ?? 0) * 100) / 100,
    }
  }
}
