import type { IGithubGateway } from "../../application/ports/github-gateway.port.js"
import type { DependabotPR, PRInfo, RunConclusion, RunInfo } from "../../domain/devboard.types.js"
import { GitHubApiError, GitHubTimeoutError, GitHubTokenAusenteError } from "../../domain/errors/devboard.error.js"

const OWNER = "RafaCartaxo"
const REPO = "nxgest"
const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`
const TIMEOUT_MS = 10_000

interface GithubRun {
  id: number
  name?: string | null
  head_branch: string | null
  status: "in_progress" | "completed"
  conclusion: RunConclusion | null
  created_at: string
  updated_at: string
  run_started_at?: string
}

interface GithubPR {
  number: number
  title: string
  head: { ref: string }
  draft: boolean
  user?: { login?: string | null } | null
}

export class GithubGateway implements IGithubGateway {
  private token(): string {
    const token = process.env.GITHUB_TOKEN?.trim()
    if (!token) throw new GitHubTokenAusenteError()
    return token
  }

  private async request<T>(path: string): Promise<T> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    try {
      const res = await fetch(`${BASE}${path}`, {
        headers: {
          Authorization: `Bearer ${this.token()}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        signal: controller.signal,
      })
      if (!res.ok) {
        throw new GitHubApiError(`GitHub respondeu ${res.status} em ${path}`, res.status)
      }
      return (await res.json()) as T
    } catch (err) {
      if (err instanceof GitHubApiError) throw err
      if (err instanceof Error && err.name === "AbortError") throw new GitHubTimeoutError()
      throw err
    } finally {
      clearTimeout(timer)
    }
  }

  async listRuns(limit: number): Promise<RunInfo[]> {
    const data = await this.request<{ workflow_runs: GithubRun[] }>(
      `/actions/runs?per_page=${limit}`
    )
    return data.workflow_runs.map((r) => {
      let durationSec: number | null = null
      if (r.status === "completed") {
        const start = new Date(r.run_started_at ?? r.created_at).getTime()
        const end = new Date(r.updated_at).getTime()
        durationSec = Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, Math.round((end - start) / 1000)) : null
      }
      return {
        id: String(r.id),
        workflowName: r.name ?? "workflow",
        branch: r.head_branch ?? "main",
        status: r.status,
        conclusion: r.conclusion,
        createdAt: r.created_at,
        durationSec,
      }
    })
  }

  async listPRs(): Promise<PRInfo[]> {
    const data = await this.request<GithubPR[]>("/pulls?state=open&per_page=100")
    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      branch: pr.head.ref,
      isDraft: pr.draft,
      isDependabot: pr.user?.login === "app/dependabot" || pr.user?.login === "dependabot[bot]",
    }))
  }

  async listDependabot(): Promise<DependabotPR[]> {
    const prs = await this.listPRs()
    return prs.filter((p) => p.isDependabot).map(({ number, title, branch }) => ({ number, title, branch }))
  }
}
