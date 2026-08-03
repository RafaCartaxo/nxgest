import type { IAdminRepository, EquipeResult } from "../../ports/admin.repository.js"

export class ListarEquipeUseCase {
  constructor(private readonly repository: IAdminRepository) {}

  async execute(empresaId: string, scopeUserIds?: string[]): Promise<EquipeResult> {
    const operadores = await this.repository.listEquipe(empresaId, scopeUserIds)

    const totais = operadores.reduce(
      (acc, op) => ({
        totalClientes: acc.totalClientes + op.totalClientes,
        contratosAtivos: acc.contratosAtivos + op.contratosAtivos,
        recebidoHoje: acc.recebidoHoje + op.recebidoHoje,
      }),
      { totalClientes: 0, contratosAtivos: 0, recebidoHoje: 0 }
    )

    return { operadores, totais }
  }
}
