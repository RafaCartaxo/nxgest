import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import { hashToken } from "../../../domain/auth-token.service.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../domain/errors/auth.error.js"

/**
 * Confirmação da troca de e-mail (PLAN-075 F4/N5): valida token `email` (24h) do próprio
 * usuário e promove `email_pendente → email` atômicamente.
 */
export class VerificarEmailUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenRepo: IAuthTokenRepository,
  ) {}

  async execute(input: { userId: string; token: string }): Promise<void> {
    const registro = await this.tokenRepo.findByHashAndTipo(hashToken(input.token), "email")
    if (!registro) throw new TokenInvalidoError()
    if (registro.usadoEm || registro.subjectId !== input.userId) throw new TokenInvalidoError()
    if (new Date(registro.expiraEm).getTime() < Date.now()) throw new TokenExpiradoError()

    await this.authRepo.confirmarEmail(input.userId)
    await this.tokenRepo.marcarUsado(registro.id, new Date().toISOString())
  }
}