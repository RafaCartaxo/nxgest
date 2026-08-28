import { apiRequest } from "../../../api/client.js"

export type Periodicidade = "diaria" | "semanal" | "alternada"

export interface Parcela {
  id: string
  contratoId: string
  numero: number
  valorPrevisto: number
  valorPago: number
  saldoPendente: number
  estado: "Pendente" | "Parcial" | "Paga"
  dataVencimento: string
  dataQuitacao?: string | null
  createdAt: string
  updatedAt: string
}

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
  periodicidade: Periodicidade
  estado: "Ativo" | "Finalizado"
  parcelas?: Parcela[]
  saldoPendente?: number
  parcelasPagas?: number
  emAtraso?: number
  parcelasEmAtraso?: number
  diasEmAtraso?: number
  createdAt: string
  updatedAt: string
}

export interface ListContratosParams {
  clienteId?: string
  dataInicio?: string
  dataFim?: string
  page?: number
  limit?: number
  sort?: string
  order?: "asc" | "desc"
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

export async function createContrato(
  data: Record<string, unknown>
): Promise<Contrato> {
  return apiRequest<Contrato>("POST", "/contratos", data)
}

export async function listContratos(
  params?: ListContratosParams,
  usuarioId?: string
): Promise<PaginatedResponse<Contrato>> {
  const searchParams = new URLSearchParams()
  if (params?.clienteId) searchParams.set("clienteId", params.clienteId)
  if (params?.dataInicio) searchParams.set("dataInicio", params.dataInicio)
  if (params?.dataFim) searchParams.set("dataFim", params.dataFim)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.sort) searchParams.set("sort", params.sort)
  if (params?.order) searchParams.set("order", params.order)
  if (usuarioId) searchParams.set("usuarioId", usuarioId)
  const query = searchParams.toString()
  return apiRequest<PaginatedResponse<Contrato>>(
    "GET",
    `/contratos${query ? `?${query}` : ""}`
  )
}

export async function getContrato(id: string, usuarioId?: string): Promise<Contrato> {
  const qs = usuarioId ? `?usuarioId=${usuarioId}` : ""
  return apiRequest<Contrato>("GET", `/contratos/${id}${qs}`)
}

export async function updateContrato(
  id: string,
  data: Record<string, unknown>
): Promise<Contrato> {
  return apiRequest<Contrato>("PATCH", `/contratos/${id}`, data)
}

export async function deleteContrato(id: string): Promise<void> {
  return apiRequest<void>("DELETE", `/contratos/${id}`)
}
