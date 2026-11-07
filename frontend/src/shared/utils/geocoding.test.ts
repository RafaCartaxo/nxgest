import { afterEach, describe, expect, it, vi } from "vitest"
import { geocodeEndereco } from "./geocoding.js"

afterEach(() => { vi.restoreAllMocks() })

describe("geocodeEndereco", () => {
  it("retorna coordenadas do primeiro resultado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ lat: "-7.1", lon: "-34.8" }]), { status: 200 })))
    await expect(geocodeEndereco({ logradouro: "Rua A", cidade: "João Pessoa", estado: "PB" })).resolves.toEqual({ lat: -7.1, lng: -34.8 })
  })

  it("retorna nulo quando não há resultado", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("[]", { status: 200 })))
    await expect(geocodeEndereco({ logradouro: "Rua A" })).resolves.toBeNull()
  })
})
