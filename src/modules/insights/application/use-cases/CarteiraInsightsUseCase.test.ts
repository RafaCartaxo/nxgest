import { describe, expect, it, vi } from "vitest"
import { CarteiraInsightsUseCase } from "./CarteiraInsightsUseCase.js"
import type { IInsightsRepository } from "../ports/insights.repository.js"

function repo(overrides: Partial<IInsightsRepository> = {}): IInsightsRepository {
  return {
    carteiraSnapshot: vi.fn().mockResolvedValue({ emAtraso: 0, aVencer: 0, pagas: 0, total: 0 }),
    gastosPorCategoria: vi.fn().mockResolvedValue([]),
    contribuicaoOperadores: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as IInsightsRepository
}

describe("CarteiraInsightsUseCase (PLAN-080 F2)", () => {
  it("compõe carteira + gastos por categoria + contribuição", async () => {
    const r = repo({
      carteiraSnapshot: vi.fn().mockResolvedValue({ emAtraso: 200, aVencer: 800, pagas: 1500, total: 2500 }),
      gastosPorCategoria: vi.fn().mockResolvedValue([{ categoria: "Transporte", total: 120 }]),
      contribuicaoOperadores: vi.fn().mockResolvedValue([{ usuarioId: "u-1", nome: "Ana", recebido: 1000 }]),
    })
    const useCase = new CarteiraInsightsUseCase(r)
    const result = await useCase.execute(["u-1"])

    expect(result.carteira).toEqual({ emAtraso: 200, aVencer: 800, pagas: 1500, total: 2500 })
    expect(result.gastosPorCategoria).toHaveLength(1)
    expect(result.contribuicaoOperadores[0]).toMatchObject({ nome: "Ana", recebido: 1000 })
  })

  it("passa o conjunto de userIds ao repositório", async () => {
    const r = repo()
    const useCase = new CarteiraInsightsUseCase(r)
    await useCase.execute(["u-1", "u-2"])
    expect(r.carteiraSnapshot).toHaveBeenCalledWith(["u-1", "u-2"], expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/))
    expect(r.gastosPorCategoria).toHaveBeenCalledWith(["u-1", "u-2"])
    expect(r.contribuicaoOperadores).toHaveBeenCalledWith(["u-1", "u-2"])
  })
})