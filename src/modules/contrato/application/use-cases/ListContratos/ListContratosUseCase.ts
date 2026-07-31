import type { IContratoRepository } from "../../ports/contrato.repository.js"
import type { FindContratosQuery } from "./ListContratosQuery.js"

export class ListContratosUseCase {
  constructor(private readonly repository: IContratoRepository) {}

  async execute(userId: string, query: FindContratosQuery) {
    return this.repository.findAll(userId, query)
  }
}
