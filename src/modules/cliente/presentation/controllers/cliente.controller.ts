import type { Request, Response } from "express"
import { CreateClienteUseCase } from "../../application/use-cases/CreateCliente/CreateClienteUseCase.js"
import { createClienteSchema } from "../../application/use-cases/CreateCliente/CreateClienteInput.js"
import { FindClienteUseCase } from "../../application/use-cases/FindCliente/FindClienteUseCase.js"
import { ListClientesUseCase } from "../../application/use-cases/ListClientes/ListClientesUseCase.js"
import { findClientesQuerySchema } from "../../application/use-cases/ListClientes/ListClientesQuery.js"
import { UpdateClienteUseCase } from "../../application/use-cases/UpdateCliente/UpdateClienteUseCase.js"
import { updateClienteSchema } from "../../application/use-cases/UpdateCliente/UpdateClienteInput.js"
import { DeleteClienteUseCase } from "../../application/use-cases/DeleteCliente/DeleteClienteUseCase.js"
import type { IClienteRepository } from "../../application/ports/cliente.repository.js"
import type { IContratoCountQuery } from "../../application/ports/contrato-count.query.js"
import type { IClienteSaldoQuery } from "../../application/ports/cliente-saldo.query.js"
import type { IClienteFinanceiroQuery } from "../../application/ports/cliente-financeiro.query.js"
import { ClienteNotFoundError } from "../../domain/errors/cliente-not-found.error.js"
import { ClienteHasActiveContractsError } from "../../domain/errors/cliente-has-active-contracts.error.js"
import { CpfDuplicadoError } from "../../domain/errors/cpf-duplicado.error.js"
import { AdminRepository } from "../../../admin/infrastructure/repositories/admin.repository.impl.js"
import { OperadorNaoEncontradoError } from "../../../admin/domain/errors/admin.error.js"
import { resolveUsuarioAlvo } from "../../../../shared/utils/scope.js"

export class ClienteController {
  private createCliente: CreateClienteUseCase
  private findCliente: FindClienteUseCase
  private listClientes: ListClientesUseCase
  private updateCliente: UpdateClienteUseCase
  private deleteCliente: DeleteClienteUseCase
  private adminRepository: AdminRepository

  constructor(
    repository: IClienteRepository,
    contratoCountQuery?: IContratoCountQuery,
    clienteSaldoQuery?: IClienteSaldoQuery,
    clienteFinanceiroQuery?: IClienteFinanceiroQuery
  ) {
    this.createCliente = new CreateClienteUseCase(repository)
    this.findCliente = new FindClienteUseCase(repository, contratoCountQuery, clienteSaldoQuery, clienteFinanceiroQuery)
    this.listClientes = new ListClientesUseCase(repository)
    this.updateCliente = new UpdateClienteUseCase(repository)
    this.deleteCliente = new DeleteClienteUseCase(repository)
    this.adminRepository = new AdminRepository()
  }

  async create(req: Request, res: Response) {
    const parsed = createClienteSchema.safeParse(req.body)

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
      const cliente = await this.createCliente.execute(req.userId!, parsed.data)
      res.status(201).json(cliente)
    } catch (error) {
      if (error instanceof CpfDuplicadoError) {
        res.status(409).json({ code: error.code, message: error.message })
        return
      }

      console.error("Erro ao criar cliente:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao criar cliente." })
    }
  }

  async list(req: Request, res: Response) {
    const parsed = findClientesQuerySchema.safeParse(req.query)

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
      // PLAN-063 (P13): escopo hierárquico na LISTA — admin/socio/super resolvem o
      // operador-alvo via `?usuarioId=` (+ `?empresaId=` p/ super); operator vê os próprios.
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const result = await this.listClientes.execute(userId, parsed.data)

      res.status(200).json({
        data: result.data,
        pagination: result.pagination,
      })
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      console.error("Erro ao listar clientes:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar clientes." })
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const cliente = await this.findCliente.execute(userId, req.params.id)

      res.status(200).json(cliente)
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      if (error instanceof ClienteNotFoundError) {
        res.status(404).json({
          code: error.code,
          message: error.message,
        })
        return
      }

      console.error("Erro ao buscar cliente:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao buscar cliente." })
    }
  }

  async update(req: Request, res: Response) {
    const parsed = updateClienteSchema.safeParse(req.body)

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
      const cliente = await this.updateCliente.execute(req.userId!, req.params.id, parsed.data)

      res.status(200).json(cliente)
    } catch (error) {
      if (error instanceof ClienteNotFoundError) {
        res.status(404).json({
          code: error.code,
          message: error.message,
        })
        return
      }

      if (error instanceof CpfDuplicadoError) {
        res.status(409).json({ code: error.code, message: error.message })
        return
      }

      console.error("Erro ao atualizar cliente:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao atualizar cliente." })
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.deleteCliente.execute(req.userId!, req.params.id)

      res.status(204).send()
    } catch (error) {
      if (error instanceof ClienteNotFoundError) {
        res.status(404).json({
          code: error.code,
          message: error.message,
        })
        return
      }

      if (error instanceof ClienteHasActiveContractsError) {
        res.status(409).json({
          code: error.code,
          message: error.message,
        })
        return
      }

      console.error("Erro ao excluir cliente:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao excluir cliente." })
    }
  }
}
