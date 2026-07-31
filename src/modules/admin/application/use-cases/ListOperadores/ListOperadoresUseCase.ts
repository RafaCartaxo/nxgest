import type { IAdminRepository } from "../../ports/admin.repository.js"

export class ListOperadoresUseCase {
  constructor(private readonly repo: IAdminRepository) {}
  async execute() {
    return this.repo.findAllOperadores()
  }
}
