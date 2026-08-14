import bcrypt from "bcryptjs"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import { SenhaAtualIncorretaError } from "../../../domain/errors/auth.error.js"

/**
 * Cancelamento de troca de e-mail pendente (PLAN-075 P-03/N5): exige senha atual,
 * limpa `email_pendente` e invalida o token `email` — e-mail atual permanece intacto.
 */
export class CancelarTrocaEmailUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenRepo: IAuthTokenRepository,
  ) {}

  async execute(input: { userId: string; senhaAtual: string }): Promise<void> {
    const usuario = await this.authRepo.findById(input.userId)
    if (!usuario) throw new SenhaAtualIncorretaError()
    if (!usuario.senhaHash) throw new SenhaAtualIncorretaError()

    const senhaValida = await bcrypt.compare(input.senhaAtual, usuario.senhaHash)
    if (!senhaValida) throw new SenhaAtualIncorretaError()

    await this.authRepo.setEmailPendente(usuario.id, null)
    await this.tokenRepo.invalidarPorTipo(usuario.id, "email")
  }
}