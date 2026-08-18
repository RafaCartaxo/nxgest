import type { DependabotPR, PRInfo, RunInfo } from "../../domain/devboard.types.js"

export interface IGithubGateway {
  listRuns(limit: number): Promise<RunInfo[]>
  listPRs(): Promise<PRInfo[]>
  listDependabot(): Promise<DependabotPR[]>
}
