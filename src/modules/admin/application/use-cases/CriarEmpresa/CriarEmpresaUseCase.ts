import type { CriarEmpresaInput } from "./CriarEmpresaInput.js"
import type { IEmpresaRepository } from "../../ports/empresa.repository.js"

export class CriarEmpresaUseCase {
  constructor(private readonly empresaRepository: IEmpresaRepository) {}

  async execute(input: CriarEmpresaInput) {
    return this.empresaRepository.create({
      nome: input.nome,
      adminNome: input.adminNome,
      adminEmail: input.adminEmail,
      adminSenhaHash: input.adminSenhaHash,
    })
  }
}