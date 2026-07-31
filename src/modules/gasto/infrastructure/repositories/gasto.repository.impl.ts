import { eq, and, isNull, gte, lte, count, sum, desc } from "drizzle-orm"
import { db, gastos } from "../../../../database.js"
import type { Gasto } from "../../domain/gasto.entity.js"
import type { IGastoRepository, ListGastosParams, ListGastosResult } from "../../application/ports/gasto.repository.js"

function rowToGasto(row: typeof gastos.$inferSelect): Gasto {
  return {
    id: row.id,
    valor: row.valor,
    categoria: row.categoria,
    observacao: row.observacao ?? null,
    data: row.data,
    createdAt: row.createdAt,
    deletedAt: row.deletedAt ?? null,
  }
}

export class GastoRepository implements IGastoRepository {
  async save(userId: string, gasto: Gasto): Promise<void> {
    await db.insert(gastos).values({
      id: gasto.id,
      valor: gasto.valor,
      categoria: gasto.categoria,
      observacao: gasto.observacao ?? null,
      data: gasto.data,
      createdAt: gasto.createdAt,
      userId,
    })
  }

  async findAll(userId: string, params: ListGastosParams): Promise<ListGastosResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    const conditions = [isNull(gastos.deletedAt), eq(gastos.userId, userId)]
    if (params.dataInicio) {
      conditions.push(gte(gastos.data, params.dataInicio))
    }
    if (params.dataFim) {
      conditions.push(lte(gastos.data, params.dataFim))
    }

    const where = and(...conditions)

    const [data, countResult, totalResult] = await Promise.all([
      db
        .select()
        .from(gastos)
        .where(where)
        .orderBy(desc(gastos.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ total: count() })
        .from(gastos)
        .where(where),
      db
        .select({ total: sum(gastos.valor) })
        .from(gastos)
        .where(where),
    ])

    const total = countResult[0]?.total ?? 0

    return {
      data: data.map(rowToGasto),
      totalPeriodo: Number(totalResult[0]?.total) || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async findById(userId: string, id: string): Promise<Gasto | null> {
    const rows = await db
      .select()
      .from(gastos)
      .where(and(eq(gastos.id, id), isNull(gastos.deletedAt), eq(gastos.userId, userId)))
      .limit(1)
    if (rows.length === 0) return null
    return rowToGasto(rows[0])
  }

  async softDelete(userId: string, id: string): Promise<void> {
    await db
      .update(gastos)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(gastos.id, id), eq(gastos.userId, userId)))
  }
}
