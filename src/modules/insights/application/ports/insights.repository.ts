import type { CarteiraSnapshot, ContribuicaoOperador, GastoCategoria } from "../../domain/insights.entity.js"

/** Agregados de insights — fonte única por gráfico (D13, padrão PLAN-083). */
export interface IInsightsRepository {
  /** Série de recebidos por data (classe 1 — event log de pagamentos). */
  recebidoPorData(userId: string, dataInicio: string, dataFim: string): Promise<Record<string, number>>
  /** Série de previsto por data (classe 2 — cronograma imutável das parcelas). */
  previstoPorData(userId: string, dataInicio: string, dataFim: string): Promise<Record<string, number>>
  /** Carteira/envelhecimento — snapshot do presente (classe 3). */
  carteiraSnapshot(userIds: string[], hoje: string): Promise<CarteiraSnapshot>
  /** Gastos por categoria (classe 1). */
  gastosPorCategoria(userIds: string[]): Promise<GastoCategoria[]>
  /** Contribuição de operadores (composição do total — classe 1, sem placar). */
  contribuicaoOperadores(userIds: string[]): Promise<ContribuicaoOperador[]>
  /** UserIds de uma empresa (admin/super — escopo por empresa). */
  userIdsDaEmpresa(empresaId: string): Promise<string[]>
}

export type { CarteiraSnapshot, ContribuicaoOperador, GastoCategoria }