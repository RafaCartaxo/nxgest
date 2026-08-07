import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import { conviteTemplate, type EmailLang } from "../../../../../shared/email/templates.js"
import { gerarToken, hashToken, expirarEm } from "../../../domain/auth-token.service.js"

export class ConvidarUseCase {
  constructor(
    private readonly tokenRepo: IAuthTokenRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(input: { subjectId: string; nome: string; email: string; lang?: EmailLang }): Promise<void> {
    const token = gerarToken()
    // Reenvio invalida tokens anteriores do mesmo tipo (SE-04).
    await this.tokenRepo.invalidarPorTipo(input.subjectId, "convite")
    await this.tokenRepo.create({ subjectId: input.subjectId, tipo: "convite", hash: hashToken(token), expiraEm: expirarEm("convite") })
    const link = `${appUrl()}/ativar?token=${token}`
    await this.mailer.send({ to: input.email, ...conviteTemplate({ nome: input.nome, link, lang: input.lang ?? "pt-BR" }) })
  }
}
