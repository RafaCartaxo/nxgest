import type { IClienteRepository } from "../../ports/cliente.repository.js"
import { ClienteNotFoundError } from "../../../domain/errors/cliente-not-found.error.js"
import { CpfDuplicadoError } from "../../../domain/errors/cpf-duplicado.error.js"
import type { UpdateClienteInput } from "./UpdateClienteInput.js"
import type { Cliente } from "../../../domain/cliente.entity.js"

export class UpdateClienteUseCase {
  constructor(private readonly repository: IClienteRepository) {}

  async execute(userId: string, id: string, input: UpdateClienteInput) {
    const existing = await this.repository.findById(userId, id)

    if (!existing) {
      throw new ClienteNotFoundError(id)
    }

    if (input.cpf !== undefined && input.cpf !== existing.cpf) {
      const existente = await this.repository.findByCpf(userId, input.cpf)
      if (existente) {
        throw new CpfDuplicadoError(input.cpf)
      }
    }

    const data: Partial<Cliente> = {}

    if (input.nome !== undefined) data.nome = input.nome
    if (input.cpf !== undefined) data.cpf = input.cpf
    if (input.comercio !== undefined) data.comercio = input.comercio
    if (input.telefone !== undefined) data.telefone = input.telefone
    if (input.telefoneComercio !== undefined) data.telefoneComercio = input.telefoneComercio

    if (input.endereco !== undefined) {
      data.endereco = {
        logradouro: input.endereco.logradouro ?? existing.endereco.logradouro,
        numero: input.endereco.numero,
        complemento: input.endereco.complemento,
        bairro: input.endereco.bairro,
        cidade: input.endereco.cidade,
        estado: input.endereco.estado,
      }
    }

    if (input.enderecoComercio !== undefined) {
      data.enderecoComercio = input.enderecoComercio ?? null
    }

    if (input.localizacao !== undefined) {
      data.localizacao = input.localizacao ?? null
    }

    if (input.foto !== undefined) data.foto = input.foto

    if (input.localizacaoComercio !== undefined) {
      data.localizacaoComercio = input.localizacaoComercio ?? null
    }

    data.updatedAt = new Date().toISOString()

    const updated = await this.repository.update(userId, id, data)

    if (!updated) {
      throw new ClienteNotFoundError(id)
    }

    return updated
  }
}
