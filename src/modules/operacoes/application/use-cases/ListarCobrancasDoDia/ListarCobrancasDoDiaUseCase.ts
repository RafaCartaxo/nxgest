import type { IOperacoesRepository, CobrancaDoDiaResult } from "../../ports/operacoes.repository.js"

export class ListarCobrancasDoDiaUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult> {
    return this.repo.listarCobrancasDoDia(userId, operadorLat, operadorLng)
  }
}
