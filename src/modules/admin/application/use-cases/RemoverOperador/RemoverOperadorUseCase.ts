import type { IAdminRepository } from "../../ports/admin.repository.js"

export class RemoverOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}
  async execute(id: string, currentUserId: string) {
    return this.repo.softDelete(id, currentUserId)
  }
}
