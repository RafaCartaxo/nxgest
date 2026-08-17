export interface Pagamento {
  id: string
  contratoId: string
  valor: number
  data: string
  createdAt: string
  userId?: string | null
  estornadoEm?: string | null
  estornadoPor?: string | null
  estornoMotivo?: string | null
}

export interface PagamentoParcela {
  id: string
  pagamentoId: string
  parcelaId: string
  valor: number
  /** Número da parcela quitada (ex.: 3) — exposto via join com `parcelas`. */
  numero?: number
}

export interface PagamentoComDetalhes extends Pagamento {
  parcelas: PagamentoParcela[]
}
