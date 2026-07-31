import { eq, and } from "drizzle-orm"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { db, pagamentos, pagamentoParcelas } from "../../../../database.js"
import type { Pagamento, PagamentoParcela, PagamentoComDetalhes } from "../../domain/pagamento.entity.js"
import type { IPagamentoRepository } from "../../application/ports/pagamento.repository.js"

type PagamentoRow = typeof pagamentos.$inferSelect
type PagamentoParcelaRow = typeof pagamentoParcelas.$inferSelect

export class PagamentoRepository implements IPagamentoRepository {
  private drizzle: BetterSQLite3Database

  constructor(drizzle?: BetterSQLite3Database) {
    this.drizzle = drizzle ?? db
  }

  async save(pagamento: Pagamento, userId: string): Promise<void> {
    await this.drizzle.insert(pagamentos).values({
      id: pagamento.id,
      contratoId: pagamento.contratoId,
      valor: pagamento.valor,
      data: pagamento.data,
      createdAt: pagamento.createdAt,
      userId,
    })
  }

  async savePagamentoParcela(relacao: PagamentoParcela, _userId: string): Promise<void> {
    await this.drizzle.insert(pagamentoParcelas).values({
      id: relacao.id,
      pagamentoId: relacao.pagamentoId,
      parcelaId: relacao.parcelaId,
      valor: relacao.valor,
    })
  }

  async findByContratoId(contratoId: string, userId: string): Promise<PagamentoComDetalhes[]> {
    const rows = await this.drizzle
      .select()
      .from(pagamentos)
      .where(and(eq(pagamentos.contratoId, contratoId), eq(pagamentos.userId, userId)))
      .orderBy(pagamentos.createdAt)

    const result: PagamentoComDetalhes[] = []

    for (const row of rows) {
      const parcelasRows = await this.drizzle
        .select()
        .from(pagamentoParcelas)
        .where(eq(pagamentoParcelas.pagamentoId, row.id))

      result.push({
        id: row.id,
        contratoId: row.contratoId,
        valor: row.valor,
        data: row.data,
        createdAt: row.createdAt,
        parcelas: parcelasRows.map((pr) => ({
          id: pr.id,
          pagamentoId: pr.pagamentoId,
          parcelaId: pr.parcelaId,
          valor: pr.valor,
        })),
      })
    }

    return result
  }
}
