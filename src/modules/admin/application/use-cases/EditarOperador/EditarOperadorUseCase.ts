import type { IAdminRepository } from "../../ports/admin.repository.js"
import { EmailDuplicadoError } from "../../../../auth/domain/errors/auth.error.js"
import { NaoPodeAutoModificarError } from "../../../domain/errors/admin.error.js"

export class EditarOperadorUseCase {
  constructor(private readonly repo: IAdminRepository) {}

  async execute(
    id: string,
    data: {
      nome?: string
      email?: string
      role?: "admin" | "socio" | "operator"
      chefeId?: string | null
      foto?: string | null
      telefone?: string | null
      emailPendente?: string | null
      suspensoEm?: string | null
      reatribuirParaChefeId?: string | null
    },
    currentUserId: string,
    empresaId?: string | null,
    scopeUserIds?: string[]
  ) {
    const existing = await this.repo.findById(id, empresaId, scopeUserIds)
    if (!existing) throw new Error("Operador não encontrado.")
    // R4: ninguém suspende/reativa a própria conta (defesa em profundidade — o
    // controller também bloqueia; aqui valida no use case independente de rota).
    if (data.suspensoEm !== undefined && id === currentUserId) {
      throw new NaoPodeAutoModificarError("Você não pode suspender ou reativar a própria conta.")
    }
    // Rede de segurança da dedup (N1.6) também no use case — o repositório re-valida.
    if (data.email !== undefined && data.email !== existing.email) {
      const emUso = await this.repo.emailEmUso(data.email, id)
      if (emUso) throw new EmailDuplicadoError()
    }
    // Troca administrativa de usuário ATIVO usa email_pendente (P-07) — valida o pendente também.
    if (data.emailPendente !== undefined && data.emailPendente !== null && data.emailPendente !== existing.email && data.emailPendente !== existing.emailPendente) {
      const emUso = await this.repo.emailEmUso(data.emailPendente, id)
      if (emUso) throw new EmailDuplicadoError()
    }
    return this.repo.update(id, data, currentUserId, empresaId, scopeUserIds)
  }
}