import type { IGastoRepository } from "../../ports/gasto.repository.js"
import type { ListGastosInput } from "./ListGastosInput.js"

export class ListGastosUseCase {
  constructor(private readonly repository: IGastoRepository) {}

  async execute(userId: string, input: ListGastosInput) {
    return this.repository.findAll(userId, input)
  }
}
