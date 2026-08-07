import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { Lead } from "../../../domain/lead.entity.js"

export class ListarLeadsUseCase {
  constructor(private repo: ILeadRepository) {}

  async execute(status?: string): Promise<Lead[]> {
    return this.repo.list(status)
  }
}
