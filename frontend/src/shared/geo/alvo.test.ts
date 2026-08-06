import { describe, expect, it } from "vitest"
import { alvoDeItemCobranca, alvoNavegavel, montarAlvo, resolveAlvoCliente } from "./alvo.js"
import type { AlvoCliente } from "./types.js"

const endPrincipal = { logradouro: "Rua A", numero: "10", bairro: "Centro", cidade: "Cidade X", estado: "SP" }
const endComercio = { logradouro: "Av B", numero: "200", bairro: "Jardim", cidade: "Cidade X", estado: "SP" }
const localizacao = { lat: -23.5, lng: -46.6 }

function cliente(partial: Partial<AlvoCliente>): AlvoCliente {
  return { endereco: endPrincipal, ...partial }
}

describe("montarAlvo", () => {
  it("prioriza coordenadas quando presentes (N4)", () => {
    const alvo = montarAlvo(endComercio, localizacao)
    expect(alvo.lat).toBe(-23.5)
    expect(alvo.lng).toBe(-46.6)
    expect(alvo.logradouro).toBe("Av B")
  })

  it("cai no texto quando não há coordenadas (N3)", () => {
    const alvo = montarAlvo(endComercio, null)
    expect(alvo.lat).toBeNull()
    expect(alvo.logradouro).toBe("Av B")
  })

  it("não mistura endereço com coordenadas de outro (coords vêm da localização do próprio endereço)", () => {
    const alvo = montarAlvo(endComercio, localizacao)
    expect(alvo).toEqual({ lat: -23.5, lng: -46.6, logradouro: "Av B", numero: "200", bairro: "Jardim", cidade: "Cidade X", estado: "SP" })
  })
})

describe("resolveAlvoCliente", () => {
  it("comércio é o alvo padrão (N4)", () => {
    const alvo = resolveAlvoCliente(cliente({ enderecoComercio: endComercio, localizacaoComercio: localizacao }))
    expect(alvo.lat).toBe(-23.5)
    expect(alvo.logradouro).toBe("Av B")
  })

  it("sem comércio → usa o endereço principal (N2)", () => {
    const alvo = resolveAlvoCliente(cliente({}))
    expect(alvo.lat).toBeNull()
    expect(alvo.logradouro).toBe("Rua A")
  })

  it("sem comércio + coords no principal → usa coords do principal (N11, novo)", () => {
    const alvo = resolveAlvoCliente(cliente({ localizacao }))
    expect(alvo.lat).toBe(-23.5)
    expect(alvo.logradouro).toBe("Rua A")
  })

  it("texto do comércio editado (coords descartadas) → navega pelo texto novo (N5)", () => {
    const alvo = resolveAlvoCliente(cliente({ enderecoComercio: { ...endComercio, logradouro: "Av B Editada" }, localizacaoComercio: null }))
    expect(alvo.lat).toBeNull()
    expect(alvo.logradouro).toBe("Av B Editada")
  })

  it("comércio limpo → cai no endereço principal (N6)", () => {
    const alvo = resolveAlvoCliente(cliente({ enderecoComercio: null, localizacaoComercio: localizacao }))
    expect(alvo.logradouro).toBe("Rua A")
    expect(alvo.lat).toBeNull()
  })

  it("coords sem texto (S7) → navega pelas coordenadas", () => {
    const alvo = resolveAlvoCliente(cliente({ enderecoComercio: { logradouro: "", bairro: "", cidade: "", estado: "" }, localizacaoComercio: localizacao }))
    expect(alvo.lat).toBe(-23.5)
  })

  it("cliente sem nenhum endereço navegável → alvo sem coords e sem texto (N1/N12)", () => {
    const alvo = resolveAlvoCliente(cliente({ endereco: { logradouro: "" } }))
    expect(alvo.lat).toBeNull()
    expect(alvo.logradouro).toBe("")
  })
})

describe("alvoDeItemCobranca", () => {
  it("mapeia o shape legado cliente* para o alvo canônico", () => {
    const alvo = alvoDeItemCobranca({
      clienteLat: -23.5,
      clienteLng: -46.6,
      clienteLogradouro: "Rua C",
      clienteNumero: "5",
      clienteBairro: "Centro",
      clienteCidade: "Cidade X",
      clienteEstado: "SP",
    })
    expect(alvo).toEqual({ lat: -23.5, lng: -46.6, logradouro: "Rua C", numero: "5", bairro: "Centro", cidade: "Cidade X", estado: "SP" })
  })
})

describe("alvoNavegavel", () => {
  it("true quando gera URL", () => {
    expect(alvoNavegavel(montarAlvo(endPrincipal))).toBe(true)
  })
  it("false quando não gera URL (sem endereço)", () => {
    expect(alvoNavegavel(montarAlvo({ logradouro: "" }))).toBe(false)
  })
  it("false quando alvo é null", () => {
    expect(alvoNavegavel(null)).toBe(false)
  })
})
