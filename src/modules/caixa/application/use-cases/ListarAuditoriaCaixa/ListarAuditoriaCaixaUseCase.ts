import type { ICaixaRepository } from "../../ports/caixa.repository.js"
import type { ListarAuditoriaCaixaInput } from "./ListarAuditoriaCaixaInput.js"

export class ListarAuditoriaCaixaUseCase {
  constructor(private readonly repository: ICaixaRepository) {}

  async execute(operadorId: string, input: ListarAuditoriaCaixaInput) {
    return this.repository.listAuditoriaCaixa(operadorId, input)
  }
}
