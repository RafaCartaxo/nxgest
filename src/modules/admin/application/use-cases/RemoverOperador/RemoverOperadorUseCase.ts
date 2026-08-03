import type { IAdminRepository } from "../../ports/admin.repository.js"

export class RemoverOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(id: string, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]) {
    const existing = await this.repo.findById(id, empresaId, scopeUserIds)
    if (!existing) throw new Error("Operador não encontrado.")
    return this.repo.softDelete(id, currentUserId, empresaId, scopeUserIds)
  }
}
