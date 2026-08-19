import { v4 as uuid } from "uuid"
import type { IContratoRepository } from "../../ports/contrato.repository.js"
import type { IClienteExistenceQuery } from "../../ports/cliente-existence.query.js"
import { gerarParcelas, calcularDataFinal } from "../../../domain/services/gerar-parcelas.js"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"
import { SaldoInsuficienteError } from "../../../domain/errors/saldo-insuficiente.error.js"
import { ClienteNotFoundError } from "../../../../cliente/domain/errors/cliente-not-found.error.js"
import type { CreateContratoInput } from "./CreateContratoInput.js"

export class CreateContratoUseCase {
  constructor(
    private readonly repository: IContratoRepository,
    private readonly clienteExistenceQuery: IClienteExistenceQuery
  ) {}

  async execute(userId: string, input: CreateContratoInput) {
    const now = new Date().toISOString()
    const hoje = getLocalDateString(new Date())
    const valorFinal =
      Math.round(
        input.valorBase * (1 + input.percentualJuros / 100) * 100
      ) / 100

    const contratoId = uuid()
    const parcelas = gerarParcelas(
      contratoId,
      valorFinal,
      input.quantidadeParcelas,
      input.dataInicio,
      input.periodicidade
    )

    await this.repository.transaction(userId, async (repo) => {
      const clienteExiste = await this.clienteExistenceQuery.exists(userId, input.clienteId)
      if (!clienteExiste) {
        throw new ClienteNotFoundError(input.clienteId)
      }

      const saldoAtual = await repo.getSaldoAtual(userId)
      if (saldoAtual < input.valorBase) {
        throw new SaldoInsuficienteError(
          saldoAtual,
          input.valorBase
        )
      }

      const contrato = {
        id: contratoId,
        clienteId: input.clienteId,
        valorBase: input.valorBase,
        percentualJuros: input.percentualJuros,
        valorFinal,
        quantidadeParcelas: input.quantidadeParcelas,
        dataInicio: input.dataInicio,
        dataFinal: calcularDataFinal(input.dataInicio, input.quantidadeParcelas, input.periodicidade),
        periodicidade: input.periodicidade,
        estado: "Ativo" as const,
        createdAt: now,
        updatedAt: now,
      }

      const movimentacao = {
        id: uuid(),
        tipo: "saida" as const,
        valor: input.valorBase,
        origem: "Contrato" as const,
        origemId: contrato.id,
        descricao: `Criação de contrato - ${input.quantidadeParcelas}x R$ ${(
          valorFinal / input.quantidadeParcelas
        ).toFixed(2)}`,
        data: hoje,
        createdAt: now,
      }

      await repo.save(userId, contrato)
      await repo.saveParcelas(userId, parcelas)
      await repo.saveMovimentacaoFinanceira(userId, movimentacao)
    })

    return {
      id: contratoId,
      clienteId: input.clienteId,
      valorBase: input.valorBase,
      percentualJuros: input.percentualJuros,
      valorFinal,
      quantidadeParcelas: input.quantidadeParcelas,
      dataInicio: input.dataInicio,
      dataFinal: calcularDataFinal(input.dataInicio, input.quantidadeParcelas, input.periodicidade),
      periodicidade: input.periodicidade,
      estado: "Ativo" as const,
      createdAt: now,
      updatedAt: now,
      parcelas,
    }
  }
}
