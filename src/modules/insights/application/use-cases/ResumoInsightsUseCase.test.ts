import { describe, expect, it, vi } from "vitest"
import { ResumoInsightsUseCase, rangeDoPeriodo } from "./ResumoInsightsUseCase.js"
import type { IInsightsRepository } from "../ports/insights.repository.js"

function repo(overrides: Partial<IInsightsRepository> = {}): IInsightsRepository {
  return {
    recebidoPorData: vi.fn().mockResolvedValue({}),
    previstoPorData: vi.fn().mockResolvedValue({}),
    ...overrides,
  } as IInsightsRepository
}

describe("rangeDoPeriodo (PLAN-080 F1)", () => {
  const hoje = new Date("2026-08-28T12:00:00")

  it("dia = mesmo dia", () => {
    expect(rangeDoPeriodo("dia", hoje)).toEqual({ dataInicio: "2026-08-28", dataFim: "2026-08-28" })
  })
  it("semana = últimos 7 dias", () => {
    expect(rangeDoPeriodo("semana", hoje)).toEqual({ dataInicio: "2026-08-22", dataFim: "2026-08-28" })
  })
  it("mes = últimos 30 dias", () => {
    expect(rangeDoPeriodo("mes", hoje)).toEqual({ dataInicio: "2026-07-30", dataFim: "2026-08-28" })
  })
})

describe("ResumoInsightsUseCase (PLAN-080 F1)", () => {
  it("compõe a série por dia no período, com 0 onde não há dado", async () => {
    const r = repo({
      recebidoPorData: vi.fn().mockResolvedValue({ "2026-08-24": 1200, "2026-08-26": 800 }),
      previstoPorData: vi.fn().mockResolvedValue({ "2026-08-24": 1500 }),
    })
    const useCase = new ResumoInsightsUseCase(r)
    // data fixa injetada — independe do fuso do runner
    const result = await useCase.execute("u-1", "semana", new Date("2026-08-28T12:00:00"))

    expect(result.periodo).toBe("semana")
    expect(result.serie).toHaveLength(7)
    expect(result.serie[0]).toEqual({ data: "2026-08-22", recebido: 0, previsto: 0 })
    // dia com recebido + previsto
    expect(result.serie[2]).toEqual({ data: "2026-08-24", recebido: 1200, previsto: 1500 })
    // dia só com recebido
    expect(result.serie[4]).toEqual({ data: "2026-08-26", recebido: 800, previsto: 0 })
  })

  it("dia retorna 1 ponto", async () => {
    const useCase = new ResumoInsightsUseCase(repo())
    const result = await useCase.execute("u-1", "dia")
    expect(result.serie).toHaveLength(1)
    expect(result.serie[0]).toEqual({ data: result.dataFim, recebido: 0, previsto: 0 })
  })
})