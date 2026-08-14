import { eq, and, isNull, inArray } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { db, convites } from "../../../../database.js"
import type { Convite, ConviteStatus } from "../../domain/convite.entity.js"
import type { IConviteRepository, CriarConviteInput } from "../../application/ports/convite.repository.js"

function toConvite(row: typeof convites.$inferSelect): Convite {
  return {
    id: row.id,
    usuarioId: row.usuarioId,
    emailAlvo: row.emailAlvo,
    criadoPor: row.criadoPor ?? null,
    roleAlvo: row.roleAlvo ?? null,
    idioma: row.idioma,
    status: row.status as ConviteStatus,
    tokenHash: row.tokenHash,
    criadoEm: row.criadoEm,
    expiraEm: row.expiraEm,
    usadoEm: row.usadoEm ?? null,
    revogadoEm: row.revogadoEm ?? null,
  }
}

const PENDENTE = "PENDENTE" as const

export class ConviteRepository implements IConviteRepository {
  async create(input: CriarConviteInput): Promise<Convite> {
    const id = uuid()
    // Invariante "nunca dois convites válidos": invalidar os PENDENTE anteriores do usuário
    // na MESMA transação em que o novo é criado (N2).
    await db.transaction(async (tx) => {
      await tx
        .update(convites)
        .set({ status: "EXPIRADO" })
        .where(and(eq(convites.usuarioId, input.usuarioId), eq(convites.status, PENDENTE)))
      await tx.insert(convites).values({
        id,
        usuarioId: input.usuarioId,
        emailAlvo: input.emailAlvo,
        criadoPor: input.criadoPor ?? null,
        roleAlvo: input.roleAlvo ?? null,
        idioma: input.idioma,
        status: PENDENTE,
        tokenHash: input.tokenHash,
        criadoEm: new Date().toISOString(),
        expiraEm: input.expiraEm,
      })
    })
    return {
      id,
      usuarioId: input.usuarioId,
      emailAlvo: input.emailAlvo,
      criadoPor: input.criadoPor ?? null,
      roleAlvo: input.roleAlvo ?? null,
      idioma: input.idioma,
      status: PENDENTE,
      tokenHash: input.tokenHash,
      criadoEm: new Date().toISOString(),
      expiraEm: input.expiraEm,
      usadoEm: null,
      revogadoEm: null,
    }
  }

  async findByHash(hash: string): Promise<Convite | null> {
    const rows = await db.select().from(convites).where(eq(convites.tokenHash, hash)).limit(1)
    if (!rows[0]) return null
    return toConvite(rows[0])
  }

  async findValidoPorUsuario(usuarioId: string): Promise<Convite | null> {
    const rows = await db
      .select()
      .from(convites)
      .where(and(eq(convites.usuarioId, usuarioId), eq(convites.status, PENDENTE)))
      .orderBy(convites.criadoEm)
      .limit(1)
    if (!rows[0]) return null
    return toConvite(rows[0])
  }

  async statusPorUsuario(userIds: string[]): Promise<Map<string, ConviteStatus | null>> {
    const map = new Map<string, ConviteStatus | null>()
    for (const id of userIds) map.set(id, null)
    if (userIds.length === 0) return map
    const rows = await db
      .select({ usuarioId: convites.usuarioId, status: convites.status, criadoEm: convites.criadoEm })
      .from(convites)
      .where(inArray(convites.usuarioId, userIds))
      .orderBy(convites.criadoEm)
    for (const r of rows) map.set(r.usuarioId, r.status as ConviteStatus)
    return map
  }

  async marcarUsado(id: string, agora: string): Promise<void> {
    await db.update(convites).set({ status: "CONCLUIDO", usadoEm: agora }).where(eq(convites.id, id))
  }

  async marcarExpirado(id: string): Promise<void> {
    await db.update(convites).set({ status: "EXPIRADO" }).where(eq(convites.id, id))
  }

  async revogar(id: string, agora: string): Promise<void> {
    await db.update(convites).set({ status: "REVOGADO", revogadoEm: agora }).where(eq(convites.id, id))
  }

  async invalidarAtivos(usuarioId: string): Promise<void> {
    await db
      .update(convites)
      .set({ status: "EXPIRADO" })
      .where(and(eq(convites.usuarioId, usuarioId), eq(convites.status, PENDENTE)))
  }
}