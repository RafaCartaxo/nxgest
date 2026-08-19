import type { Cliente } from "../../domain/cliente.entity.js"

export interface FindAllParams {
  nome?: string
  /** Busca multi-campo sem acento (nome/CPF/telefone/comércio) — PLAN-083 Fase 6. */
  q?: string
  page: number
  limit: number
  sort: string
  order: "asc" | "desc"
}

export interface FindAllResult {
  data: Cliente[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface IClienteRepository {
  save(userId: string, cliente: Cliente): Promise<void>
  findById(userId: string, id: string): Promise<Cliente | null>
  findByCpf(userId: string, cpf: string): Promise<Cliente | null>
  findAll(userId: string, params: FindAllParams): Promise<FindAllResult>
  update(userId: string, id: string, data: Partial<Cliente>): Promise<Cliente | null>
  softDelete(userId: string, id: string): Promise<void>
  hasActiveContracts(userId: string, clienteId: string): Promise<boolean>
}
