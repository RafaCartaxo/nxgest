export interface UltimoPagamentoInfo {
  data: string
  valor: number
}

export interface ClienteFinanceiroResumo {
  valorEmAtraso: number
  parcelasEmAtraso: number
  diasEmAtraso: number
  valorVenceHoje: number
  ultimoPagamento: UltimoPagamentoInfo | null
  lucroPrevisto: number
}

export interface IClienteFinanceiroQuery {
  resumoByClienteId(userId: string, clienteId: string): Promise<ClienteFinanceiroResumo>
}
