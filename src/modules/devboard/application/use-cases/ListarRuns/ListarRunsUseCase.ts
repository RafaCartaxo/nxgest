import type { IGithubGateway } from "../../ports/github-gateway.port.js"
import type { RunInfo } from "../../../domain/devboard.types.js"

export class ListarRunsUseCase {
  constructor(private readonly gateway: IGithubGateway) {}

  async execute(limit: number): Promise<RunInfo[]> {
    const n = Number(limit)
    const base = Number.isFinite(n) && n > 0 ? Math.trunc(n) : 10
    const limite = Math.min(Math.max(base, 1), 50)
    return this.gateway.listRuns(limite)
  }
}
