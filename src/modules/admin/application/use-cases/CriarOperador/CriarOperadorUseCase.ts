import type { IAdminRepository } from "../../ports/admin.repository.js"
import { EmailDuplicadoError } from "../../../../auth/domain/errors/auth.error.js"
import { NaoPodeAtribuirSuperAdminError } from "../../../domain/errors/admin.error.js"

interface CriarOperadorInput {
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  empresaId: string | null
  chefeId?: string | null
  /** PLAN-075 (P-09): telefone opcional do convidado. */
  telefone?: string | null
}

/**
 * Criação administrativa (PLAN-075 P-04/N4): NUNCA recebe senha — todo cadastro nasce
 * `CONVIDADO` (recebe convite pelo fluxo de ativação). `senhaHash` fica sempre null.
 */
export class CriarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(input: CriarOperadorInput) {
    if (input.role === "super_admin") {
      throw new NaoPodeAtribuirSuperAdminError()
    }
    // E-mail normalizado (minúsculas/trim) antes da dedup — login é case-insensitive (PLAN-075).
    const email = input.email.trim().toLowerCase()
    // Dedup global (N1.6): contrato na aplicação, nunca depender do unique constraint.
    const emUso = await this.repo.emailEmUso(email)
    if (emUso) {
      throw new EmailDuplicadoError()
    }
    return this.repo.create({ ...input, email })
  }
}