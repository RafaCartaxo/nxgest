import { apiRequest } from "../../../api/client.js"

export interface CaixaStatus {
  caixaBase: number
  saldoAtual: number
  lucro: number
  aReceberHoje: number
  recebidoHoje: number
  recebidoSemana: number
  vendasSemana: number
  gastosSemana: number
  resultadoSemana: number
  ultimaLiquidacao: string | null
  caixaUltimaLiquidacao: number | null
}

export interface MovimentacaoItem {
  id: string
  tipo: "entrada" | "saida"
  valor: number
  origem: string
  origemId?: string
  descricao?: string | null
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

export interface AuditoriaCaixaItem {
  id: string
  operadorId: string
  adminId: string
  adminNome: string | null
  valorAnterior: number
  valorNovo: number
  motivo: string
  data: string
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export async function getCaixaStatus(dataInicio?: string, dataFim?: string, usuarioId?: string): Promise<CaixaStatus> {
  const qs = new URLSearchParams()
  if (dataInicio) qs.set("dataInicio", dataInicio)
  if (dataFim) qs.set("dataFim", dataFim)
  if (usuarioId) qs.set("usuarioId", usuarioId)
  const query = qs.toString()
  return apiRequest<CaixaStatus>("GET", `/caixa${query ? `?${query}` : ""}`)
}

export async function ajustarCaixaBase(valor: number, motivo: string, usuarioId?: string): Promise<{ caixaBase: number }> {
  const qs = usuarioId ? `?usuarioId=${usuarioId}` : ""
  return apiRequest<{ caixaBase: number }>("POST", `/caixa/ajuste${qs}`, { valor, motivo })
}

export async function listarMovimentacoes(params?: {
  dataInicio?: string
  dataFim?: string
  origem?: string
  page?: number
  limit?: number
}, usuarioId?: string): Promise<PaginatedResponse<MovimentacaoItem>> {
  const qs = new URLSearchParams()
  if (params?.dataInicio) qs.set("dataInicio", params.dataInicio)
  if (params?.dataFim) qs.set("dataFim", params.dataFim)
  if (params?.origem) qs.set("origem", params.origem)
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  if (usuarioId) qs.set("usuarioId", usuarioId)
  const query = qs.toString()
  return apiRequest<PaginatedResponse<MovimentacaoItem>>("GET", `/caixa/movimentacoes${query ? `?${query}` : ""}`)
}

export async function liquidarSemana(): Promise<FechamentoSemanal> {
  return apiRequest<FechamentoSemanal>("POST", "/caixa/liquidar")
}

export async function listarAuditoriaCaixa(params?: {
  page?: number
  limit?: number
}, usuarioId?: string): Promise<PaginatedResponse<AuditoriaCaixaItem>> {
  const qs = new URLSearchParams()
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  if (usuarioId) qs.set("usuarioId", usuarioId)
  const query = qs.toString()
  return apiRequest<PaginatedResponse<AuditoriaCaixaItem>>("GET", `/caixa/auditoria${query ? `?${query}` : ""}`)
}
