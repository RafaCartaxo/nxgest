import { apiRequest } from "../../../api/client.js"

export interface Cliente {
  id: string
  nome: string
  cpf?: string
  comercio?: string
  telefone: string
  telefoneComercio?: string
  endereco: {
    logradouro: string
    numero?: string
    complemento?: string
    bairro?: string
    cidade?: string
    estado?: string
  }
  enderecoComercio?: {
    logradouro?: string
    numero?: string
    bairro?: string
    cidade?: string
    estado?: string
  } | null
  localizacaoComercio?: { lat: number; lng: number } | null
  totalContratos?: number
  saldoDevedor?: number
  valorEmAtraso?: number
  parcelasEmAtraso?: number
  diasEmAtraso?: number
  valorVenceHoje?: number
  ultimoPagamento?: { data: string; valor: number } | null
  lucroPrevisto?: number
  createdAt: string
  updatedAt: string
}

export interface ListClientesParams {
  nome?: string
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

export async function createCliente(
  data: Record<string, unknown>
): Promise<Cliente> {
  return apiRequest<Cliente>("POST", "/clientes", data)
}

export async function listClientes(
  params?: ListClientesParams
): Promise<PaginatedResponse<Cliente>> {
  const searchParams = new URLSearchParams()

  if (params?.nome) searchParams.set("nome", params.nome)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.limit) searchParams.set("limit", String(params.limit))
  if (params?.sort) searchParams.set("sort", params.sort)
  if (params?.order) searchParams.set("order", params.order)

  const query = searchParams.toString()
  return apiRequest<PaginatedResponse<Cliente>>(
    "GET",
    `/clientes${query ? `?${query}` : ""}`
  )
}

export async function getCliente(id: string, usuarioId?: string): Promise<Cliente> {
  const qs = usuarioId ? `?usuarioId=${usuarioId}` : ""
  return apiRequest<Cliente>("GET", `/clientes/${id}${qs}`)
}

export async function updateCliente(
  id: string,
  data: Record<string, unknown>
): Promise<Cliente> {
  return apiRequest<Cliente>("PATCH", `/clientes/${id}`, data)
}

export async function deleteCliente(id: string): Promise<void> {
  return apiRequest<void>("DELETE", `/clientes/${id}`)
}
