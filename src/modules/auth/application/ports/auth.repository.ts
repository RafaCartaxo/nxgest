import type { Usuario } from "../../domain/usuario.entity.js"

export interface IAuthRepository {
  findByEmail(email: string): Promise<Usuario | null>
  findById(id: string): Promise<Usuario | null>
  create(input: { nome: string; email: string; senhaHash: string; role: "admin" | "operator" }): Promise<Usuario>
}
