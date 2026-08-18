import { describe, expect, it, vi } from "vitest"
import { ListarPRsUseCase } from "./ListarPRsUseCase.js"
import { ListarDependabotUseCase } from "../ListarDependabot/ListarDependabotUseCase.js"
import type { IGithubGateway } from "../../ports/github-gateway.port.js"
import type { PRInfo } from "../../../domain/devboard.types.js"

const prs: PRInfo[] = [
  { number: 1, title: "PR normal", branch: "feat/x", isDraft: false, isDependabot: false },
  { number: 2, title: "deps: bump", branch: "dependabot/npm", isDraft: false, isDependabot: true },
]

function setup() {
  const gateway: IGithubGateway = {
    listRuns: vi.fn(),
    listPRs: vi.fn().mockResolvedValue(prs),
    listDependabot: vi.fn().mockResolvedValue([{ number: 2, title: "deps: bump", branch: "dependabot/npm" }]),
  }
  return { gateway }
}

describe("ListarPRsUseCase (devboard)", () => {
  it("retorna todos os PRs abertos do gateway", async () => {
    const { gateway } = setup()
    const uc = new ListarPRsUseCase(gateway)
    await expect(uc.execute()).resolves.toEqual(prs)
  })
})

describe("ListarDependabotUseCase (devboard)", () => {
  it("retorna os PRs do dependabot vindos do gateway (filtragem no gateway, já testada)", async () => {
    const { gateway } = setup()
    const uc = new ListarDependabotUseCase(gateway)
    await expect(uc.execute()).resolves.toEqual([{ number: 2, title: "deps: bump", branch: "dependabot/npm" }])
  })

  it("retorna lista vazia quando o gateway não retorna nada", async () => {
    const gateway: IGithubGateway = {
      listRuns: vi.fn(),
      listPRs: vi.fn(),
      listDependabot: vi.fn().mockResolvedValue([]),
    }
    const uc = new ListarDependabotUseCase(gateway)
    await expect(uc.execute()).resolves.toEqual([])
  })
})
