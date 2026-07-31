import { eq, isNull, and, sql } from "drizzle-orm"
import { db, parcelas, contratos } from "../../../../database.js"
import type { IClienteSaldoQuery } from "../../application/ports/cliente-saldo.query.js"

export class ClienteSaldoQuery implements IClienteSaldoQuery {
  async sumByClienteId(userId: string, clienteId: string): Promise<number> {
    const rows = await db
      .select({ total: sql<number>`COALESCE(SUM(${parcelas.saldoPendente}), 0)` })
      .from(parcelas)
      .innerJoin(contratos, eq(contratos.id, parcelas.contratoId))
      .where(
        and(
          eq(contratos.userId, userId),
          eq(contratos.clienteId, clienteId),
          isNull(contratos.deletedAt),
          isNull(parcelas.deletedAt)
        )
      )
    return rows[0].total
  }
}
