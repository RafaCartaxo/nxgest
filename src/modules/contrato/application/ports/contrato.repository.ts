import type {
  Contrato,
  Parcela,
  ContratoComParcelas,
  CaixaConfig,
  MovimentacaoFinanceira,
} from "../../domain/contrato.entity.js"

export interface FindAllParams {
  clienteId?: string
  dataInicio?: string
  dataFim?: string
  page: number
  limit: number
  sort: string
  order: "asc" | "desc"
}

export interface FindAllResult {
  data: Contrato[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface IContratoRepository {
  save(userId: string, contrato: Contrato): Promise<void>
  saveParcela(userId: string, parcela: Parcela): Promise<void>
  updateParcela(userId: string, id: string, data: Partial<Parcela>): Promise<void>
  findById(userId: string, id: string): Promise<Contrato | null>
  findByIdWithParcelas(userId: string, id: string): Promise<ContratoComParcelas | null>
  findAll(userId: string, params: FindAllParams): Promise<FindAllResult>
  findParcelasByContratoId(userId: string, contratoId: string): Promise<Parcela[]>
  update(userId: string, id: string, data: Partial<Contrato>): Promise<Contrato | null>
  softDelete(userId: string, id: string): Promise<void>
  softDeleteParcelasByContratoId(userId: string, contratoId: string): Promise<void>
  hasPayments(userId: string, contratoId: string): Promise<boolean>
  getCaixaConfig(userId: string): Promise<CaixaConfig | null>
  updateCaixaBase(userId: string, valor: number): Promise<void>
  saveMovimentacaoFinanceira(userId: string, mov: MovimentacaoFinanceira): Promise<void>

  transaction<T>(userId: string, fn: (repo: IContratoRepository) => Promise<T>): Promise<T>
  getSaldoAtual(userId: string): Promise<number>
}
