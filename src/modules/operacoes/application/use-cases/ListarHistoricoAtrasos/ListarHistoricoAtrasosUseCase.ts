import type { IOperacoesRepository, SnapshotAtraso } from "../../ports/operacoes.repository.js"

export class ListarHistoricoAtrasosUseCase {
  constructor(private repo: IOperacoesRepository) {}

  async execute(userId: string, dias?: number): Promise<SnapshotAtraso[]> {
    // PLAN-083 Fase 1.4: o snapshot do dia atual é registrado sob demanda, ao abrir a view
    // de histórico (upsert ON CONFLICT mantém 1 registro/dia). Falha não quebra a listagem.
    try {
      await this.repo.registrarSnapshotAtraso(userId)
    } catch {
      // snapshot é efeito colateral — falha não deve quebrar a listagem
    }
    return this.repo.listarHistoricoAtrasos(userId, dias)
  }
}
