import type { IGithubGateway } from "../../ports/github-gateway.port.js"
import type { DependabotPR } from "../../../domain/devboard.types.js"

export class ListarDependabotUseCase {
  constructor(private readonly gateway: IGithubGateway) {}

  async execute(): Promise<DependabotPR[]> {
    return this.gateway.listDependabot()
  }
}
