import type { IAdminRepository } from "../../ports/admin.repository.js"
import { EmailDuplicadoError } from "../../../../auth/domain/errors/auth.error.js"

interface CriarOperadorInput {
  nome: string
  email: string
  senhaHash: string
  role: "super_admin" | "admin" | "operator"
  empresaId: string | null
}

export class CriarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(input: CriarOperadorInput) {
    if (input.role === "super_admin") {
      throw new Error("Apenas o seed inicial pode criar usuários com role super_admin.")
    }
    const existente = await this.repo.findByEmail(input.email)
    if (existente) {
      throw new EmailDuplicadoError()
    }
    return this.repo.create(input)
  }
}