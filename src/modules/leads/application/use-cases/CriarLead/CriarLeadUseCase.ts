import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"
import type { IAuthRepository } from "../../../../auth/application/ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../../../auth/application/ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import { leadTemplate, type EmailLang } from "../../../../../shared/email/templates.js"
import { gerarToken, hashToken, expirarEm } from "../../../../auth/domain/auth-token.service.js"
import { LeadEmailJaUsuarioError } from "../../../domain/errors/lead.error.js"

/**
 * Cria um lead (público, `/quero-conhecer`) + e-mail de confirmação.
 * NÃO cria empresa/usuário/tenant (LD-05). Dedup por e-mail (LD-02).
 */
export class CriarLeadUseCase {
  constructor(private deps: { repo: ILeadRepository; authRepo: IAuthRepository; tokenRepo: IAuthTokenRepository; mailer: IMailer }) {}

  async execute(input: { nomeResponsavel: string; empresa: string; email: string; telefone?: string; origem?: string; lang?: EmailLang }): Promise<{ criado: boolean; lead?: Lead }> {
    const email = input.email.trim().toLowerCase()

    // Edge case: e-mail já é usuário/empresa existente → sem duplicado (LD-15).
    const jaUsuario = await this.deps.authRepo.findByEmail(email)
    if (jaUsuario && !jaUsuario.deletedAt) {
      throw new LeadEmailJaUsuarioError()
    }

    // Dedup: e-mail já tem lead → não cria (LD-02); front mostra mensagem amigável.
    const existente = await this.deps.repo.findByEmail(email)
    if (existente) {
      return { criado: false }
    }

    const lead = await this.deps.repo.create({
      nomeResponsavel: input.nomeResponsavel.trim(),
      empresa: input.empresa.trim(),
      email,
      telefone: input.telefone?.trim() || null,
      origem: input.origem ?? "Site",
    })

    const token = gerarToken()
    await this.deps.tokenRepo.invalidarPorTipo(lead.id, "lead")
    await this.deps.tokenRepo.create({ subjectId: lead.id, tipo: "lead", hash: hashToken(token), expiraEm: expirarEm("lead") })
    const link = `${appUrl()}/quero-conhecer/confirmar?token=${token}`
    await this.deps.mailer.send({ to: email, ...leadTemplate({ link, lang: input.lang ?? "pt-BR" }) })

    return { criado: true, lead }
  }
}
