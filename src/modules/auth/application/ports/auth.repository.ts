import type { Usuario } from "../../domain/usuario.entity.js"

export interface IAuthRepository {
  findByEmail(email: string): Promise<Usuario | null>
  findById(id: string): Promise<Usuario | null>
  create(input: { nome: string; email: string; senhaHash: string; role: "super_admin" | "admin" | "operator"; empresaId?: string | null }): Promise<Usuario>
  updateSenha(id: string, senhaHash: string): Promise<void>
}
