import type { IAdminRepository } from "../../ports/admin.repository.js"

export class RemoverOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(id: string, currentUserId: string, empresaId?: string | null) {
    const existing = await this.repo.findById(id, empresaId)
    if (!existing) throw new Error("Operador não encontrado.")
    return this.repo.softDelete(id, currentUserId, empresaId)
  }
}
