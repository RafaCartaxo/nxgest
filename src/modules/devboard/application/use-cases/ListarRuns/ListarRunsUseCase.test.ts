import { describe, expect, it, vi } from "vitest"
import { ListarRunsUseCase } from "./ListarRunsUseCase.js"
import type { IGithubGateway } from "../../ports/github-gateway.port.js"
import type { RunInfo } from "../../../domain/devboard.types.js"

function setup(runs: RunInfo[] = []) {
  const gateway: IGithubGateway = {
    listRuns: vi.fn().mockResolvedValue(runs),
    listPRs: vi.fn(),
    listDependabot: vi.fn(),
  }
  const uc = new ListarRunsUseCase(gateway)
  return { uc, gateway }
}

describe("ListarRunsUseCase (devboard)", () => {
  it("repassa o limite ao gateway", async () => {
    const { uc, gateway } = setup()
    await uc.execute(5)
    expect(gateway.listRuns).toHaveBeenCalledWith(5)
  })

  it("default de 10 quando o limite não é finito", async () => {
    const { uc, gateway } = setup()
    await uc.execute(NaN)
    expect(gateway.listRuns).toHaveBeenCalledWith(10)
  })

  it("clampa o limite entre 1 e 50 (0 e negativos caem no default 10)", async () => {
    const { uc, gateway } = setup()
    await uc.execute(0)
    expect(gateway.listRuns).toHaveBeenCalledWith(10)
    await uc.execute(-3)
    expect(gateway.listRuns).toHaveBeenCalledWith(10)
    await uc.execute(500)
    expect(gateway.listRuns).toHaveBeenCalledWith(50)
  })

  it("retorna os runs do gateway", async () => {
    const runs: RunInfo[] = [{ id: "1", workflowName: "CI", branch: "main", status: "completed", conclusion: "success", createdAt: "x", durationSec: 12 }]
    const { uc } = setup(runs)
    await expect(uc.execute(10)).resolves.toEqual(runs)
  })
})
