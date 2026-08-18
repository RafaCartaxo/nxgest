import { apiRequest } from "../../../api/client.js"

export type RunConclusion = "success" | "failure" | "cancelled" | "timed_out" | "neutral" | "skipped"

export interface RunInfo {
  id: string
  workflowName: string
  branch: string
  status: "in_progress" | "completed"
  conclusion: RunConclusion | null
  createdAt: string
  durationSec: number | null
}

export interface PRInfo {
  number: number
  title: string
  branch: string
  isDraft: boolean
  isDependabot: boolean
}

export interface DependabotPR {
  number: number
  title: string
  branch: string
}

export async function listRuns(limit = 10): Promise<RunInfo[]> {
  const data = await apiRequest<{ runs: RunInfo[] }>("GET", `/devboard/runs?limit=${limit}`)
  return data.runs
}

export async function listPRs(): Promise<PRInfo[]> {
  const data = await apiRequest<{ prs: PRInfo[] }>("GET", `/devboard/prs`)
  return data.prs
}

export async function listDependabot(): Promise<DependabotPR[]> {
  const data = await apiRequest<{ dependabot: DependabotPR[] }>("GET", `/devboard/dependabot`)
  return data.dependabot
}
