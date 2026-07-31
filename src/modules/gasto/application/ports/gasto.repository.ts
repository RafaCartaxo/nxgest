import type { Gasto } from "../../domain/gasto.entity.js"

export interface ListGastosParams {
  dataInicio?: string
  dataFim?: string
  page?: number
  limit?: number
}

export interface ListGastosResult {
  data: Gasto[]
  totalPeriodo: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface IGastoRepository {
  save(userId: string, gasto: Gasto): Promise<void>
  findAll(userId: string, params: ListGastosParams): Promise<ListGastosResult>
  findById(userId: string, id: string): Promise<Gasto | null>
  softDelete(userId: string, id: string): Promise<void>
}
