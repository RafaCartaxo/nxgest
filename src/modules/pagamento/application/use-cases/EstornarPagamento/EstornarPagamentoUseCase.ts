import { v4 as uuid } from "uuid"
import type { IPagamentoRepository } from "../../ports/pagamento.repository.js"
import type { IContratoRepository } from "../../../../contrato/application/ports/contrato.repository.js"
import type { EstornarPagamentoInput } from "./EstornarPagamentoInput.js"
import { PagamentoNotFoundError, PagamentoJaEstornadoError } from "../../../domain/errors/estorno.error.js"
import { ContratoNotFoundError } from "../../../../contrato/domain/errors/contrato-not-found.error.js"
import { getLocalDateString } from "../../../../../shared/utils/parseDateLocal.js"

export class EstornarPagamentoUseCase {
  constructor(
    private pagamentoRepo: IPagamentoRepository,
    private contratoRepo: IContratoRepository
  ) {}

  async execute(adminId: string, operadorId: string, pagamentoId: string, input: EstornarPagamentoInput) {
    const now = new Date()
    const data = getLocalDateString(now)
    const createdAt = now.toISOString()

    await this.contratoRepo.transaction(operadorId, async (repo) => {
      const pagamento = await this.pagamentoRepo.findByIdWithParcelas(pagamentoId, operadorId)
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

      for (const rel of pagamento.parcelas) {
        const parcela = contrato.parcelas.find((p) => p.id === rel.parcelaId)
        if (!parcela) continue

        const novoValorPago = Math.round((parcela.valorPago - rel.valor) * 100) / 100
        const novoSaldo = Math.round((parcela.saldoPendente + rel.valor) * 100) / 100
        const novoEstado = novoValorPago <= 0 ? "Pendente" as const : novoSaldo > 0 ? "Parcial" as const : "Paga" as const

        await repo.updateParcela(operadorId, parcela.id, {
          valorPago: novoValorPago,
          saldoPendente: novoSaldo,
          estado: novoEstado,
          dataQuitacao: novoValorPago <= 0 ? null : parcela.dataQuitacao,
          updatedAt: createdAt,
        })
      }

      // Se o contrato foi finalizado por este pagamento e agora tem saldo pendente, volta a Ativo
      if (contrato.estado === "Finalizado") {
        const saldoRestante = contrato.parcelas.some((p) => p.saldoPendente > 0)
        if (saldoRestante) {
          await repo.update(operadorId, contrato.id, { estado: "Ativo", updatedAt: createdAt })
        }
      }

      await this.pagamentoRepo.marcarEstornado(pagamentoId, adminId, input.motivo)

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

      await this.pagamentoRepo.saveAuditoriaEstorno({
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
