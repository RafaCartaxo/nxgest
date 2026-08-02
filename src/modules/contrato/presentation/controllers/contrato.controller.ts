import type { Request, Response } from "express"
import { CreateContratoUseCase } from "../../application/use-cases/CreateContrato/CreateContratoUseCase.js"
import { createContratoSchema } from "../../application/use-cases/CreateContrato/CreateContratoInput.js"
import { FindContratoUseCase } from "../../application/use-cases/FindContrato/FindContratoUseCase.js"
import { ListContratosUseCase } from "../../application/use-cases/ListContratos/ListContratosUseCase.js"
import { findContratosQuerySchema } from "../../application/use-cases/ListContratos/ListContratosQuery.js"
import { UpdateContratoUseCase } from "../../application/use-cases/UpdateContrato/UpdateContratoUseCase.js"
import { updateContratoSchema } from "../../application/use-cases/UpdateContrato/UpdateContratoInput.js"
import { DeleteContratoUseCase } from "../../application/use-cases/DeleteContrato/DeleteContratoUseCase.js"
import type { IContratoRepository } from "../../application/ports/contrato.repository.js"
import type { IClienteExistenceQuery } from "../../application/ports/cliente-existence.query.js"
import { AdminRepository } from "../../../admin/infrastructure/repositories/admin.repository.impl.js"
import { ContratoNotFoundError } from "../../domain/errors/contrato-not-found.error.js"
import { ContratoHasPaymentsError } from "../../domain/errors/contrato-has-payments.error.js"
import { SaldoInsuficienteError } from "../../domain/errors/saldo-insuficiente.error.js"
import { ClienteNotFoundError } from "../../../../modules/cliente/domain/errors/cliente-not-found.error.js"
import { OperadorNaoEncontradoError } from "../../../admin/domain/errors/admin.error.js"
import { resolveUsuarioAlvo } from "../../../../shared/utils/scope.js"

export class ContratoController {
  private createContrato: CreateContratoUseCase
  private findContrato: FindContratoUseCase
  private listContratos: ListContratosUseCase
  private updateContrato: UpdateContratoUseCase
  private deleteContrato: DeleteContratoUseCase
  private adminRepository: AdminRepository

  constructor(
    repository: IContratoRepository,
    clienteExistenceQuery: IClienteExistenceQuery
  ) {
    this.createContrato = new CreateContratoUseCase(
      repository,
      clienteExistenceQuery
    )
    this.findContrato = new FindContratoUseCase(repository)
    this.listContratos = new ListContratosUseCase(repository)
    this.updateContrato = new UpdateContratoUseCase(repository)
    this.deleteContrato = new DeleteContratoUseCase(repository)
    this.adminRepository = new AdminRepository()
  }

  async create(req: Request, res: Response) {
    const parsed = createContratoSchema.safeParse(req.body)
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
      const userId = req.userId!
      const contrato = await this.createContrato.execute(userId, parsed.data)
      res.status(201).json(contrato)
    } catch (error) {
      if (error instanceof SaldoInsuficienteError) {
        res.status(422).json({ code: error.code, message: error.message })
        return
      }
      if (error instanceof ClienteNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      console.error("Erro ao criar contrato:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao criar contrato." })
    }
  }

  async list(req: Request, res: Response) {
    const parsed = findContratosQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      res.status(422).json({
        code: "VALIDATION_ERROR",
        message: "Parâmetros inválidos.",
        details: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      })
      return
    }

    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const result = await this.listContratos.execute(userId, parsed.data)
      res.status(200).json({ data: result.data, pagination: result.pagination })
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      console.error("Erro ao listar contratos:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar contratos." })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const contrato = await this.findContrato.execute(userId, req.params.id)
      res.status(200).json(contrato)
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      if (error instanceof ContratoNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      console.error("Erro ao buscar contrato:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao buscar contrato." })
    }
  }

  async update(req: Request, res: Response) {
    const parsed = updateContratoSchema.safeParse(req.body)
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
      const userId = req.userId!
      const contrato = await this.updateContrato.execute(
        userId,
        req.params.id,
        parsed.data
      )
      res.status(200).json(contrato)
    } catch (error) {
      if (error instanceof ContratoNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      if (error instanceof ContratoHasPaymentsError) {
        res.status(409).json({ code: error.code, message: error.message })
        return
      }
      if (error instanceof SaldoInsuficienteError) {
        res.status(422).json({ code: error.code, message: error.message })
        return
      }
      console.error("Erro ao atualizar contrato:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao atualizar contrato." })
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const userId = req.userId!
      await this.deleteContrato.execute(userId, req.params.id)
      res.status(204).send()
    } catch (error) {
      if (error instanceof ContratoNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      if (error instanceof ContratoHasPaymentsError) {
        res.status(409).json({ code: error.code, message: error.message })
        return
      }
      console.error("Erro ao excluir contrato:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao excluir contrato." })
    }
  }
}
