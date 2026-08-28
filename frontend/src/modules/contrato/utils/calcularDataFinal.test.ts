import { describe, expect, it } from "vitest"
import {
  intervaloDePeriodicidade,
  calcularDataFinal,
} from "./calcularDataFinal.js"

describe("intervaloDePeriodicidade (PLAN-076/085) — espelho do backend", () => {
  it("diária → 1 dia", () => {
    expect(intervaloDePeriodicidade("diaria")).toBe(1)
  })
  it("semanal → 7 dias", () => {
    expect(intervaloDePeriodicidade("semanal")).toBe(7)
  })
  it("alternada → 2 dias (PLAN-085)", () => {
    expect(intervaloDePeriodicidade("alternada")).toBe(2)
  })
})

describe("calcularDataFinal (PLAN-085) — mesma matriz do backend", () => {
  it("diária: dataInicio + qtd dias, pulando domingo", () => {
    expect(calcularDataFinal("2026-07-01", 4, "diaria")).toBe("2026-07-06")
  })
  it("semanal: dataInicio + 7*i dias (mesmo dia da semana)", () => {
    expect(calcularDataFinal("2026-07-06", 4, "semanal")).toBe("2026-08-03")
  })
  it("10 parcelas alternada de início segunda → span real de 23 dias", () => {
    expect(calcularDataFinal("2026-07-06", 10, "alternada")).toBe("2026-07-29")
  })
  it("10 parcelas alternada de início terça → span real de 22 dias", () => {
    expect(calcularDataFinal("2026-07-07", 10, "alternada")).toBe("2026-07-29")
  })
  it("span real é 22-24 dias, nunca 20 — consistente com a diária", () => {
    for (const dataInicio of [
      "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
      "2026-07-10", "2026-07-11", "2026-07-12",
    ]) {
      const dataFinal = calcularDataFinal(dataInicio, 10, "alternada")
      const span = Math.round(
        (new Date(dataFinal + "T12:00:00Z").getTime() -
          new Date(dataInicio + "T12:00:00Z").getTime()) /
          (1000 * 60 * 60 * 24)
      )
      expect(span).toBeGreaterThanOrEqual(22)
      expect(span).toBeLessThanOrEqual(24)
    }
  })
  it("default (sem periodicidade) mantém diária", () => {
    expect(calcularDataFinal("2026-07-01", 1)).toBe("2026-07-02")
  })
})