import type { IClienteRepository } from "../../ports/cliente.repository.js"
import type { FindClientesQuery } from "./ListClientesQuery.js"

export class ListClientesUseCase {
  constructor(private readonly repository: IClienteRepository) {}

  async execute(userId: string, query: FindClientesQuery) {
    return this.repository.findAll(userId, query)
  }
}
