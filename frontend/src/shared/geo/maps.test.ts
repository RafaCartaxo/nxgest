import { describe, expect, it } from "vitest"
import { buildMapsUrl } from "./maps.js"

function alvo(overrides: Partial<{ lat: number | null; lng: number | null; logradouro: string; numero: string | null; bairro: string | null; cidade: string | null; estado: string | null }> = {}) {
  return {
    lat: null,
    lng: null,
    logradouro: "",
    numero: null,
    bairro: null,
    cidade: null,
    estado: null,
    ...overrides,
  }
}

describe("buildMapsUrl", () => {
  it("usa coordenadas quando presentes (N4)", () => {
    const url = buildMapsUrl(alvo({ lat: -23.5, lng: -46.6 }))
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&destination=-23.5,-46.6")
  })

  it("usa o texto quando não há coordenadas, com >= 2 partes (N2/N3)", () => {
    const url = buildMapsUrl(alvo({ logradouro: "Rua A", numero: "10", bairro: "Centro", cidade: "Cidade X", estado: "SP" }))
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent("Rua A, 10, Centro, Cidade X, SP"))
  })

  it("retorna null com menos de 2 partes de endereço (N12)", () => {
    expect(buildMapsUrl(alvo({ logradouro: "Rua A" }))).toBeNull()
    expect(buildMapsUrl(alvo({}))).toBeNull()
  })

  it("coordenadas 0 são falsy e caem para o texto (comportamento legado preservado)", () => {
    const url = buildMapsUrl(alvo({ lat: 0, lng: 0, logradouro: "Rua A", cidade: "Cidade X" }))
    expect(url).toContain("Rua%20A")
  })
})
