import type { IContratoRepository } from "../../ports/contrato.repository.js"
import { ContratoNotFoundError } from "../../../domain/errors/contrato-not-found.error.js"

export class FindContratoUseCase {
  constructor(private readonly repository: IContratoRepository) {}

  async execute(userId: string, id: string) {
    const contrato = await this.repository.findByIdWithParcelas(userId, id)

    if (!contrato) {
      throw new ContratoNotFoundError(id)
    }

    return contrato
  }
}
