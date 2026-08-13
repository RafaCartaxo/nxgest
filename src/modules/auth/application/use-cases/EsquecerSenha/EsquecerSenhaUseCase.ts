import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import { resetTemplate, type EmailLang } from "../../../../../shared/email/templates.js"
import { gerarToken, hashToken, expirarEm } from "../../../domain/auth-token.service.js"

/**
 * "Esqueci a senha": resposta SEMPRE genérica (200) — não revela se o e-mail
 * existe nem se a conta é convidada (ES-02/ES-03).
 */
export class EsquecerSenhaUseCase {
  constructor(
    private readonly authRepo: IAuthRepository,
    private readonly tokenRepo: IAuthTokenRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(input: { email: string; lang?: EmailLang }): Promise<void> {
    const usuario = await this.authRepo.findByEmail(input.email)
    if (!usuario || usuario.deletedAt || !usuario.senhaHash) return // convidado/inexistente → sem e-mail

    const token = gerarToken()
    await this.tokenRepo.invalidarPorTipo(usuario.id, "reset")
    await this.tokenRepo.create({ subjectId: usuario.id, tipo: "reset", hash: hashToken(token), expiraEm: expirarEm("reset") })
    const link = `${appUrl()}/resetar-senha?token=${token}`
    await this.mailer.send({ to: usuario.email, ...resetTemplate({ nome: usuario.nome, link, lang: input.lang ?? "pt-BR" }) })
  }
}
