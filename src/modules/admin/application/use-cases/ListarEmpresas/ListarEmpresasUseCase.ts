import type { IEmpresaRepository } from "../../ports/empresa.repository.js"

export class ListarEmpresasUseCase {
  constructor(private readonly empresaRepository: IEmpresaRepository) {}

  async execute() {
    return this.empresaRepository.findAll()
  }
}