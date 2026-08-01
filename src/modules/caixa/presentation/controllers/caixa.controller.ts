import type { Request, Response } from "express"
import { CaixaRepository } from "../../infrastructure/repositories/caixa.repository.impl.js"
import { AdminRepository } from "../../../admin/infrastructure/repositories/admin.repository.impl.js"
import { AjustarCaixaBaseUseCase } from "../../application/use-cases/AjustarCaixaBase/AjustarCaixaBaseUseCase.js"
import { ajustarCaixaBaseSchema } from "../../application/use-cases/AjustarCaixaBase/AjustarCaixaBaseInput.js"
import { ListarMovimentacoesUseCase } from "../../application/use-cases/ListarMovimentacoes/ListarMovimentacoesUseCase.js"
import { listarMovimentacoesSchema } from "../../application/use-cases/ListarMovimentacoes/ListarMovimentacoesInput.js"
import { LiquidarSemanaUseCase } from "../../application/use-cases/LiquidarSemana/LiquidarSemanaUseCase.js"
import { CaixaNotFoundError, SemanaJaLiquidadaError } from "../../domain/errors/caixa.error.js"
import { OperadorNaoEncontradoError } from "../../../admin/domain/errors/admin.error.js"
import { resolveUsuarioAlvo } from "../../../../shared/utils/scope.js"
import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"

export class CaixaController {
  private readonly repository: CaixaRepository
  private readonly adminRepository: AdminRepository
  private readonly ajustarUseCase: AjustarCaixaBaseUseCase
  private readonly listarUseCase: ListarMovimentacoesUseCase
  private readonly liquidarUseCase: LiquidarSemanaUseCase

  constructor(repository: CaixaRepository) {
    this.repository = repository
    this.adminRepository = new AdminRepository()
    this.ajustarUseCase = new AjustarCaixaBaseUseCase(repository)
    this.listarUseCase = new ListarMovimentacoesUseCase(repository)
    this.liquidarUseCase = new LiquidarSemanaUseCase(repository)
  }

  async getStatus(req: Request, res: Response) {
    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const repository = this.repository
      const caixa = await repository.getCaixaConfig(userId)

      const ultimaLiquidacao = await repository.getUltimaLiquidacao(userId)

      const hoje = new Date()
      const diaSemana = hoje.getDay()

      const queryDataInicio = req.query.dataInicio as string | undefined
      const queryDataFim = req.query.dataFim as string | undefined

      let dataInicio: string
      let dataFim: string

      if (queryDataInicio && queryDataFim) {
        dataInicio = queryDataInicio
        dataFim = queryDataFim
      } else if (ultimaLiquidacao) {
        const fim = new Date(ultimaLiquidacao.dataFim + "T00:00:00")
        fim.setDate(fim.getDate() + 1)
        dataInicio = getLocalDateString(fim)
        dataFim = getLocalDateString(hoje)
      } else {
        const domingo = new Date(hoje)
        domingo.setDate(hoje.getDate() - (diaSemana === 0 ? 0 : diaSemana))
        const segunda = new Date(domingo)
        segunda.setDate(domingo.getDate() - 6)
        dataInicio = getLocalDateString(segunda)
        dataFim = getLocalDateString(domingo)
      }

      const [recebidoSemana, gastosSemana, saldoAtual, aReceberHoje, recebidoHoje, vendasSemana, lucro] = await Promise.all([
        repository.getRecebidoSemana(userId, dataInicio, dataFim),
        repository.getGastoSemana(userId, dataInicio, dataFim),
        repository.getSaldoAtual(userId, ultimaLiquidacao ? dataInicio : undefined),
        repository.getAReceberHoje(userId),
        repository.getRecebidoHoje(userId),
        repository.getVendasSemana(userId, dataInicio, dataFim),
        repository.getLucro(userId),
      ])

      res.json({
        caixaBase: caixa?.caixaBase ?? 0,
        saldoAtual,
        lucro,
        aReceberHoje,
        recebidoHoje,
        recebidoSemana,
        vendasSemana,
        gastosSemana,
        resultadoSemana: recebidoSemana - gastosSemana,
        ultimaLiquidacao: ultimaLiquidacao?.dataFim ?? null,
        caixaUltimaLiquidacao: ultimaLiquidacao?.saldoFechamento ?? null,
      })
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      console.error("Erro ao buscar dados do Caixa:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao buscar dados do Caixa." })
    }
  }

  async ajustar(req: Request, res: Response) {
    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const parsed = ajustarCaixaBaseSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          code: "VALIDATION_ERROR",
          message: "Dados inválidos.",
          details: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        })
        return
      }

      const result = await this.ajustarUseCase.execute(userId, parsed.data)
      res.status(201).json(result)
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      if (error instanceof CaixaNotFoundError) {
        res.status(404).json({ code: error.code, message: error.message })
        return
      }
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao ajustar Caixa Base." })
    }
  }

  async listMovimentacoes(req: Request, res: Response) {
    try {
      const userId = await resolveUsuarioAlvo(req, this.adminRepository)
      const parsed = listarMovimentacoesSchema.safeParse(req.query)
      if (!parsed.success) {
        res.status(422).json({
          code: "VALIDATION_ERROR",
          message: "Dados inválidos.",
          details: parsed.error.errors.map((e) => ({ field: e.path.join("."), message: e.message })),
        })
        return
      }

      const result = await this.listarUseCase.execute(userId, parsed.data)
      res.json(result)
    } catch (error) {
      if (error instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: error.message })
        return
      }
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao listar movimentações." })
    }
  }

  async liquidar(req: Request, res: Response) {
    try {
      const userId = req.userId!
      const result = await this.liquidarUseCase.execute(userId)
      res.status(201).json(result)
    } catch (error) {
      if (error instanceof SemanaJaLiquidadaError) {
        res.status(409).json({ code: error.code, message: error.message })
        return
      }
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao liquidar semana." })
    }
  }
}
