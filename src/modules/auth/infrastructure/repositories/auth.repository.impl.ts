import { eq, and, isNull } from "drizzle-orm"
import { db, usuarios } from "../../../../database.js"
import type { IAuthRepository } from "../../application/ports/auth.repository.js"
import type { Usuario } from "../../domain/usuario.entity.js"
import { v4 as uuid } from "uuid"

export type Role = "super_admin" | "admin" | "socio" | "operator"

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    const rows = await db.select().from(usuarios).where(eq(usuarios.email, email))
    const row = rows[0]
    if (!row) return null
    return { ...row, role: row.role as Role, empresaId: row.empresaId ?? null, chefeId: row.chefeId ?? null, foto: row.foto ?? null }
  }

  async findById(id: string): Promise<Usuario | null> {
    const rows = await db.select().from(usuarios).where(and(eq(usuarios.id, id), isNull(usuarios.deletedAt)))
    const row = rows[0]
    if (!row) return null
    return { ...row, role: row.role as Role, empresaId: row.empresaId ?? null, chefeId: row.chefeId ?? null, foto: row.foto ?? null }
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
      senhaHash: input.senhaHash,
      role: input.role,
      empresaId: input.empresaId ?? null,
      chefeId: input.chefeId ?? null,
      createdAt: new Date().toISOString(),
      deletedAt: null,
      foto: null,
    }
  }

  async updateSenha(id: string, senhaHash: string): Promise<void> {
    await db.update(usuarios).set({ senhaHash }).where(eq(usuarios.id, id))
  }

  async updateFoto(id: string, foto: string | null): Promise<void> {
    await db.update(usuarios).set({ foto }).where(eq(usuarios.id, id))
  }
}
