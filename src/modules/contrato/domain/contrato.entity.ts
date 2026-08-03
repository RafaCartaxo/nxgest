export type EstadoContrato = "Ativo" | "Finalizado" | "Cancelado"

export type EstadoParcela = "Pendente" | "Parcial" | "Paga"

export type TipoMovimentacao = "entrada" | "saida"

export type OrigemMovimentacao =
  | "Contrato"
  | "Pagamento"
  | "Gasto"
  | "Cancelamento"
  | "Ajuste"

export interface Contrato {
  id: string
  clienteId: string
  clienteNome?: string
  valorBase: number
  percentualJuros: number
  valorFinal: number
  quantidadeParcelas: number
  dataInicio: string
  dataFinal: string
  estado: EstadoContrato
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  parcelasPagas?: number
  emAtraso?: number
  parcelasEmAtraso?: number
  diasEmAtraso?: number
}

export interface Parcela {
  id: string
  contratoId: string
  numero: number
  valorPrevisto: number
  valorPago: number
  saldoPendente: number
  estado: EstadoParcela
  dataVencimento: string
  dataQuitacao?: string | null
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface MovimentacaoFinanceira {
  id: string
  tipo: TipoMovimentacao
  valor: number
  origem: OrigemMovimentacao
  origemId: string
  descricao?: string | null
  data: string
  createdAt: string
}

export interface CaixaConfig {
  userId: string
  caixaBase: number
  updatedAt: string
}

export interface ContratoComParcelas extends Contrato {
  parcelas: Parcela[]
}
