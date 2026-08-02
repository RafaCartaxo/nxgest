import type { Request, Response } from "express"
import { CreatePagamentoUseCase } from "../../application/use-cases/CreatePagamento/CreatePagamentoUseCase.js"
import { createPagamentoSchema } from "../../application/use-cases/CreatePagamento/CreatePagamentoInput.js"
import { PreviewPagamentoUseCase } from "../../application/use-cases/PreviewPagamento/PreviewPagamentoUseCase.js"
import { previewPagamentoSchema } from "../../application/use-cases/PreviewPagamento/PreviewPagamentoInput.js"
import { ListPagamentosUseCase } from "../../application/use-cases/ListPagamentos/ListPagamentosUseCase.js"
import { EstornarPagamentoUseCase } from "../../application/use-cases/EstornarPagamento/EstornarPagamentoUseCase.js"
import { estornarPagamentoSchema } from "../../application/use-cases/EstornarPagamento/EstornarPagamentoInput.js"
import type { IPagamentoRepository } from "../../application/ports/pagamento.repository.js"
import type { IContratoRepository } from "../../../contrato/application/ports/contrato.repository.js"
import { AdminRepository } from "../../../admin/infrastructure/repositories/admin.repository.impl.js"
import { ContratoNotFoundError } from "../../../contrato/domain/errors/contrato-not-found.error.js"
import { SaldoInsuficienteError } from "../../../contrato/domain/errors/saldo-insuficiente.error.js"
import { PagamentoNotFoundError, PagamentoJaEstornadoError } from "../../domain/errors/estorno.error.js"
import { OperadorNaoEncontradoError } from "../../../admin/domain/errors/admin.error.js"
import { resolveUsuarioAlvo } from "../../../../shared/utils/scope.js"

export class PagamentoController {
  private createPagamento: CreatePagamentoUseCase
  private previewPagamento: PreviewPagamentoUseCase
  private listPagamentos: ListPagamentosUseCase
  private estornarPagamento: EstornarPagamentoUseCase
  private adminRepository: AdminRepository

  constructor(
    pagamentoRepo: IPagamentoRepository,
    contratoRepo: IContratoRepository
  ) {
    this.createPagamento = new CreatePagamentoUseCase(pagamentoRepo, contratoRepo)
    this.previewPagamento = new PreviewPagamentoUseCase(contratoRepo)
    this.listPagamentos = new ListPagamentosUseCase(pagamentoRepo)
    this.estornarPagamento = new EstornarPagamentoUseCase(pagamentoRepo, contratoRepo)
    this.adminRepository = new AdminRepository()
  }

  async create(req: Request, res: Response) {
    const parsed = createPagamentoSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(422).json({
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      })
      return
    }

    try {
      const pagamento = await this.createPagamento.execute(req.userId!, parsed.data)
      res.status(201).json(pagamento)
    } catch (error) {
      if (error instanceof ContratoNotFoundError) {
        res.status(404).json({ code: error.code, message: "Contrato não encontrado." })
        return
      }
      if (error instanceof SaldoInsuficienteError) {
        res.status(422).json({ code: error.code, message: "O valor informado excede o saldo devedor do contrato." })
        return
      }
      console.error("Erro ao registrar pagamento:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao registrar pagamento." })
    }
  }

  async preview(req: Request, res: Response) {
    const parsed = previewPagamentoSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(422).json({
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      })
      return
    }

    try {
      const result = await this.previewPagamento.execute(req.userId!, parsed.data)
      res.status(200).json(result)
    } catch (error) {
      if (error instanceof ContratoNotFoundError) {
        res.status(404).json({ code: error.code, message: "Contrato não encontrado." })
        return
      }
      console.error("Erro ao calcular prévia:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao calcular prévia." })
    }
  }

  async listByContrato(req: Request, res: Response) {
    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const pagamentos = await this.listPagamentos.execute(req.params.contratoId, userId)
      res.status(200).json(pagamentos)
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      console.error("Erro ao listar pagamentos:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar pagamentos." })
    }
  }

  async estornar(req: Request, res: Response) {
    const parsed = estornarPagamentoSchema.safeParse(req.body)
    if (!parsed.success) {
      res.status(422).json({
        code: "VALIDATION_ERROR",
        message: "Dados inválidos.",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      })
      return
    }

    try {
      const operadorId = await resolveUsuarioAlvo(req, this.adminRepository)
      const adminId = req.userId!
      const result = await this.estornarPagamento.execute(adminId, operadorId, req.params.id, parsed.data)
      res.status(201).json(result)
    } catch (error) {
      if (error instanceof PagamentoNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      if (error instanceof PagamentoJaEstornadoError) {
        res.status(409).json({ code: error.code, message: error.message })
        return
      }
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      console.error("Erro ao estornar pagamento:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao estornar pagamento." })
    }
  }
}
