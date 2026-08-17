import { apiRequest } from "../../../api/client.js"

export interface Pagamento {
  id: string
  contratoId: string
  valor: number
  data: string
  createdAt: string
}

export interface PagamentoParcela {
  id: string
  pagamentoId: string
  parcelaId: string
  valor: number
  /** Número da parcela quitada (ex.: 3). */
  numero?: number
}

export interface PagamentoComDetalhes extends Pagamento {
  parcelas: PagamentoParcela[]
  estornadoEm?: string | null
  estornadoPor?: string | null
  estornoMotivo?: string | null
}

export interface ItemPreview {
  numero: number
  valorPrevisto: number
  saldoPendenteAtual: number
  valorAplicado: number
  saldoRestante: number
  estadoPrevisto: "Pendente" | "Parcial" | "Paga"
}

export interface PreviewDistribuicao {
  valorInformado: number
  saldoDevedor: number
  parcelas: ItemPreview[]
  saldoExcedente: number
  todasPagas: boolean
}

export async function createPagamento(data: {
  contratoId: string
  valor: number
}): Promise<Pagamento> {
  return apiRequest<Pagamento>("POST", "/pagamentos", data)
}

export async function previewPagamento(data: {
  contratoId: string
  valor: number
}): Promise<PreviewDistribuicao> {
  return apiRequest<PreviewDistribuicao>("POST", "/pagamentos/preview", data)
}

export async function listPagamentos(
  contratoId: string,
  usuarioId?: string
): Promise<PagamentoComDetalhes[]> {
  const qs = usuarioId ? `?usuarioId=${usuarioId}` : ""
  return apiRequest<PagamentoComDetalhes[]>(
    "GET",
    `/pagamentos/contrato/${contratoId}${qs}`
  )
}

export async function estornarPagamento(
  pagamentoId: string,
  motivo: string,
  usuarioId?: string
): Promise<{ id: string; data: string; createdAt: string }> {
  const qs = usuarioId ? `?usuarioId=${usuarioId}` : ""
  return apiRequest(
    "POST",
    `/pagamentos/${pagamentoId}/estornar${qs}`,
    { motivo }
  )
}
