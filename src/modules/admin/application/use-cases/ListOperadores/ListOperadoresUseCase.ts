import type { IAdminRepository } from "../../ports/admin.repository.js"

export class ListOperadoresUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(empresaId?: string | null, scopeUserIds?: string[]) {
    return this.repo.findAllOperadores(empresaId, scopeUserIds)
  }
}
