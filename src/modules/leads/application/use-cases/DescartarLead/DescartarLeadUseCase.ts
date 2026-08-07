import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"
import { LeadNaoEncontradoError, LeadStatusInvalidoError } from "../../../domain/errors/lead.error.js"

/**
 * Descarte (LD-12): marca DESCARTADO + anonimiza dados pessoais (LGPD) e registra
 * motivo/quem/quando. E-mail vira marcador anônimo único (preserva dedup futuro).
 */
export class DescartarLeadUseCase {
  constructor(private repo: ILeadRepository) {}

  async execute(input: { id: string; por: string; motivo: string }): Promise<Lead> {
    const lead = await this.repo.findById(input.id)
    if (!lead) throw new LeadNaoEncontradoError()
    if (lead.status === "CONVERTIDO") throw new LeadStatusInvalidoError()
    const atualizado = await this.repo.descartar(lead.id, { por: input.por, motivo: input.motivo })
    return atualizado!
  }
}
