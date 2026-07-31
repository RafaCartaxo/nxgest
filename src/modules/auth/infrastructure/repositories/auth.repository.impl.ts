import { eq } from "drizzle-orm"
import { db, usuarios } from "../../../../database.js"
import type { IAuthRepository } from "../../application/ports/auth.repository.js"
import type { Usuario } from "../../domain/usuario.entity.js"
import { v4 as uuid } from "uuid"

export class AuthRepository implements IAuthRepository {
  async findByEmail(email: string): Promise<Usuario | null> {
    const rows = await db.select().from(usuarios).where(eq(usuarios.email, email))
    const row = rows[0]
    if (!row) return null
    return { ...row, role: row.role as "admin" | "operator" }
  }

  async findById(id: string): Promise<Usuario | null> {
    const rows = await db.select().from(usuarios).where(eq(usuarios.id, id))
    const row = rows[0]
    if (!row) return null
    return { ...row, role: row.role as "admin" | "operator" }
  }

  async create(input: { nome: string; email: string; senhaHash: string; role: "admin" | "operator" }): Promise<Usuario> {
    const id = uuid()
    await db.insert(usuarios).values({
      id,
      nome: input.nome,
      email: input.email,
      senhaHash: input.senhaHash,
      role: input.role,
      createdAt: new Date().toISOString(),
    })
    return { id, nome: input.nome, email: input.email, senhaHash: input.senhaHash, role: input.role, createdAt: new Date().toISOString(), deletedAt: null }
  }
}
