import { describe, expect, it } from "vitest"
import {
  gerarParcelas,
  calcularDataFinal,
  intervaloDePeriodicidade,
} from "./gerar-parcelas.js"

describe("intervaloDePeriodicidade (PLAN-076)", () => {
  it("diária → 1 dia", () => {
    expect(intervaloDePeriodicidade("diaria")).toBe(1)
  })
  it("semanal → 7 dias", () => {
    expect(intervaloDePeriodicidade("semanal")).toBe(7)
  })
})

describe("calcularDataFinal (PLAN-076)", () => {
  it("diária: dataInicio + qtd dias, pulando domingo", () => {
    // 01/07/2026 é quarta-feira; 4 parcelas diárias (BR-042-A: 02,03,04,06)
    expect(calcularDataFinal("2026-07-01", 4, "diaria")).toBe("2026-07-06")
  })
  it("semanal: dataInicio + 7*i dias (mesmo dia da semana)", () => {
    // 06/07/2026 é segunda-feira; 4 parcelas semanais → 13,20,27/07, 03/08
    expect(calcularDataFinal("2026-07-06", 4, "semanal")).toBe("2026-08-03")
  })
  it("default (sem periodicidade) mantém diária", () => {
    expect(calcularDataFinal("2026-07-01", 1)).toBe("2026-07-02")
  })
})

describe("gerarParcelas diária (BR-039/BR-042)", () => {
  it("gera parcelas com vencimentos diários consecutivos pulando domingo", () => {
    // 02/07/2026 (quinta) → parcela 1 = 03/07 (sex), 2 = 04/07 (sáb), 3 = 06/07 (seg)
    const parcelas = gerarParcelas("c-1", 300, 3, "2026-07-02", "diaria")
    expect(parcelas).toHaveLength(3)
    expect(parcelas[0].dataVencimento).toBe("2026-07-03")
    expect(parcelas[1].dataVencimento).toBe("2026-07-04")
    expect(parcelas[2].dataVencimento).toBe("2026-07-06")
  })

  it("última parcela absorve o residual", () => {
    // 1000 / 3 → 333.33×2 + 333.34
    const parcelas = gerarParcelas("c-1", 1000, 3, "2026-07-01", "diaria")
    const soma = parcelas.reduce((acc, p) => acc + p.valorPrevisto, 0)
    expect(parcelas[0].valorPrevisto).toBe(333.33)
    expect(parcelas[2].valorPrevisto).toBe(333.34)
    expect(Math.round(soma * 100) / 100).toBe(1000)
  })
})

describe("gerarParcelas semanal (PLAN-076)", () => {
  it("vence no mesmo dia da semana da dataInicio (+7*i)", () => {
    // 06/07/2026 (segunda) → vencimentos: 13, 20, 27/07 (segundas)
    const parcelas = gerarParcelas("c-1", 400, 3, "2026-07-06", "semanal")
    expect(parcelas).toHaveLength(3)
    expect(parcelas[0].dataVencimento).toBe("2026-07-13")
    expect(parcelas[1].dataVencimento).toBe("2026-07-20")
    expect(parcelas[2].dataVencimento).toBe("2026-07-27")
  })

  it("não desliza para segunda (dia da semana fixo, sem domingo)", () => {
    // 03/08/2026 é segunda-feira; +7 nunca cai domingo
    const parcelas = gerarParcelas("c-1", 400, 2, "2026-08-03", "semanal")
    expect(parcelas[0].dataVencimento).toBe("2026-08-10")
    expect(parcelas[1].dataVencimento).toBe("2026-08-17")
    expect(new Date(parcelas[1].dataVencimento + "T12:00:00Z").getUTCDay()).toBe(1)
  })

  it("última parcela absorve o residual (semanal)", () => {
    const parcelas = gerarParcelas("c-1", 700, 3, "2026-07-06", "semanal")
    const soma = parcelas.reduce((acc, p) => acc + p.valorPrevisto, 0)
    expect(Math.round(soma * 100) / 100).toBe(700)
  })
})
