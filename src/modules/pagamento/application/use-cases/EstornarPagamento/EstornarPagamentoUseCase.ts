import { v4 as uuid } from "uuid"
import type { IContratoRepository } from "../../../../contrato/application/ports/contrato.repository.js"
import type { EstornarPagamentoInput } from "./EstornarPagamentoInput.js"
import { PagamentoNotFoundError, PagamentoJaEstornadoError } from "../../../domain/errors/estorno.error.js"
import { ContratoNotFoundError } from "../../../../contrato/domain/errors/contrato-not-found.error.js"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"

export class EstornarPagamentoUseCase {
  constructor(private contratoRepo: IContratoRepository) {}

  async execute(adminId: string, operadorId: string, pagamentoId: string, input: EstornarPagamentoInput) {
    const now = new Date()
    const data = getLocalDateString(now)
    const createdAt = now.toISOString()

    await this.contratoRepo.transaction(operadorId, async (repo, pagamentoRepo) => {
      const pagamento = await pagamentoRepo.findByIdWithParcelas(pagamentoId, operadorId)
      if (!pagamento) {
        throw new PagamentoNotFoundError(pagamentoId)
      }

      if (pagamento.estornadoEm) {
        throw new PagamentoJaEstornadoError()
      }

      const contrato = await repo.findByIdWithParcelas(operadorId, pagamento.contratoId)
      if (!contrato) {
        throw new ContratoNotFoundError(pagamento.contratoId)
      }

      let temSaldoPendente = false

      for (const rel of pagamento.parcelas) {
        const parcela = contrato.parcelas.find((p) => p.id === rel.parcelaId)
        if (!parcela) continue

        const novoValorPago = Math.round((parcela.valorPago - rel.valor) * 100) / 100
        const novoSaldo = Math.round((parcela.saldoPendente + rel.valor) * 100) / 100
        const novoEstado = novoValorPago <= 0 ? "Pendente" as const : novoSaldo > 0 ? "Parcial" as const : "Paga" as const

        if (novoSaldo > 0) temSaldoPendente = true

        await repo.updateParcela(operadorId, parcela.id, {
          valorPago: novoValorPago,
          saldoPendente: novoSaldo,
          estado: novoEstado,
          dataQuitacao: novoEstado === "Paga" ? parcela.dataQuitacao : null,
          updatedAt: createdAt,
        })
      }

      // Se o contrato foi finalizado por este pagamento e agora tem saldo pendente, volta a Ativo
      if (contrato.estado === "Finalizado" && temSaldoPendente) {
        await repo.update(operadorId, contrato.id, { estado: "Ativo", updatedAt: createdAt })
      }

      await pagamentoRepo.marcarEstornado(pagamentoId, adminId, input.motivo)

      const movId = uuid()
      await repo.saveMovimentacaoFinanceira(operadorId, {
        id: movId,
        tipo: "saida",
        valor: pagamento.valor,
        origem: "Cancelamento",
        origemId: pagamentoId,
        descricao: `Estorno do pagamento - R$ ${pagamento.valor.toFixed(2)} (${input.motivo})`,
        data,
        createdAt,
      })

      await pagamentoRepo.saveAuditoriaEstorno({
        id: uuid(),
        pagamentoId,
        operadorId,
        adminId,
        valor: pagamento.valor,
        motivo: input.motivo,
        data,
        createdAt,
      })
    })

    return { id: pagamentoId, data, createdAt }
  }
}
