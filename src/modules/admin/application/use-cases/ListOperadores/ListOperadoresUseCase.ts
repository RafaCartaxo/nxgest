import type { IAdminRepository } from "../../ports/admin.repository.js"

export class ListOperadoresUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(empresaId?: string | null) {
    return this.repo.findAllOperadores(empresaId)
  }
}