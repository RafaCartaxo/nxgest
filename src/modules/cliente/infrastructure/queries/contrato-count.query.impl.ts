import { count, eq, isNull, and } from "drizzle-orm"
import { db, contratos } from "../../../../database.js"
import type { IContratoCountQuery } from "../../application/ports/contrato-count.query.js"

export class ContratoCountQuery implements IContratoCountQuery {
  async countByClienteId(userId: string, clienteId: string): Promise<number> {
    const rows = await db
      .select({ total: count() })
      .from(contratos)
      .where(
        and(
          eq(contratos.userId, userId),
          eq(contratos.clienteId, clienteId),
          isNull(contratos.deletedAt)
        )
      )
    return rows[0].total
  }
}
