import { afterEach, describe, expect, it, vi } from "vitest"
import { CepError, consultarCep } from "./cep.js"

afterEach(() => { vi.restoreAllMocks() })

describe("consultarCep", () => {
  it("normaliza o CEP e mapeia o endereço retornado", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ logradouro: "Rua A", bairro: "Centro", localidade: "João Pessoa", uf: "PB" }), { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)
    await expect(consultarCep("58000-000")).resolves.toMatchObject({ cep: "58000000", cidade: "João Pessoa", estado: "PB" })
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/58000000/json/", expect.objectContaining({ signal: expect.any(AbortSignal) }))
  })

  it("rejeita formato inválido sem consultar o provedor", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    await expect(consultarCep("123")).rejects.toMatchObject({ tipo: "invalido" } satisfies Partial<CepError>)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("classifica CEP inexistente", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ erro: true }), { status: 200 })))
    await expect(consultarCep("99999999")).rejects.toMatchObject({ tipo: "nao_encontrado" })
  })

  it("classifica CEP inexistente quando erro vem como texto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ erro: "true" }), { status: 200 })))
    await expect(consultarCep("99999999")).rejects.toMatchObject({ tipo: "nao_encontrado" })
  })
})
