// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { PRsList } from "./PRsList.js"
import { DependabotList } from "./DependabotList.js"

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }))

const prs = [
  { number: 1, title: "Feat X", branch: "feat/x", isDraft: false, isDependabot: false },
  { number: 2, title: "Draft WIP", branch: "feat/wip", isDraft: true, isDependabot: false },
]

describe("PRsList (devboard)", () => {
  it("renderiza número, título e branch de cada PR", () => {
    render(<PRsList prs={prs} loading={false} error={null} />)
    expect(screen.getByText("Feat X")).toBeTruthy()
    expect(screen.getByText("feat/x")).toBeTruthy()
    expect(screen.getByText(/Draft WIP/)).toBeTruthy()
  })

  it("marca PR rascunho com badge", () => {
    render(<PRsList prs={prs} loading={false} error={null} />)
    expect(screen.getByText("devboard.rascunho")).toBeTruthy()
  })

  it("mostra estado vazio", () => {
    render(<PRsList prs={[]} loading={false} error={null} />)
    expect(screen.getByText("devboard.semPRs")).toBeTruthy()
  })
})

describe("DependabotList (devboard)", () => {
  const dependabot = [{ number: 9, title: "deps: bump", branch: "dependabot/npm" }]

  it("renderiza PRs do dependabot", () => {
    render(<DependabotList dependabot={dependabot} loading={false} error={null} />)
    expect(screen.getByText(/deps: bump/)).toBeTruthy()
    expect(screen.getByText("dependabot")).toBeTruthy()
  })

  it("mostra estado vazio", () => {
    render(<DependabotList dependabot={[]} loading={false} error={null} />)
    expect(screen.getByText("devboard.semDependabot")).toBeTruthy()
  })
})
