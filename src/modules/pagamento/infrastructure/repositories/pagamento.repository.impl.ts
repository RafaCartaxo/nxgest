import { eq, and } from "drizzle-orm"
import type { PgDatabase } from "drizzle-orm/pg-core"
import { db, pagamentos, pagamentoParcelas, auditoriaEstornos } from "../../../../database.js"
import type { Pagamento, PagamentoParcela, PagamentoComDetalhes } from "../../domain/pagamento.entity.js"
import type { IPagamentoRepository, AuditoriaEstorno } from "../../application/ports/pagamento.repository.js"

type PagamentoRow = typeof pagamentos.$inferSelect
type PagamentoParcelaRow = typeof pagamentoParcelas.$inferSelect

export class PagamentoRepository implements IPagamentoRepository {
  private drizzle: PgDatabase<any, any, any>

  constructor(drizzle?: PgDatabase<any, any, any>) {
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
        estornadoEm: row.estornadoEm,
        estornadoPor: row.estornadoPor,
        estornoMotivo: row.estornoMotivo,
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

  private async carregarParcelas(pagamentoId: string): Promise<PagamentoParcela[]> {
    const parcelasRows = await this.drizzle
      .select()
      .from(pagamentoParcelas)
      .where(eq(pagamentoParcelas.pagamentoId, pagamentoId))
    return parcelasRows.map((pr) => ({
      id: pr.id,
      pagamentoId: pr.pagamentoId,
      parcelaId: pr.parcelaId,
      valor: pr.valor,
    }))
  }

  async findByIdWithParcelas(pagamentoId: string, userId: string): Promise<PagamentoComDetalhes | null> {
    const rows = await this.drizzle
      .select()
      .from(pagamentos)
      .where(and(eq(pagamentos.id, pagamentoId), eq(pagamentos.userId, userId)))
      .limit(1)

    if (rows.length === 0) return null
    const row = rows[0]
    return {
      id: row.id,
      contratoId: row.contratoId,
      valor: row.valor,
      data: row.data,
      createdAt: row.createdAt,
      userId: row.userId,
      estornadoEm: row.estornadoEm,
      estornadoPor: row.estornadoPor,
      estornoMotivo: row.estornoMotivo,
      parcelas: await this.carregarParcelas(row.id),
    }
  }

  async marcarEstornado(pagamentoId: string, adminId: string, motivo: string): Promise<void> {
    const now = new Date().toISOString()
    await this.drizzle
      .update(pagamentos)
      .set({
        estornadoEm: now,
        estornadoPor: adminId,
        estornoMotivo: motivo,
      })
      .where(eq(pagamentos.id, pagamentoId))
  }

  async saveAuditoriaEstorno(a: AuditoriaEstorno): Promise<void> {
    await this.drizzle.insert(auditoriaEstornos).values({
      id: a.id,
      pagamentoId: a.pagamentoId,
      operadorId: a.operadorId,
      adminId: a.adminId,
      valor: a.valor,
      motivo: a.motivo,
      data: a.data,
      createdAt: a.createdAt,
    })
  }
}
