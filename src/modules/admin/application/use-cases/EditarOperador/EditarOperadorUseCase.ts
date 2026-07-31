import type { IAdminRepository } from "../../ports/admin.repository.js"

export class EditarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(id: string, data: { nome?: string; email?: string; role?: "super_admin" | "admin" | "operator"; senhaHash?: string }, currentUserId: string, empresaId?: string | null) {
    const existing = await this.repo.findById(id, empresaId)
    if (!existing) throw new Error("Operador não encontrado.")
    return this.repo.update(id, data, currentUserId, empresaId)
  }
}
