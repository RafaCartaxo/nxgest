import { describe, expect, it } from "vitest"
import { completarDependencias } from "./modules.js"

describe("completarDependencias (grafo de módulos — Fix C)", () => {
  it("adiciona dependências diretas ausentes", () => {
    expect(completarDependencias(["gastos"]).sort()).toEqual(["caixa", "gastos"].sort())
  })

  it("adiciona dependências transitivas (rota ⇒ cobrancas ⇒ contratos ⇒ clientes)", () => {
    const result = completarDependencias(["rota"]).sort()
    expect(result).toContain("cobrancas")
    expect(result).toContain("contratos")
    expect(result).toContain("clientes")
  })

  it("não remove nada quando o conjunto já está fechado", () => {
    const full = ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"]
    expect(completarDependencias(full).sort()).toEqual(full.sort())
  })

  it("conjunto vazio continua vazio", () => {
    expect(completarDependencias([])).toEqual([])
  })
})
