import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"
import { LeadNaoEncontradoError, LeadStatusInvalidoError } from "../../../domain/errors/lead.error.js"

/** Marca o lead como EM_ONBOARDING (LD-10) — só super admin. */
export class IniciarOnboardingUseCase {
  constructor(private repo: ILeadRepository) {}

  async execute(id: string): Promise<Lead> {
    const lead = await this.repo.findById(id)
    if (!lead) throw new LeadNaoEncontradoError()
    if (lead.status === "CONVERTIDO" || lead.status === "DESCARTADO") throw new LeadStatusInvalidoError()
    const atualizado = await this.repo.updateStatus(id, "EM_ONBOARDING")
    return atualizado!
  }
}
