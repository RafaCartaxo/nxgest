import bcrypt from "bcryptjs"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import { hashToken } from "../../../domain/auth-token.service.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../domain/errors/auth.error.js"

/** Redefine a senha via token de reset (ES-05). */
export class RedefinirSenhaUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenRepo: IAuthTokenRepository,
  ) {}

  async execute(input: { token: string; senha: string }): Promise<void> {
    const registro = await this.tokenRepo.findByHashAndTipo(hashToken(input.token), "reset")
    if (!registro) throw new TokenInvalidoError()
    if (registro.usadoEm) throw new TokenInvalidoError()
    if (new Date(registro.expiraEm).getTime() < Date.now()) throw new TokenExpiradoError()

    const senhaHash = await bcrypt.hash(input.senha, 10)
    await this.authRepo.updateSenha(registro.subjectId, senhaHash)
    await this.tokenRepo.marcarUsado(registro.id, new Date().toISOString())
  }
}
