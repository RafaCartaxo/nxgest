import { eq, isNull, and } from "drizzle-orm"
import { db, clientes } from "../../../../database.js"
import type { IClienteExistenceQuery } from "../../application/ports/cliente-existence.query.js"

export class ClienteExistenceQuery implements IClienteExistenceQuery {
  async exists(userId: string, clienteId: string): Promise<boolean> {
    const rows = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(and(eq(clientes.id, clienteId), isNull(clientes.deletedAt), eq(clientes.userId, userId)))
      .limit(1)
    return rows.length > 0
  }
}
