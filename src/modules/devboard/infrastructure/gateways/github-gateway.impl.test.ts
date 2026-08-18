import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GithubGateway } from "./github-gateway.impl.js"
import { GitHubApiError, GitHubTimeoutError, GitHubTokenAusenteError } from "../../domain/errors/devboard.error.js"

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } })

describe("GithubGateway (devboard)", () => {
  const originalToken = process.env.GITHUB_TOKEN

  beforeEach(() => {
    process.env.GITHUB_TOKEN = "tok"
  })
  afterEach(() => {
    process.env.GITHUB_TOKEN = originalToken
    vi.restoreAllMocks()
  })

  it("lança GitHubTokenAusenteError sem GITHUB_TOKEN", async () => {
    process.env.GITHUB_TOKEN = ""
    const gw = new GithubGateway()
    await expect(gw.listRuns(10)).rejects.toBeInstanceOf(GitHubTokenAusenteError)
  })

  it("listRuns mapeia workflow_runs e calcula duração", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      ok({
        workflow_runs: [
          { id: 1, name: "CI", head_branch: "main", status: "completed", conclusion: "success", created_at: "2026-01-01T00:00:00Z", run_started_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:30Z" },
        ],
      })
    ))
    const gw = new GithubGateway()
    const runs = await gw.listRuns(10)
    expect(runs).toHaveLength(1)
    expect(runs[0]).toMatchObject({ id: "1", workflowName: "CI", branch: "main", status: "completed", conclusion: "success", durationSec: 30 })
    const call = vi.mocked(fetch).mock.calls[0]
    expect(call[0]).toContain("/actions/runs?per_page=10")
    expect((call[1]!.headers as Record<string, string>).Authorization).toBe("Bearer tok")
  })

  it("listPRs marca isDependabot por login", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      ok([
        { number: 1, title: "a", head: { ref: "feat/x" }, draft: false, user: { login: "alice" } },
        { number: 2, title: "deps", head: { ref: "dependabot/npm" }, draft: true, user: { login: "dependabot[bot]" } },
      ])
    ))
    const gw = new GithubGateway()
    const prs = await gw.listPRs()
    expect(prs[0].isDependabot).toBe(false)
    expect(prs[1].isDependabot).toBe(true)
    expect(prs[1].isDraft).toBe(true)
  })

  it("converte não-200 em GitHubApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 403 })))
    const gw = new GithubGateway()
    await expect(gw.listRuns(10)).rejects.toBeInstanceOf(GitHubApiError)
  })

  it("converte abort (timeout) em GitHubTimeoutError", async () => {
    const abortError = new Error("aborted")
    abortError.name = "AbortError"
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(abortError))
    const gw = new GithubGateway()
    await expect(gw.listRuns(10)).rejects.toBeInstanceOf(GitHubTimeoutError)
  })
})
