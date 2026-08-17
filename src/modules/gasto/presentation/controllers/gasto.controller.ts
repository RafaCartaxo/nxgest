import type { Request, Response } from "express"
import { getParam } from "../../../../shared/utils/routeParam.js"
import { GastoRepository } from "../../infrastructure/repositories/gasto.repository.impl.js"
import { CaixaRepository } from "../../../caixa/infrastructure/repositories/caixa.repository.impl.js"
import { CreateGastoUseCase } from "../../application/use-cases/CreateGasto/CreateGastoUseCase.js"
import { createGastoSchema } from "../../application/use-cases/CreateGasto/CreateGastoInput.js"
import { ListGastosUseCase } from "../../application/use-cases/ListGastos/ListGastosUseCase.js"
import { listGastosSchema } from "../../application/use-cases/ListGastos/ListGastosInput.js"
import { DeleteGastoUseCase } from "../../application/use-cases/DeleteGasto/DeleteGastoUseCase.js"
import { GastoNotFoundError } from "../../domain/errors/gasto.error.js"

export class GastoController {
  private readonly createUseCase: CreateGastoUseCase
  private readonly listUseCase: ListGastosUseCase
  private readonly deleteUseCase: DeleteGastoUseCase

  constructor(gastoRepository: GastoRepository, caixaRepository: CaixaRepository) {
    this.createUseCase = new CreateGastoUseCase(gastoRepository, caixaRepository)
    this.listUseCase = new ListGastosUseCase(gastoRepository)
    this.deleteUseCase = new DeleteGastoUseCase(gastoRepository)
  }

  async create(req: Request, res: Response) {
    try {
      const parsed = createGastoSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          code: "VALIDATION_ERROR",
          message: "Dados inválidos.",
          details: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        })
        return
      }

      const result = await this.createUseCase.execute(req.userId!, parsed.data)
      res.status(201).json(result)
    } catch (error) {
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao registrar gasto." })
    }
  }

  async list(req: Request, res: Response) {
    try {
      const parsed = listGastosSchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(422).json({
          code: "VALIDATION_ERROR",
          message: "Dados inválidos.",
          details: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        })
        return
      }

      const result = await this.listUseCase.execute(req.userId!, parsed.data)
      res.json(result)
    } catch (error) {
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao listar gastos." })
    }
  }

  async remove(req: Request, res: Response) {
    try {
      await this.deleteUseCase.execute(req.userId!, getParam(req, "id"))
      res.status(204).send()
    } catch (error) {
      if (error instanceof GastoNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao excluir gasto." })
    }
  }
}
