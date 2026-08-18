import type { Request, Response } from "express"
import type { IGithubGateway } from "../../application/ports/github-gateway.port.js"
import { ListarRunsUseCase } from "../../application/use-cases/ListarRuns/ListarRunsUseCase.js"
import { ListarPRsUseCase } from "../../application/use-cases/ListarPRs/ListarPRsUseCase.js"
import { ListarDependabotUseCase } from "../../application/use-cases/ListarDependabot/ListarDependabotUseCase.js"
import {
  GitHubApiError,
  GitHubTimeoutError,
  GitHubTokenAusenteError,
} from "../../domain/errors/devboard.error.js"

export class DevboardController {
  private listarRuns: ListarRunsUseCase
  private listarPRs: ListarPRsUseCase
  private listarDependabot: ListarDependabotUseCase

  constructor(gateway: IGithubGateway) {
    this.listarRuns = new ListarRunsUseCase(gateway)
    this.listarPRs = new ListarPRsUseCase(gateway)
    this.listarDependabot = new ListarDependabotUseCase(gateway)
  }

  private handleError(res: Response, err: unknown): void {
    if (err instanceof GitHubTokenAusenteError) {
      res.status(503).json({ code: "GITHUB_TOKEN_AUSENTE", message: err.message })
      return
    }
    if (err instanceof GitHubTimeoutError) {
      res.status(504).json({ code: "GITHUB_TIMEOUT", message: err.message })
      return
    }
    if (err instanceof GitHubApiError) {
      res.status(err.status === 429 ? 429 : 502).json({ code: "GITHUB_API_ERROR", message: err.message })
      return
    }
    console.error("Erro ao acessar devboard:", err)
    res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
  }

  runs = async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit)
      const runs = await this.listarRuns.execute(Number.isFinite(limit) ? limit : 10)
      res.json({ runs })
    } catch (err) {
      this.handleError(res, err)
    }
  }

  prs = async (_req: Request, res: Response) => {
    try {
      const prs = await this.listarPRs.execute()
      res.json({ prs })
    } catch (err) {
      this.handleError(res, err)
    }
  }

  dependabot = async (_req: Request, res: Response) => {
    try {
      const dependabot = await this.listarDependabot.execute()
      res.json({ dependabot })
    } catch (err) {
      this.handleError(res, err)
    }
  }
}
