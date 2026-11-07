import { describe, expect, it, vi } from "vitest"
import { CreateClienteUseCase } from "./CreateClienteUseCase.js"
import type { IClienteRepository } from "../../ports/cliente.repository.js"

function repo(): IClienteRepository {
  return {
    save: vi.fn().mockResolvedValue(undefined), findById: vi.fn(), findByCpf: vi.fn().mockResolvedValue(null),
    findAll: vi.fn(), update: vi.fn(), softDelete: vi.fn(), hasActiveContracts: vi.fn(),
  }
}

describe("CreateClienteUseCase — CEP", () => {
  it("propaga CEPs e origem de localização para o repositório", async () => {
    const repository = repo()
    const useCase = new CreateClienteUseCase(repository)
    await useCase.execute("user-1", {
      nome: "Maria Silva", telefone: "83988887777", comercio: "Padaria",
      endereco: { cep: "58000000", cidade: "João Pessoa", estado: "PB" },
      enderecoComercio: { cep: "58001000", cidade: "João Pessoa", estado: "PB" },
      localizacao: { lat: -7.1, lng: -34.8 }, localizacaoOrigem: "cep_aproximado",
      localizacaoComercio: null, localizacaoComercioOrigem: null,
    })
    const cliente = (repository.save as ReturnType<typeof vi.fn>).mock.calls[0][1]
    expect(cliente.endereco.cep).toBe("58000000")
    expect(cliente.enderecoComercio.cep).toBe("58001000")
    expect(cliente.localizacaoOrigem).toBe("cep_aproximado")
  })
})
