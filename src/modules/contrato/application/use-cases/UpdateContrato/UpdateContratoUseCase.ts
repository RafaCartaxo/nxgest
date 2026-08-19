import { v4 as uuid } from "uuid"
import type { IContratoRepository } from "../../ports/contrato.repository.js"
import type { TipoMovimentacao } from "../../../domain/contrato.entity.js"
import { gerarParcelas, calcularDataFinal } from "../../../domain/services/gerar-parcelas.js"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"
import { ContratoNotFoundError } from "../../../domain/errors/contrato-not-found.error.js"
import { ContratoHasPaymentsError } from "../../../domain/errors/contrato-has-payments.error.js"
import { ContratoSemanalDomingoError } from "../../../domain/errors/contrato-semanal-domingo.error.js"
import { SaldoInsuficienteError } from "../../../domain/errors/saldo-insuficiente.error.js"
import type { UpdateContratoInput } from "./UpdateContratoInput.js"

export class UpdateContratoUseCase {
  constructor(private readonly repository: IContratoRepository) {}

  async execute(userId: string, id: string, input: UpdateContratoInput) {
    const now = new Date().toISOString()
    const hoje = getLocalDateString(new Date())

    const result = await this.repository.transaction(userId, async (repo) => {
      const contrato = await repo.findById(userId, id)

      if (!contrato) {
        throw new ContratoNotFoundError(id)
      }

      const hasPayments = await repo.hasPayments(userId, id)
      if (hasPayments) {
        throw new ContratoHasPaymentsError(id)
      }

      const updated = {
        ...contrato,
        valorBase: input.valorBase ?? contrato.valorBase,
        percentualJuros: input.percentualJuros ?? contrato.percentualJuros,
        quantidadeParcelas:
          input.quantidadeParcelas ?? contrato.quantidadeParcelas,
        periodicidade: input.periodicidade ?? contrato.periodicidade,
        dataInicio: input.dataInicio ?? contrato.dataInicio,
        updatedAt: now,
      }

      // BR-040-A: contrato semanal não pode iniciar em domingo. Valida o valor
      // EFETIVO pós-merge (input.dataInicio ?? contrato.dataInicio) — o schema Zod
      // só valida quando dataInicio vem no request.
      if (updated.periodicidade === "semanal") {
        const dia = new Date(updated.dataInicio + "T12:00:00Z").getUTCDay()
        if (dia === 0) {
          throw new ContratoSemanalDomingoError()
        }
      }

      const diferencaBase =
        (input.valorBase ?? contrato.valorBase) - contrato.valorBase

      if (diferencaBase > 0) {
        const saldoAtual = await repo.getSaldoAtual(userId)
        if (saldoAtual < diferencaBase) {
          throw new SaldoInsuficienteError(
            saldoAtual,
            diferencaBase
          )
        }
      }

      updated.valorFinal =
        Math.round(
          updated.valorBase * (1 + updated.percentualJuros / 100) * 100
        ) / 100

      updated.dataFinal = calcularDataFinal(updated.dataInicio, updated.quantidadeParcelas, updated.periodicidade)

      const novasParcelas = gerarParcelas(
        id,
        updated.valorFinal,
        updated.quantidadeParcelas,
        updated.dataInicio,
        updated.periodicidade
      )

      await repo.update(userId, id, updated)
      await repo.softDeleteParcelasByContratoId(userId, id)
      await repo.saveParcelas(userId, novasParcelas)
      if (diferencaBase !== 0) {
        const tipo: TipoMovimentacao = diferencaBase > 0 ? "saida" : "entrada"
        const mov = {
          id: uuid(),
          tipo,
          valor: Math.abs(diferencaBase),
          origem: "Ajuste" as const,
          origemId: id,
          descricao: `Ajuste de valor base do contrato (${diferencaBase > 0 ? "+" : ""}R$ ${diferencaBase.toFixed(2)})`,
          data: hoje,
          createdAt: now,
        }
        await repo.saveMovimentacaoFinanceira(userId, mov)
      }

      return repo.findByIdWithParcelas(userId, id)
    })

    return result
  }
}
