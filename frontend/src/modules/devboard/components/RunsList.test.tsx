// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { RunsList } from "./RunsList.js"
import type { RunInfo } from "../services/devboard.service.js"

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const runs: RunInfo[] = [
  { id: "1", workflowName: "CI", branch: "main", status: "completed", conclusion: "success", createdAt: new Date().toISOString(), durationSec: 120 },
  { id: "2", workflowName: "CD", branch: "main", status: "in_progress", conclusion: null, createdAt: new Date().toISOString(), durationSec: null },
  { id: "3", workflowName: "CI", branch: "feat/x", status: "completed", conclusion: "failure", createdAt: new Date().toISOString(), durationSec: 60 },
]

describe("RunsList (devboard)", () => {
  it("renderiza os runs com nome, branch e duração", () => {
    render(<RunsList runs={runs} loading={false} error={null} />)
    expect(screen.getAllByText("CI").length).toBe(2)
    expect(screen.getByText("CD")).toBeTruthy()
    expect(screen.getByText("feat/x")).toBeTruthy()
    expect(screen.getByText(/2m 0s/)).toBeTruthy()
  })

  it("mostra status 'rodando' para run in_progress", () => {
    render(<RunsList runs={runs} loading={false} error={null} />)
    expect(screen.getAllByText("devboard.rodando").length).toBe(1)
  })

  it("mostra loading sem listar runs", () => {
    render(<RunsList runs={[]} loading={true} error={null} />)
    expect(screen.getByText("common.loading")).toBeTruthy()
  })

  it("mostra erro quando presente", () => {
    render(<RunsList runs={[]} loading={false} error="GitHub API error" />)
    expect(screen.getByText("GitHub API error")).toBeTruthy()
  })

  it("mostra estado vazio quando não há runs", () => {
    render(<RunsList runs={[]} loading={false} error={null} />)
    expect(screen.getByText("devboard.semRuns")).toBeTruthy()
  })
})
