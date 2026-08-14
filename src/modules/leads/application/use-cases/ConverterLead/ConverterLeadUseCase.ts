import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"
import type { CriarEmpresaUseCase } from "../../../../admin/application/use-cases/CriarEmpresa/CriarEmpresaUseCase.js"
import type { ConvidarUseCase } from "../../../../auth/application/use-cases/Convidar/ConvidarUseCase.js"
import type { EmailLang } from "../../../../../shared/email/templates.js"
import { LeadNaoEncontradoError, LeadStatusInvalidoError } from "../../../domain/errors/lead.error.js"

/**
 * Conversão (LD-11): Lead → Empresa + Administrador (convite) + auditoria (quem/quando).
 * Reusa o fluxo existente de criação de empresa (PLAN-065/075 R6): admin sempre convidado.
 * Só aceita lead com e-mail confirmado (EMAIL_CONFIRMADO) ou em onboarding.
 */
export class ConverterLeadUseCase {
  constructor(private deps: { repo: ILeadRepository; criarEmpresa: CriarEmpresaUseCase; convidar: ConvidarUseCase }) {}

  async execute(input: { id: string; por: string; lang?: EmailLang }): Promise<{ lead: Lead; empresaId: string }> {
    const lead = await this.deps.repo.findById(input.id)
    if (!lead) throw new LeadNaoEncontradoError()
    if (lead.status !== "EMAIL_CONFIRMADO" && lead.status !== "EM_ONBOARDING") throw new LeadStatusInvalidoError()
    if (!lead.email) throw new LeadStatusInvalidoError()

    const { empresa, admin } = await this.deps.criarEmpresa.execute({
      nome: lead.empresa,
      adminNome: lead.nomeResponsavel,
      adminEmail: lead.email,
      adminTelefone: lead.telefone ?? null, // F7: telefone do lead vira telefone do admin
      origem: lead.origem, // F7: origem declarada no lead
      emailContato: lead.email,
      telefoneContato: lead.telefone ?? null,
    })

    await this.deps.convidar.execute({
      subjectId: admin.id,
      nome: admin.nome,
      email: admin.email,
      role: "admin",
      lang: input.lang ?? "pt-BR",
      criadoPor: null,
    })

    const atualizado = await this.deps.repo.marcarConvertido(lead.id, { empresaId: empresa.id, por: input.por })
    return { lead: atualizado!, empresaId: empresa.id }
  }
}
