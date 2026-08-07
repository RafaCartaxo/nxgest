import { describe, expect, it } from "vitest"
import { hasCapability, ALL_CAPABILITIES } from "./capacidades.js"

describe("hasCapability (capacidades do whitelabel)", () => {
  it("modulos null + capacidades null = todas ativas", () => {
    expect(hasCapability(null, null, "cliente:whatsapp")).toBe(true)
    expect(hasCapability(undefined, undefined, "rota:navegar")).toBe(true)
  })

  it("modulos null + capacidades [] = nenhuma", () => {
    expect(hasCapability([], null, "cliente:whatsapp")).toBe(false)
  })

  it("capacidades definidas restringem ao conjunto", () => {
    const caps = ["cliente:whatsapp", "cliente:ligar"]
    expect(hasCapability(caps, null, "cliente:whatsapp")).toBe(true)
    expect(hasCapability(caps, null, "cliente:ligar")).toBe(true)
    expect(hasCapability(caps, null, "cliente:navegar")).toBe(false)
    expect(hasCapability(caps, null, "pagamento:comprovante_whatsapp")).toBe(false)
  })

  it("módulo dono desativado ⇒ capacidade inativa mesmo na lista", () => {
    const caps = ["rota:whatsapp"]
    const modulos = ["clientes", "contratos", "caixa", "gastos", "cobrancas", "atendidos"]
    expect(hasCapability(caps, modulos, "rota:whatsapp")).toBe(false)
  })

  it("módulo dono ativo + capacidades ausentes = todas ativas do módulo", () => {
    const modulos = ["clientes", "contratos", "caixa", "gastos", "rota", "cobrancas", "atendidos"]
    expect(hasCapability(null, modulos, "rota:navegar")).toBe(true)
  })

  it("id inexistente = false", () => {
    expect(hasCapability(null, null, "nao:existe" as never)).toBe(false)
  })

  it("lista canônica tem 8 capacidades", () => {
    expect(ALL_CAPABILITIES).toHaveLength(8)
  })
})
