import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"
import type { IAuthTokenRepository } from "../../../../auth/application/ports/auth-token.repository.js"
import { hashToken } from "../../../../auth/domain/auth-token.service.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../../auth/domain/errors/auth.error.js"

/** Confirma o e-mail do lead via token (24h, single-use) → EMAIL_CONFIRMADO (LD-06). */
export class ConfirmarLeadUseCase {
  constructor(private tokenRepo: IAuthTokenRepository, private repo: ILeadRepository) {}

  async execute(input: { token: string }): Promise<Lead> {
    const auth = await this.tokenRepo.findByHashAndTipo(hashToken(input.token), "lead")
    if (!auth) throw new TokenInvalidoError()
    // Single-use (LD-08): token já consumido não pode ser reutilizado.
    if (auth.usadoEm) throw new TokenInvalidoError()
    if (new Date(auth.expiraEm).getTime() < Date.now()) throw new TokenExpiradoError()

    const lead = await this.repo.findById(auth.subjectId)
    if (!lead || lead.status === "CONVERTIDO" || lead.status === "DESCARTADO") {
      throw new TokenInvalidoError()
    }

    await this.tokenRepo.marcarUsado(auth.id, new Date().toISOString())
    const atualizado = await this.repo.marcarConfirmado(lead.id)
    return atualizado!
  }
}
