import type { IContratoRepository } from "../../../../contrato/application/ports/contrato.repository.js"
import type { PreviewPagamentoInput } from "./PreviewPagamentoInput.js"
import { ContratoNotFoundError } from "../../../../contrato/domain/errors/contrato-not-found.error.js"
import { distribuirPagamento, type PreviewDistribuicao } from "../../../domain/services/distribuir-pagamento.js"

export class PreviewPagamentoUseCase {
  constructor(
    private contratoRepo: IContratoRepository
  ) {}

  async execute(userId: string, input: PreviewPagamentoInput): Promise<PreviewDistribuicao> {
    const contrato = await this.contratoRepo.findByIdWithParcelas(userId, input.contratoId)
    if (!contrato) {
      throw new ContratoNotFoundError(input.contratoId)
    }

    return distribuirPagamento(contrato.parcelas, input.valor)
  }
}
