import type { IAdminRepository } from "../../ports/admin.repository.js"

export class EditarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(
    id: string,
    data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; senhaHash?: string; chefeId?: string | null; foto?: string | null; reatribuirParaChefeId?: string | null },
    currentUserId: string,
    empresaId?: string | null,
    scopeUserIds?: string[]
  ) {
    const existing = await this.repo.findById(id, empresaId, scopeUserIds)
    if (!existing) throw new Error("Operador não encontrado.")
    return this.repo.update(id, data, currentUserId, empresaId, scopeUserIds)
  }
}
