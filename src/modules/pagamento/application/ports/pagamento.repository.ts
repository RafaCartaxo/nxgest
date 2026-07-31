import type { Pagamento, PagamentoParcela, PagamentoComDetalhes } from "../../domain/pagamento.entity.js"

export interface IPagamentoRepository {
  save(pagamento: Pagamento, userId: string): Promise<void>
  savePagamentoParcela(relacao: PagamentoParcela, userId: string): Promise<void>
  findByContratoId(contratoId: string, userId: string): Promise<PagamentoComDetalhes[]>
}
