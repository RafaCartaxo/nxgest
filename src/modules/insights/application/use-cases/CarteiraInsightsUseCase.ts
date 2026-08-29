import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"
import type { ResumoCarteira } from "../../domain/insights.entity.js"
import type { IInsightsRepository } from "../ports/insights.repository.js"

/**
 * Carteira/envelhecimento (classe 3 — snapshot do presente) + gastos por categoria
 * (classe 1) + contribuição de operadores (classe 1, composição sem placar) — PLAN-080 F2.
 */
export class CarteiraInsightsUseCase {
  constructor(private readonly repository: IInsightsRepository) {}

  async execute(userIds: string[]): Promise<ResumoCarteira> {
    const hoje = getLocalDateString(new Date())

    const [carteira, gastosPorCategoria, contribuicaoOperadores] = await Promise.all([
      this.repository.carteiraSnapshot(userIds, hoje),
      this.repository.gastosPorCategoria(userIds),
      this.repository.contribuicaoOperadores(userIds),
    ])

    return { carteira, gastosPorCategoria, contribuicaoOperadores }
  }
}