export class PagamentoNotFoundError extends Error {
  code = "PAGAMENTO_NOT_FOUND"
  constructor(pagamentoId: string) {
    super(`Pagamento não encontrado: ${pagamentoId}`)
  }
}

export class PagamentoJaEstornadoError extends Error {
  code = "PAGAMENTO_JA_ESTORNADO"
  constructor() {
    super("Este pagamento já foi estornado.")
  }
}
