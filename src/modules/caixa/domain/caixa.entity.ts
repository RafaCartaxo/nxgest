export interface CaixaConfig {
  userId: string
  caixaBase: number
  updatedAt: string
}

export type TipoMovimentacao = "entrada" | "saida"

export type OrigemMovimentacao = "Contrato" | "Pagamento" | "Gasto" | "Cancelamento" | "Ajuste"

export interface MovimentacaoFinanceira {
  id: string
  tipo: TipoMovimentacao
  valor: number
  origem: OrigemMovimentacao
  origemId?: string
  descricao?: string
  clienteNome?: string | null
  categoria?: string
  data: string
  createdAt: string
}

export interface FechamentoSemanal {
  id: string
  dataInicio: string
  dataFim: string
  totalRecebido: number
  totalGasto: number
  resultado: number
  caixaBase: number
  saldoFechamento: number
  createdAt: string
}
