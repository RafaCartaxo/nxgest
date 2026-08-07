import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { IAuthTokenRepository } from "../../../../auth/application/ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import { leadTemplate, type EmailLang } from "../../../../../shared/email/templates.js"
import { gerarToken, hashToken, expirarEm } from "../../../../auth/domain/auth-token.service.js"

/** Reenviar confirmação de e-mail (LD-07) — resposta sempre genérica (não vaza existência). */
export class ReenviarConfirmacaoUseCase {
  constructor(private repo: ILeadRepository, private tokenRepo: IAuthTokenRepository, private mailer: IMailer) {}

  async execute(input: { email: string; lang?: EmailLang }): Promise<void> {
    const lead = await this.repo.findByEmail(input.email.trim().toLowerCase())
    if (!lead || !lead.email || lead.status === "CONVERTIDO" || lead.status === "DESCARTADO") return

    const token = gerarToken()
    await this.tokenRepo.invalidarPorTipo(lead.id, "lead")
    await this.tokenRepo.create({ subjectId: lead.id, tipo: "lead", hash: hashToken(token), expiraEm: expirarEm("lead") })
    const link = `${appUrl()}/quero-conhecer/confirmar?token=${token}`
    await this.mailer.send({ to: lead.email, ...leadTemplate({ link, lang: input.lang ?? "pt-BR" }) })
  }
}
