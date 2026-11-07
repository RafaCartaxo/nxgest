import { describe, expect, it } from "vitest"
import { createClienteSchema } from "./CreateClienteInput.js"

describe("createClienteSchema — CEP", () => {
  it("aceita CEP válido no endereço pessoal e comercial", () => {
    const result = createClienteSchema.safeParse({
      nome: "Maria Silva", comercio: "Padaria", telefone: "83988887777",
      endereco: { cep: "58000000" }, enderecoComercio: { cep: "58001000" },
    })
    expect(result.success).toBe(true)
  })

  it("rejeita CEP que não tem oito dígitos", () => {
    const result = createClienteSchema.safeParse({
      nome: "Maria Silva", comercio: "Padaria", telefone: "83988887777",
      endereco: { cep: "58000" },
    })
    expect(result.success).toBe(false)
  })
})
