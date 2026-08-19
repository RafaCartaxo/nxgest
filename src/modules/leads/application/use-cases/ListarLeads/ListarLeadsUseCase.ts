import type { ILeadRepository, ListLeadsParams, ListLeadsResult } from "../../ports/lead.repository.js"

export class ListarLeadsUseCase {
  constructor(private repo: ILeadRepository) {}

  async execute(params: ListLeadsParams): Promise<ListLeadsResult> {
    return this.repo.list(params)
  }
}
