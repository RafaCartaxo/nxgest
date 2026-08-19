import type { Pagamento, PagamentoParcela, PagamentoComDetalhes } from "../../domain/pagamento.entity.js"

export interface AuditoriaEstorno {
  id: string
  pagamentoId: string
  operadorId: string
  adminId: string
  valor: number
  motivo: string
  data: string
  createdAt: string
}

export interface IPagamentoRepository {
  save(pagamento: Pagamento, userId: string): Promise<void>
  savePagamentoParcelas(relacoes: PagamentoParcela[], userId: string): Promise<void>
  findByContratoId(contratoId: string, userId: string): Promise<PagamentoComDetalhes[]>
  findByIdWithParcelas(pagamentoId: string, userId: string): Promise<PagamentoComDetalhes | null>
  marcarEstornado(pagamentoId: string, adminId: string, motivo: string): Promise<void>
  saveAuditoriaEstorno(a: AuditoriaEstorno): Promise<void>
}
