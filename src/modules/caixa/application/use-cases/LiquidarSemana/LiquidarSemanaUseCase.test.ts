import { describe, expect, it, vi } from "vitest"
import { LiquidarSemanaUseCase } from "./LiquidarSemanaUseCase.js"
import { SemanaJaLiquidadaError } from "../../../domain/errors/caixa.error.js"

function repoBase(saveResult: boolean) {
  return {
    findFechamentoPorPeriodo: vi.fn().mockResolvedValue(null),
    getCaixaConfig: vi.fn().mockResolvedValue({ userId: "u1", caixaBase: 0, updatedAt: "" }),
    getUltimaLiquidacao: vi.fn().mockResolvedValue(null),
    getRecebidoSemana: vi.fn().mockResolvedValue(100),
    getGastoSemana: vi.fn().mockResolvedValue(50),
    saveFechamentoSemanal: vi.fn().mockResolvedValue(saveResult),
  }
}

describe("LiquidarSemanaUseCase (G14 — guarda de fechamento duplicado)", () => {
  it("lança SemanaJaLiquidadaError quando o insert conflita com UNIQUE (raça)", async () => {
    const repo = repoBase(false)
    const uc = new LiquidarSemanaUseCase(repo as never)
    await expect(uc.execute("u1")).rejects.toBeInstanceOf(SemanaJaLiquidadaError)
    expect(repo.saveFechamentoSemanal).toHaveBeenCalledTimes(1)
  })

  it("retorna o fechamento quando o insert tem sucesso", async () => {
    const repo = repoBase(true)
    const uc = new LiquidarSemanaUseCase(repo as never)
    const r = await uc.execute("u1")
    expect(r.resultado).toBe(50)
    expect(r.saldoFechamento).toBe(50)
  })
})
