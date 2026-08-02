import { randomUUID } from "node:crypto"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"
import type { ICaixaRepository } from "../../ports/caixa.repository.js"
import type { AjustarCaixaBaseInput } from "./AjustarCaixaBaseInput.js"

export class AjustarCaixaBaseUseCase {
  constructor(private readonly repository: ICaixaRepository) {}

  async execute(adminId: string, operadorId: string, input: AjustarCaixaBaseInput) {
    const caixa = await this.repository.getOrCreateCaixaConfig(operadorId)

    const valorAnterior = caixa.caixaBase
    const diferenca = input.valor - valorAnterior

    await this.repository.updateCaixaBase(operadorId, diferenca)

    const atualizado = await this.repository.getCaixaConfig(operadorId)

    const now = new Date().toISOString()
    await this.repository.saveAuditoriaCaixa({
      id: randomUUID(),
      operadorId,
      adminId,
      valorAnterior,
      valorNovo: input.valor,
      motivo: input.motivo,
      data: getLocalDateString(new Date()),
      createdAt: now,
    })

    return { caixaBase: atualizado!.caixaBase }
  }
}