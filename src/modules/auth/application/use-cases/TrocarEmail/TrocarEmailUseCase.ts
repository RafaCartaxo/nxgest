import bcrypt from "bcryptjs"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import { verificarEmailTemplate, type EmailLang } from "../../../../../shared/email/templates.js"
import { gerarToken, hashToken, expirarEm } from "../../../domain/auth-token.service.js"
import { SenhaAtualIncorretaError, EmailDuplicadoError } from "../../../domain/errors/auth.error.js"

/**
 * Troca de e-mail self-service (PLAN-075 F4/N5): exige senha atual, valida duplicidade
 * (`email` + `email_pendente` de terceiros), grava `email_pendente` e emite token `email`
 * (24h). Re-solicitar com pendência viva invalida o token anterior (só o último link vale).
 */
export class TrocarEmailUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenRepo: IAuthTokenRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(input: { userId: string; novoEmail: string; senhaAtual: string; lang?: EmailLang }): Promise<void> {
    const usuario = await this.authRepo.findById(input.userId)
    if (!usuario) throw new SenhaAtualIncorretaError()

    // Garantia: conta convidada (sem senha) não troca e-mail por este fluxo.
    if (!usuario.senhaHash) throw new SenhaAtualIncorretaError()

    const senhaValida = await bcrypt.compare(input.senhaAtual, usuario.senhaHash)
    if (!senhaValida) throw new SenhaAtualIncorretaError()

    const novoEmail = input.novoEmail.trim().toLowerCase()
    // CT-36: troca para o próprio e-mail atual (case-insensitive — o BD pode ter mixed-case
    // legado) não gera alteração desnecessária.
    if (novoEmail === (usuario.email ?? "").trim().toLowerCase()) {
      return
    }

    const emUso = await this.authRepo.emailEmUso(novoEmail, usuario.id)
    if (emUso) throw new EmailDuplicadoError()

    await this.authRepo.setEmailPendente(usuario.id, novoEmail)

    const token = gerarToken()
    await this.tokenRepo.invalidarPorTipo(usuario.id, "email")
    await this.tokenRepo.create({ subjectId: usuario.id, tipo: "email", hash: hashToken(token), expiraEm: expirarEm("email") })

    const link = `${appUrl()}/verificar-email?token=${token}`
    await this.mailer.send({ to: novoEmail, ...verificarEmailTemplate({ link, lang: input.lang ?? "pt-BR", novoEmail }) })
  }
}