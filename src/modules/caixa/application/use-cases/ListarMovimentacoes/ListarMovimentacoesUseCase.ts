import type { ICaixaRepository } from "../../ports/caixa.repository.js"
import type { ListarMovimentacoesInput } from "./ListarMovimentacoesInput.js"

export class ListarMovimentacoesUseCase {
  constructor(private readonly repository: ICaixaRepository) {}

  async execute(userId: string, input: ListarMovimentacoesInput) {
    return this.repository.listMovimentacoes(userId, input)
  }
}
