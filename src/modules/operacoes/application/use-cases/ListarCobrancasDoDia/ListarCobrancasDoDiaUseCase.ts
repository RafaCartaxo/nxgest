import type { IOperacoesRepository, CobrancaDoDiaResult } from "../../ports/operacoes.repository.js"

export class ListarCobrancasDoDiaUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult> {
    const result = await this.repo.listarCobrancasDoDia(userId, operadorLat, operadorLng)
    try {
      await this.repo.registrarSnapshotAtraso(userId)
    } catch {
      // snapshot é efeito colateral — falha não deve quebrar a listagem
    }
    return result
  }
}
