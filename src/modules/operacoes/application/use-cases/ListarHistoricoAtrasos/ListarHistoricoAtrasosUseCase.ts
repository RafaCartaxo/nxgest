import type { IOperacoesRepository, SnapshotAtraso } from "../../ports/operacoes.repository.js"

export class ListarHistoricoAtrasosUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, dias?: number): Promise<SnapshotAtraso[]> {
    return this.repo.listarHistoricoAtrasos(userId, dias)
  }
}
