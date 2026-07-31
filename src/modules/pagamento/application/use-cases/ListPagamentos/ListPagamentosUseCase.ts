import type { IPagamentoRepository } from "../../ports/pagamento.repository.js"

export class ListPagamentosUseCase {
  constructor(private pagamentoRepo: IPagamentoRepository) {}

  async execute(contratoId: string, userId: string) {
    return this.pagamentoRepo.findByContratoId(contratoId, userId)
  }
}
