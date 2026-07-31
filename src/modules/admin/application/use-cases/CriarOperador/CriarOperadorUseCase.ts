import type { IAdminRepository } from "../../ports/admin.repository.js"
import { EmailDuplicadoError } from "../../../../auth/domain/errors/auth.error.js"

interface CriarOperadorInput {
  nome: string
  email: string
  senhaHash: string
  role: "admin" | "operator"
}

export class CriarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}
  async execute(input: CriarOperadorInput) {
    const existente = await this.repo.findByEmail(input.email)
    if (existente) {
      throw new EmailDuplicadoError()
    }
    return this.repo.create(input)
  }
}
