// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import { resolveChartColor } from "./chartColors.js"

describe("resolveChartColor (PLAN-080 F0)", () => {
  it("em jsdom devolve o fallback determinístico (jsdom não resolve var())", () => {
    expect(resolveChartColor("--color-primary")).toBe("#1D3F9E")
    expect(resolveChartColor("--color-success")).toBe("#16a34a")
  })

  it("fallback explícito tem precedência", () => {
    expect(resolveChartColor("--color-inexistente", "#abcdef")).toBe("#abcdef")
  })
})