import bcrypt from "bcryptjs"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import { hashToken } from "../../../domain/auth-token.service.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../domain/errors/auth.error.js"

/** Ativação de conta convidada: valida token de convite + define a senha (AC-05). */
export class AtivarContaUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenRepo: IAuthTokenRepository,
  ) {}

  async execute(input: { token: string; senha: string }): Promise<void> {
    const registro = await this.tokenRepo.findByHashAndTipo(hashToken(input.token), "convite")
    if (!registro) throw new TokenInvalidoError()
    if (registro.usadoEm) throw new TokenInvalidoError()
    if (new Date(registro.expiraEm).getTime() < Date.now()) throw new TokenExpiradoError()

    const usuario = await this.authRepo.findById(registro.subjectId)
    if (!usuario) throw new TokenInvalidoError()

    const senhaHash = await bcrypt.hash(input.senha, 10)
    await this.authRepo.updateSenha(usuario.id, senhaHash)
    await this.tokenRepo.marcarUsado(registro.id, new Date().toISOString())
  }
}
