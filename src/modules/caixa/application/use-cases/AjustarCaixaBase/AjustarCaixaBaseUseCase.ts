import type { ICaixaRepository } from "../../ports/caixa.repository.js"
import type { AjustarCaixaBaseInput } from "./AjustarCaixaBaseInput.js"

export class AjustarCaixaBaseUseCase {
  constructor(private readonly repository: ICaixaRepository) {}

  async execute(userId: string, input: AjustarCaixaBaseInput) {
    const caixa = await this.repository.getOrCreateCaixaConfig(userId)

    const diferenca = input.valor - caixa.caixaBase

    await this.repository.updateCaixaBase(userId, diferenca)

    const atualizado = await this.repository.getCaixaConfig(userId)
    return { caixaBase: atualizado!.caixaBase }
  }
}
