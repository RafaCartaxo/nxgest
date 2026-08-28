import { describe, expect, it } from "vitest"
import {
  gerarParcelas,
  calcularDataFinal,
  intervaloDePeriodicidade,
} from "./gerar-parcelas.js"

describe("intervaloDePeriodicidade (PLAN-076/085)", () => {
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

describe("gerarParcelas alternada (PLAN-085)", () => {
  it("vence a cada 2 dias (dia sim, dia não), deslizando domingo → segunda", () => {
    // 06/07/2026 (segunda) → qua · sex · seg(dom) · qua · sex · seg(dom) · qua · sex · seg(dom) · qua
    const parcelas = gerarParcelas("c-1", 500, 10, "2026-07-06", "alternada")
    const esperados = [
      "2026-07-08", "2026-07-10", "2026-07-13", "2026-07-15", "2026-07-17",
      "2026-07-20", "2026-07-22", "2026-07-24", "2026-07-27", "2026-07-29",
    ]
    expect(parcelas).toHaveLength(10)
    parcelas.forEach((p, i) => {
      expect(p.dataVencimento).toBe(esperados[i])
    })
  })

  it("início terça: qui · sáb · seg · qua · sex · seg(dom) · qua · sex · seg(dom) · qua", () => {
    const parcelas = gerarParcelas("c-1", 500, 10, "2026-07-07", "alternada")
    const esperados = [
      "2026-07-09", "2026-07-11", "2026-07-13", "2026-07-15", "2026-07-17",
      "2026-07-20", "2026-07-22", "2026-07-24", "2026-07-27", "2026-07-29",
    ]
    parcelas.forEach((p, i) => {
      expect(p.dataVencimento).toBe(esperados[i])
    })
  })

  it("nenhum vencimento em domingo, para início em qualquer dia da semana", () => {
    for (const dataInicio of [
      "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09",
      "2026-07-10", "2026-07-11", "2026-07-12",
    ]) {
      const parcelas = gerarParcelas("c-1", 500, 10, dataInicio, "alternada")
      expect(parcelas).toHaveLength(10)
      parcelas.forEach((p) => {
        expect(new Date(p.dataVencimento + "T12:00:00Z").getUTCDay()).not.toBe(0)
      })
    }
  })

  it("1ª parcela cai em dataInicio+2 (sem deslize no primeiro salto)", () => {
    // sábado 11/07 → +2 = 13/07 (segunda, não é domingo)
    const parcelas = gerarParcelas("c-1", 300, 2, "2026-07-11", "alternada")
    expect(parcelas[0].dataVencimento).toBe("2026-07-13")
  })

  it("última parcela absorve o residual (alternada)", () => {
    const parcelas = gerarParcelas("c-1", 1000, 10, "2026-07-06", "alternada")
    const soma = parcelas.reduce((acc, p) => acc + p.valorPrevisto, 0)
    expect(parcelas[0].valorPrevisto).toBe(100)
    expect(Math.round(soma * 100) / 100).toBe(1000)
  })
})

describe("calcularDataFinal alternada (PLAN-085)", () => {
  it("10 parcelas de início segunda → span real de 23 dias (não 20)", () => {
    // 06/07 (seg) → 29/07 (qua): 3 deslizes de domingo somam dias (BR nova)
    expect(calcularDataFinal("2026-07-06", 10, "alternada")).toBe("2026-07-29")
  })
  it("10 parcelas de início terça → span real de 22 dias", () => {
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
})
