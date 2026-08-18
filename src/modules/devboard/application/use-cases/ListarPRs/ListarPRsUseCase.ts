import type { IGithubGateway } from "../../ports/github-gateway.port.js"
import type { PRInfo } from "../../../domain/devboard.types.js"

export class ListarPRsUseCase {
  constructor(private readonly gateway: IGithubGateway) {}

  async execute(): Promise<PRInfo[]> {
    return this.gateway.listPRs()
  }
}
