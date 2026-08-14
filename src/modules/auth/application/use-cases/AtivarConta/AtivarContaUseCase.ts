import bcrypt from "bcryptjs"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IConviteRepository } from "../../ports/convite.repository.js"
import { hashToken } from "../../../domain/auth-token.service.js"
import { TokenInvalidoError, TokenExpiradoError } from "../../../domain/errors/auth.error.js"

/**
 * Ativação de conta convidada (AC-05 / PLAN-075 N1.7): valida convite da tabela dedicada,
 * exige que `usuario.email == convite.email_alvo` (binding de posse), marca EXPIRADO no
 * lazy-expire (N1.10) e só então define a senha (P-04/P-05 — o acesso é criado pelo dono).
 */
export class AtivarContaUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly conviteRepo: IConviteRepository,
  ) {}

  async execute(input: { token: string; senha: string }): Promise<void> {
    const convite = await this.conviteRepo.findByHash(hashToken(input.token))
    if (!convite) throw new TokenInvalidoError()
    if (convite.status === "REVOGADO" || convite.usadoEm) throw new TokenInvalidoError()

    const vencido = new Date(convite.expiraEm).getTime() < Date.now()

    // EXPIRADO por invalidação (novo convite gerado — N2) vs vencimento real:
    // se ainda dentro de `expiraEm`, é link substituído → TOKEN_INVALID (semântica da
    // mensagem); se passou do prazo, é vencimento de verdade → TOKEN_EXPIRED.
    if (convite.status === "EXPIRADO") {
      if (vencido) throw new TokenExpiradoError()
      throw new TokenInvalidoError()
    }

    // Lazy-expire (N1.10): convite PENDENTE vencido é marcado na validação, não por cron.
    if (vencido) {
      await this.conviteRepo.marcarExpirado(convite.id)
      throw new TokenExpiradoError()
    }

    const usuario = await this.authRepo.findById(convite.usuarioId)
    if (!usuario) throw new TokenInvalidoError()

    // Binding email_alvo (N1.7): o e-mail do usuário precisa bater com o alvo do convite.
    if (usuario.email !== convite.emailAlvo) throw new TokenInvalidoError()

    const senhaHash = await bcrypt.hash(input.senha, 10)
    await this.authRepo.updateSenha(usuario.id, senhaHash)
    await this.conviteRepo.marcarUsado(convite.id, new Date().toISOString())
  }
}