import { eq, and, isNull, sql } from "drizzle-orm"
import { db, usuarios } from "../../../../database.js"
import type { IAuthRepository, Role, PerfilAlteravel } from "../../application/ports/auth.repository.js"
import type { Usuario } from "../../domain/usuario.entity.js"
import { v4 as uuid } from "uuid"

function toUsuario(row: typeof usuarios.$inferSelect): Usuario {
  return {
    ...row,
    role: row.role as Role,
    empresaId: row.empresaId ?? null,
    chefeId: row.chefeId ?? null,
    foto: row.foto ?? null,
    telefone: row.telefone ?? null,
    emailPendente: row.emailPendente ?? null,
    suspensoEm: row.suspensoEm ?? null,
  }
}

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    const rows = await db.select().from(usuarios).where(sql`lower("email") = lower(${email})`)
    if (!rows[0]) return null
    return toUsuario(rows[0])
  }

  async findById(id: string): Promise<Usuario | null> {
    const rows = await db.select().from(usuarios).where(and(eq(usuarios.id, id), isNull(usuarios.deletedAt)))
    if (!rows[0]) return null
    return toUsuario(rows[0])
  }

  async emailEmUso(email: string, ignoreId?: string | null): Promise<boolean> {
    const conds = [
      sql`(lower("email") = lower(${email}) OR lower("email_pendente") = lower(${email}))`,
      sql`"deleted_at" IS NULL`,
      ignoreId ? sql`"id" <> ${ignoreId}` : undefined,
    ]
    const rows = await db.select({ id: usuarios.id }).from(usuarios).where(and(...conds))
    return rows.length > 0
  }

  async create(input: { nome: string; email: string; senhaHash: string; role: Role; empresaId?: string | null; chefeId?: string | null }): Promise<Usuario> {
    const id = uuid()
    await db.insert(usuarios).values({
      id,
      nome: input.nome,
      email: input.email,
      senhaHash: input.senhaHash,
      role: input.role,
      empresaId: input.empresaId ?? null,
      chefeId: input.chefeId ?? null,
      createdAt: new Date().toISOString(),
    })
    return {
      id,
      nome: input.nome,
      email: input.email,
      emailPendente: null,
      senhaHash: input.senhaHash,
      role: input.role,
      empresaId: input.empresaId ?? null,
      chefeId: input.chefeId ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      foto: null,
      telefone: null,
      suspensoEm: null,
    }
  }

  async updateSenha(id: string, senhaHash: string): Promise<void> {
    await db.update(usuarios).set({ senhaHash }).where(eq(usuarios.id, id))
  }

  async updateFoto(id: string, foto: string | null): Promise<void> {
    await db.update(usuarios).set({ foto }).where(eq(usuarios.id, id))
  }

  async updatePerfil(id: string, data: PerfilAlteravel): Promise<Usuario | null> {
    const set: Record<string, unknown> = {}
    if (data.nome !== undefined) set.nome = data.nome
    if (data.telefone !== undefined) set.telefone = data.telefone
    if (Object.keys(set).length === 0) return this.findById(id)
    await db.update(usuarios).set(set).where(eq(usuarios.id, id))
    return this.findById(id)
  }

  async setEmailPendente(id: string, emailPendente: string | null): Promise<void> {
    await db.update(usuarios).set({ emailPendente }).where(eq(usuarios.id, id))
  }

  async confirmarEmail(id: string): Promise<void> {
    // Promove email_pendente → email e limpa a pendência (atômico).
    await db
      .update(usuarios)
      .set({ email: sql`COALESCE("email_pendente", "email")`, emailPendente: null })
      .where(eq(usuarios.id, id))
  }

  async updateEmail(id: string, email: string): Promise<void> {
    await db.update(usuarios).set({ email }).where(eq(usuarios.id, id))
  }

  async setSuspenso(id: string, suspensoEm: string | null): Promise<void> {
    await db.update(usuarios).set({ suspensoEm }).where(eq(usuarios.id, id))
  }
}