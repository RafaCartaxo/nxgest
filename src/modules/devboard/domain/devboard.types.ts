export type RunConclusion = "success" | "failure" | "cancelled" | "timed_out" | "neutral" | "skipped"

export interface RunInfo {
  id: string
  workflowName: string
  branch: string
  status: "in_progress" | "completed"
  conclusion: RunConclusion | null
  createdAt: string
  /** duração em segundos (quando concluído) */
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
