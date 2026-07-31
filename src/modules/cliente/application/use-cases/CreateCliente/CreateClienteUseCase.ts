import { v4 as uuid } from "uuid"
import type { IClienteRepository } from "../../ports/cliente.repository.js"
import type { CreateClienteInput } from "./CreateClienteInput.js"
import { CpfDuplicadoError } from "../../../domain/errors/cpf-duplicado.error.js"

export class CreateClienteUseCase {
  constructor(private readonly repository: IClienteRepository) {}

  async execute(userId: string, input: CreateClienteInput) {
    if (input.cpf) {
      const existente = await this.repository.findByCpf(userId, input.cpf)
      if (existente) {
        throw new CpfDuplicadoError(input.cpf)
      }
    }

    const now = new Date().toISOString()

    const cliente = {
      id: uuid(),
      nome: input.nome,
      cpf: input.cpf,
      comercio: input.comercio,
      telefone: input.telefone,
      telefoneComercio: input.telefoneComercio,
      endereco: input.endereco,
      enderecoComercio: input.enderecoComercio,
      localizacaoComercio: input.localizacaoComercio ?? null,
      createdAt: now,
      updatedAt: now,
    }

    await this.repository.save(userId, cliente)

    return cliente
  }
}
