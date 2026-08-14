import type { CriarEmpresaInput } from "./CriarEmpresaInput.js"
import type { IEmpresaRepository } from "../../ports/empresa.repository.js"

export class CriarEmpresaUseCase {
  constructor(private readonly empresaRepository: IEmpresaRepository) {}

  async execute(input: CriarEmpresaInput) {
    return this.empresaRepository.create({
      nome: input.nome,
      documento: input.documento,
      nomeFantasia: input.nomeFantasia,
      ativa: input.ativa,
      adminNome: input.adminNome,
      adminEmail: input.adminEmail,
      adminTelefone: input.adminTelefone,
      origem: input.origem,
      emailContato: input.emailContato,
      telefoneContato: input.telefoneContato,
    })
  }
}