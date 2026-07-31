import type { IAdminRepository } from "../../ports/admin.repository.js"

export class EditarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}
  async execute(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senhaHash?: string }, currentUserId: string) {
    return this.repo.update(id, data, currentUserId)
  }
}
