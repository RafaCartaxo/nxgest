import { v4 } from "uuid"
import type { IGastoRepository } from "../../ports/gasto.repository.js"
import type { ICaixaRepository } from "../../../../caixa/application/ports/caixa.repository.js"
import type { CreateGastoInput } from "./CreateGastoInput.js"

export class CreateGastoUseCase {
  constructor(
    private readonly gastoRepository: IGastoRepository,
    private readonly caixaRepository: ICaixaRepository,
  ) {}

  async execute(userId: string, input: CreateGastoInput) {
    const id = v4()
    const now = new Date().toISOString()

    const gasto = {
      id,
      valor: input.valor,
      categoria: input.categoria,
      observacao: input.observacao ?? null,
      data: input.data,
      createdAt: now,
    }

    await this.gastoRepository.save(userId, gasto)

    await this.caixaRepository.saveMovimentacaoFinanceira(userId, {
      id: v4(),
      tipo: "saida",
      valor: input.valor,
      origem: "Gasto",
      origemId: id,
      descricao: input.observacao,
      data: input.data,
      createdAt: now,
    })

    return gasto
  }
}
