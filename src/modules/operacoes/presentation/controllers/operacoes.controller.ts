import type { Request, Response } from "express"
import { ListarCobrancasDoDiaUseCase } from "../../application/use-cases/ListarCobrancasDoDia/ListarCobrancasDoDiaUseCase.js"
import { ListarPagamentosDoDiaUseCase } from "../../application/use-cases/ListarPagamentosDoDia/ListarPagamentosDoDiaUseCase.js"
import { ListarParcelasHojeUseCase } from "../../application/use-cases/ListarParcelasHoje/ListarParcelasHojeUseCase.js"
import { ListarParcelasSemanaUseCase } from "../../application/use-cases/ListarParcelasSemana/ListarParcelasSemanaUseCase.js"
import { RegistrarVisitaUseCase } from "../../application/use-cases/RegistrarVisita/RegistrarVisitaUseCase.js"
import { ListarHistoricoAtrasosUseCase } from "../../application/use-cases/ListarHistoricoAtrasos/ListarHistoricoAtrasosUseCase.js"
import type { RegistrarVisitaInput } from "../../application/ports/operacoes.repository.js"

export class OperacoesController {
  constructor(
    private listarCobrancas: ListarCobrancasDoDiaUseCase,
    private listarPagamentosDoDia: ListarPagamentosDoDiaUseCase,
    private listarParcelasHoje: ListarParcelasHojeUseCase,
    private listarParcelasSemana: ListarParcelasSemanaUseCase,
    private registrarVisita: RegistrarVisitaUseCase,
    private listarHistoricoAtrasos: ListarHistoricoAtrasosUseCase,
  ) {}

  async cobrancas(req: Request, res: Response) {
    try {
      const userId = req.userId!
      const sort = req.query.sort as string | undefined
      const lat = req.query.lat ? Number(req.query.lat) : undefined
      const lng = req.query.lng ? Number(req.query.lng) : undefined

      const operadorLat = sort === "distancia" && !isNaN(lat as number) ? lat : undefined
      const operadorLng = sort === "distancia" && !isNaN(lng as number) ? lng : undefined

      const result = await this.listarCobrancas.execute(userId, operadorLat, operadorLng)
      res.status(200).json(result)
    } catch (error) {
      console.error("Erro ao listar cobranças do dia:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar cobranças." })
    }
  }

  async pagamentosHoje(req: Request, res: Response) {
    try {
      const userId = req.userId!
      const dataInicio = req.query.dataInicio as string | undefined
      const dataFim = req.query.dataFim as string | undefined
      const result = await this.listarPagamentosDoDia.execute(userId, dataInicio, dataFim)
      res.status(200).json(result)
    } catch (error) {
      console.error("Erro ao listar pagamentos:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar pagamentos." })
    }
  }

  async parcelasHoje(_req: Request, res: Response) {
    try {
      const userId = _req.userId!
      const result = await this.listarParcelasHoje.execute(userId)
      res.status(200).json(result)
    } catch (error) {
      console.error("Erro ao listar parcelas do dia:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar parcelas." })
    }
  }

  async parcelasSemana(_req: Request, res: Response) {
    try {
      const userId = _req.userId!
      const result = await this.listarParcelasSemana.execute(userId)
      res.status(200).json(result)
    } catch (error) {
      console.error("Erro ao listar parcelas da semana:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar parcelas da semana." })
    }
  }

  async historicoAtrasos(req: Request, res: Response) {
    try {
      const userId = req.userId!
      const dias = req.query.dias ? Number(req.query.dias) : undefined
      const result = await this.listarHistoricoAtrasos.execute(userId, dias)
      res.status(200).json(result)
    } catch (error) {
      console.error("Erro ao listar histórico de atrasos:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao listar histórico de atrasos." })
    }
  }

  async visitas(req: Request, res: Response) {
    try {
      const userId = req.userId!
      const { clienteId, contratoId, tipo, dataPromessa } = req.body

      if (!clienteId || !contratoId || !tipo) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "clienteId, contratoId e tipo são obrigatórios." })
        return
      }

      if (!["visitado", "nao_localizado", "promessa"].includes(tipo)) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "tipo deve ser visitado, nao_localizado ou promessa." })
        return
      }

      if (tipo === "promessa" && !dataPromessa) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "dataPromessa é obrigatória quando tipo é promessa." })
        return
      }

      const input: RegistrarVisitaInput = {
        clienteId,
        contratoId,
        tipo,
        dataPromessa: dataPromessa ?? null,
      }

      const result = await this.registrarVisita.execute(userId, input)
      res.status(201).json(result)
    } catch (error) {
      console.error("Erro ao registrar visita:", error)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno ao registrar visita." })
    }
  }
}
