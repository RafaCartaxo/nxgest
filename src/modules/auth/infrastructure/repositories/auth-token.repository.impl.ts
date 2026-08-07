import { eq, and, isNull } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { db, authTokens } from "../../../../database.js"
import type { AuthToken, AuthTokenTipo } from "../../domain/auth-token.entity.js"
import type { IAuthTokenRepository } from "../../application/ports/auth-token.repository.js"

export class AuthTokenRepository implements IAuthTokenRepository {
  async create(input: { subjectId: string; tipo: AuthTokenTipo; hash: string; expiraEm: string }): Promise<void> {
    await db.insert(authTokens).values({
      id: uuid(),
      subjectId: input.subjectId,
      tipo: input.tipo,
      hash: input.hash,
      expiraEm: input.expiraEm,
      usadoEm: null,
      createdAt: new Date().toISOString(),
    }).run()
  }

  async findByHashAndTipo(hash: string, tipo: AuthTokenTipo): Promise<AuthToken | null> {
    const rows = await db.select().from(authTokens).where(and(eq(authTokens.hash, hash), eq(authTokens.tipo, tipo))).limit(1)
    if (!rows[0]) return null
    const r = rows[0]
    return { id: r.id, subjectId: r.subjectId, tipo: r.tipo as AuthTokenTipo, hash: r.hash, expiraEm: r.expiraEm, usadoEm: r.usadoEm, createdAt: r.createdAt }
  }

  async marcarUsado(id: string, agora: string): Promise<void> {
    await db.update(authTokens).set({ usadoEm: agora }).where(eq(authTokens.id, id)).run()
  }

  async invalidarPorTipo(subjectId: string, tipo: AuthTokenTipo): Promise<void> {
    await db.update(authTokens).set({ usadoEm: new Date().toISOString() }).where(and(eq(authTokens.subjectId, subjectId), eq(authTokens.tipo, tipo), isNull(authTokens.usadoEm))).run()
  }
}
