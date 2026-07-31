import type { IOperacoesRepository, RegistrarVisitaInput, RegistrarVisitaOutput } from "../../ports/operacoes.repository.js"

export class RegistrarVisitaUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, input: RegistrarVisitaInput): Promise<RegistrarVisitaOutput> {
    return this.repo.registrarVisita(userId, input)
  }
}
