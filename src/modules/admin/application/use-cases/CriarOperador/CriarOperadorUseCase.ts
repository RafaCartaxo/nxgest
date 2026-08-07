import type { IAdminRepository } from "../../ports/admin.repository.js"
import { EmailDuplicadoError } from "../../../../auth/domain/errors/auth.error.js"
import { NaoPodeAtribuirSuperAdminError } from "../../../domain/errors/admin.error.js"

interface CriarOperadorInput {
  nome: string
  email: string
  /** Nullable (PLAN-065): sem senha = convidado (recebe convite). */
  senhaHash: string | null
  role: "super_admin" | "admin" | "socio" | "operator"
  empresaId: string | null
  chefeId?: string | null
}

export class CriarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(input: CriarOperadorInput) {
    if (input.role === "super_admin") {
      throw new NaoPodeAtribuirSuperAdminError()
    }
    const existente = await this.repo.findByEmail(input.email)
    if (existente) {
      throw new EmailDuplicadoError()
    }
    return this.repo.create(input)
  }
}