import { describe, expect, it } from "vitest"
import { updateClienteSchema } from "./UpdateClienteInput.js"

describe("updateClienteSchema — CEP", () => {
  it("aceita CEP válido no endereço pessoal e comercial", () => {
    const result = updateClienteSchema.safeParse({
      endereco: { cep: "58000000" }, enderecoComercio: { cep: "58001000" },
    })
    expect(result.success).toBe(true)
  })

  it("rejeita CEP que não tem oito dígitos", () => {
    const result = updateClienteSchema.safeParse({ endereco: { cep: "58000" } })
    expect(result.success).toBe(false)
  })
})
