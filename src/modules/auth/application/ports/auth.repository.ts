import type { Usuario } from "../../domain/usuario.entity.js"

export type Role = "super_admin" | "admin" | "socio" | "operator"

export interface IAuthRepository {
  findByEmail(email: string): Promise<Usuario | null>
  findById(id: string): Promise<Usuario | null>
  create(input: { nome: string; email: string; senhaHash: string; role: Role; empresaId?: string | null; chefeId?: string | null }): Promise<Usuario>
  updateSenha(id: string, senhaHash: string): Promise<void>
  updateFoto(id: string, foto: string | null): Promise<void>
}
