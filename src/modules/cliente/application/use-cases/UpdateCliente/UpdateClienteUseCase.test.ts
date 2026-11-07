import { describe, expect, it, vi } from "vitest"
import { UpdateClienteUseCase } from "./UpdateClienteUseCase.js"
import type { IClienteRepository } from "../../ports/cliente.repository.js"
import type { Cliente } from "../../../domain/cliente.entity.js"

const existente: Cliente = {
  id: "cli-1", nome: "Maria Silva", comercio: "Padaria", telefone: "83988887777",
  endereco: { logradouro: "Rua A", cep: "58000000" }, enderecoComercio: { cep: "58001000" },
  localizacao: null, localizacaoComercio: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
}

describe("UpdateClienteUseCase — CEP", () => {
  it("atualiza o CEP dos dois endereços sem exigir alteração de outros campos", async () => {
    const repository: IClienteRepository = {
      save: vi.fn(), findById: vi.fn().mockResolvedValue(existente), findByCpf: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(), softDelete: vi.fn(), hasActiveContracts: vi.fn(),
      update: vi.fn().mockImplementation(async (_u, _i, data) => ({ ...existente, ...data })),
    }
    const useCase = new UpdateClienteUseCase(repository)
    await useCase.execute("user-1", "cli-1", {
      endereco: { cep: "58000001" }, enderecoComercio: { cep: "58001001" },
    })
    const data = (repository.update as ReturnType<typeof vi.fn>).mock.calls[0][2]
    expect(data.endereco.cep).toBe("58000001")
    expect(data.enderecoComercio.cep).toBe("58001001")
  })
})
