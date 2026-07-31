import { v4 } from "uuid"
import type { ICaixaRepository } from "../../ports/caixa.repository.js"
import { SemanaJaLiquidadaError } from "../../../domain/errors/caixa.error.js"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"

export class LiquidarSemanaUseCase {
  constructor(private readonly repository: ICaixaRepository) {}

  async execute(userId: string) {
    const hoje = new Date()
    const diaSemana = hoje.getDay()

    const domingo = new Date(hoje)
    domingo.setDate(hoje.getDate() - (diaSemana === 0 ? 0 : diaSemana))

    const segunda = new Date(domingo)
    segunda.setDate(domingo.getDate() - 6)

    const dataInicio = getLocalDateString(segunda)
    const dataFim = getLocalDateString(domingo)

    const existente = await this.repository.findFechamentoPorPeriodo(userId, dataInicio, dataFim)
    if (existente) throw new SemanaJaLiquidadaError()

    const caixa = await this.repository.getCaixaConfig(userId)
    const caixaBase = caixa?.caixaBase ?? 0

    const ultimo = await this.repository.getUltimaLiquidacao(userId)
    const baseFechamento = ultimo?.saldoFechamento ?? caixaBase

    const [totalRecebido, totalGasto] = await Promise.all([
      this.repository.getRecebidoSemana(userId, dataInicio, dataFim),
      this.repository.getGastoSemana(userId, dataInicio, dataFim),
    ])

    const resultado = totalRecebido - totalGasto
    const saldoFechamento = baseFechamento + resultado
    const now = new Date().toISOString()

    const fechamento = {
      id: v4(),
      dataInicio,
      dataFim,
      totalRecebido,
      totalGasto,
      resultado,
      caixaBase,
      saldoFechamento,
      createdAt: now,
    }

    await this.repository.saveFechamentoSemanal(userId, fechamento)
    return fechamento
  }
}
