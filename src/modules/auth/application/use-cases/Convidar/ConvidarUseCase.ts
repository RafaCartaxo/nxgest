import type { IConviteRepository } from "../../ports/convite.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import { conviteTemplate, type EmailLang } from "../../../../../shared/email/templates.js"
import { gerarToken, hashToken, expirarEm } from "../../../domain/auth-token.service.js"

/**
 * Envio de convite (PLAN-075): cria linha em `convites` (token vive na própria tabela —
 * N2) invalidando convites PENDENTE anteriores na mesma transação (invariante "um único
 * convite válido"). `role_alvo` é apenas informativo/auditoria (N1.2); `email_alvo` é o
 * vínculo de posse validado na ativação (N1.7).
 */
export class ConvidarUseCase {
  constructor(
    private readonly conviteRepo: IConviteRepository,
    private readonly mailer: IMailer,
  ) {}

  async execute(input: {
    subjectId: string
    nome: string
    email: string
    role?: string | null
    lang?: EmailLang
    criadoPor?: string | null
    empresaNome?: string | null
    convidadoPor?: string | null
  }): Promise<void> {
    const token = gerarToken()
    const convite = await this.conviteRepo.create({
      usuarioId: input.subjectId,
      emailAlvo: input.email,
      criadoPor: input.criadoPor ?? null,
      roleAlvo: input.role ?? null,
      idioma: input.lang ?? "pt-BR",
      tokenHash: hashToken(token),
      expiraEm: expirarEm("convite"),
    })
    const link = `${appUrl()}/ativar?token=${token}`
    await this.mailer.send({
      to: input.email,
      ...conviteTemplate({
        nome: input.nome,
        link,
        lang: convite.idioma as EmailLang,
        empresaNome: input.empresaNome,
        convidadoPor: input.convidadoPor,
      }),
    })
  }
}