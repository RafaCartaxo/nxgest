import { v4 as uuid } from "uuid"
import type { IContratoRepository } from "../../ports/contrato.repository.js"
import { ContratoNotFoundError } from "../../../domain/errors/contrato-not-found.error.js"
import { ContratoHasPaymentsError } from "../../../domain/errors/contrato-has-payments.error.js"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"

export class DeleteContratoUseCase {
  constructor(private readonly repository: IContratoRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    const now = new Date().toISOString()
    const hoje = getLocalDateString(new Date())

    await this.repository.transaction(userId, async (repo) => {
      const contrato = await repo.findById(userId, id)

      if (!contrato) {
        throw new ContratoNotFoundError(id)
      }

      const hasPayments = await repo.hasPayments(userId, id)
      if (hasPayments) {
        throw new ContratoHasPaymentsError(id)
      }

      const movimentacao = {
        id: uuid(),
        tipo: "entrada" as const,
        valor: contrato.valorBase,
        origem: "Cancelamento" as const,
        origemId: id,
        descricao: `Estorno por exclusão do contrato - valor base: R$ ${contrato.valorBase.toFixed(2)}`,
        data: hoje,
        createdAt: now,
      }

      await repo.softDelete(userId, id)
      await repo.softDeleteParcelasByContratoId(userId, id)
      await repo.saveMovimentacaoFinanceira(userId, movimentacao)
    })
  }
}
