import type { IOperacoesRepository, PagamentoDoDiaItem } from "../../ports/operacoes.repository.js"

export class ListarPagamentosDoDiaUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, dataInicio?: string, dataFim?: string): Promise<PagamentoDoDiaItem[]> {
    return this.repo.listarPagamentosDoDia(userId, dataInicio, dataFim)
  }
}
