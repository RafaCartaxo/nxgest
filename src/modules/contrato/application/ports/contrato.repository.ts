import type {
  Contrato,
  Parcela,
  ContratoComParcelas,
  CaixaConfig,
  MovimentacaoFinanceira,
} from "../../domain/contrato.entity.js"
import type { IPagamentoRepository } from "../../../pagamento/application/ports/pagamento.repository.js"

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

export interface ParcelaUpdateLote {
  id: string
  valorPago: number
  saldoPendente: number
  estado: Parcela["estado"]
  dataQuitacao: string | null
  updatedAt: string
}

export interface IContratoRepository {
  save(userId: string, contrato: Contrato): Promise<void>
  saveParcelas(userId: string, parcelas: Parcela[]): Promise<void>
  updateParcelasEmLote(userId: string, updates: ParcelaUpdateLote[]): Promise<void>
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

  /**
   * Executa `fn` dentro de uma transação real (PostgreSQL — PLAN-070).
   * O callback recebe os dois repositórios **ligados à transação** (contrato + pagamento):
   * qualquer escrita fora deles (repo de pool) NÃO participa da transação — atomicidade
   * exige usar os repos passados aqui (pagamento/estorno mutam o agregado contrato+pagamento).
   */
  transaction<T>(userId: string, fn: (repo: IContratoRepository, pagamentoRepo: IPagamentoRepository) => Promise<T>): Promise<T>
  getSaldoAtual(userId: string): Promise<number>
}
