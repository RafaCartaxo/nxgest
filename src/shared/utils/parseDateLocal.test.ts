import { describe, expect, it } from "vitest"
import { rangeDoDiaLocal } from "./parseDateLocal.js"

describe("rangeDoDiaLocal (G3 — fronteiras do dia local em instantes UTC)", () => {
  it("gera um range de 24h que cobre o dia no relógio local do servidor", () => {
    const { inicio, fim } = rangeDoDiaLocal("2026-08-12")
    const dInicio = new Date(inicio)
    const dFim = new Date(fim)
    // No relógio local do servidor, inicio cai em 12/08 e fim em 13/08.
    expect(dInicio.getDate()).toBe(12)
    expect(dFim.getDate()).toBe(13)
    // Duração exata de um dia (independe de offset de TZ).
    expect(Date.parse(fim) - Date.parse(inicio)).toBe(86_400_000)
  })
})
