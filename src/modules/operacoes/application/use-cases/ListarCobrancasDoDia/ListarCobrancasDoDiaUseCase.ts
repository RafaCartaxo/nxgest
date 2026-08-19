import type { IOperacoesRepository, CobrancaDoDiaResult } from "../../ports/operacoes.repository.js"

export class ListarCobrancasDoDiaUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult> {
    // PLAN-083 Fase 1.4: snapshot de atraso saiu do GET (escrita em leitura) — passa a ser
    // registrado sob demanda em ListarHistoricoAtrasosUseCase.
    return this.repo.listarCobrancasDoDia(userId, operadorLat, operadorLng)
  }
}
