import type { IClienteRepository } from "../../ports/cliente.repository.js"
import { ClienteNotFoundError } from "../../../domain/errors/cliente-not-found.error.js"
import { ClienteHasActiveContractsError } from "../../../domain/errors/cliente-has-active-contracts.error.js"

export class DeleteClienteUseCase {
  constructor(private readonly repository: IClienteRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    const cliente = await this.repository.findById(userId, id)

    if (!cliente) {
      throw new ClienteNotFoundError(id)
    }

    const hasContracts = await this.repository.hasActiveContracts(userId, id)

    if (hasContracts) {
      throw new ClienteHasActiveContractsError(id)
    }

    await this.repository.softDelete(userId, id)
  }
}
