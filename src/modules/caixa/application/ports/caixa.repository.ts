import type { CaixaConfig, MovimentacaoFinanceira, FechamentoSemanal } from "../../domain/caixa.entity.js"

export interface AuditoriaCaixa {
  id: string
  operadorId: string
  adminId: string
  valorAnterior: number
  valorNovo: number
  motivo: string
  data: string
  createdAt: string
}

export interface AuditoriaCaixaItem extends AuditoriaCaixa {
  adminNome: string | null
}

export interface ListarAuditoriaCaixaResult {
  data: AuditoriaCaixaItem[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface ListMovimentacoesParams {
  dataInicio?: string
  dataFim?: string
  origem?: string
  page?: number
  limit?: number
}

export interface ListMovimentacoesResult {
  data: MovimentacaoFinanceira[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

/** Agregados de caixa numa única query (PLAN-083 Fase 1 — reduz round trips de `/caixa/status`). */
export interface FluxoConsolidado {
  /** Somatório de movimentações `tipo='entrada'` (histórico total). */
  entradas: number
  /** Somatório de movimentações `tipo='saida'` (histórico total). */
  saidas: number
  /** Entradas a partir de `dataInicio` (ou total, se sem filtro). */
  entradasDesde: number
  /** Saídas a partir de `dataInicio` (ou total, se sem filtro). */
  saidasDesde: number
  /** Soma das movimentações `origem='Pagamento'` no período. */
  recebidoSemana: number
  /** Soma das movimentações `origem='Gasto'` no período. */
  gastoSemana: number
}

export interface ICaixaRepository {
  getCaixaConfig(userId: string): Promise<CaixaConfig | null>
  getOrCreateCaixaConfig(userId: string): Promise<CaixaConfig>
  updateCaixaBase(userId: string, valor: number): Promise<void>
  saveMovimentacaoFinanceira(userId: string, m: MovimentacaoFinanceira): Promise<void>
  listMovimentacoes(userId: string, params: ListMovimentacoesParams): Promise<ListMovimentacoesResult>
  getRecebidoSemana(userId: string, dataInicio: string, dataFim: string): Promise<number>
  getGastoSemana(userId: string, dataInicio: string, dataFim: string): Promise<number>
  /** Agregados de caixa em 1 query (PLAN-083) — entradas/saídas + semana num único scan. */
  getFluxoConsolidado(userId: string, dataInicio?: string, dataFim?: string): Promise<FluxoConsolidado>
  getSaldoAtual(userId: string, dataInicio?: string): Promise<number>
  getAReceberHoje(userId: string): Promise<number>
  getRecebidoHoje(userId: string): Promise<number>
  getVendasSemana(userId: string, dataInicio: string, dataFim: string): Promise<number>
  getUltimaLiquidacao(userId: string): Promise<FechamentoSemanal | null>
  getLucro(userId: string): Promise<number>
  /** Persiste o fechamento; retorna `false` se já existir (UNIQUE userId+período — G14). */
  saveFechamentoSemanal(userId: string, f: FechamentoSemanal): Promise<boolean>
  findFechamentoPorPeriodo(userId: string, dataInicio: string, dataFim: string): Promise<FechamentoSemanal | null>
  saveAuditoriaCaixa(a: AuditoriaCaixa): Promise<void>
  listAuditoriaCaixa(operadorId: string, params: { page?: number; limit?: number }): Promise<ListarAuditoriaCaixaResult>
}
