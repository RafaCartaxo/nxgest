import type { Usuario } from "../../domain/usuario.entity.js"

export type Role = "super_admin" | "admin" | "socio" | "operator"

export interface PerfilAlteravel {
  nome?: string
  telefone?: string | null
}

export interface IAuthRepository {
  findByEmail(email: string): Promise<Usuario | null>
  findById(id: string): Promise<Usuario | null>
  /**
   * Dedup global de e-mail (PLAN-075 N1.6): `email` OU `email_pendente` de OUTRO usuário.
   * `ignoreId` = usuário em edição (não conta contra si mesmo).
   */
  emailEmUso(email: string, ignoreId?: string | null): Promise<boolean>
  create(input: { nome: string; email: string; senhaHash: string; role: Role; empresaId?: string | null; chefeId?: string | null }): Promise<Usuario>
  updateSenha(id: string, senhaHash: string): Promise<void>
  updateFoto(id: string, foto: string | null): Promise<void>
  /** Autosserviço (F3 — PLAN-075): nome/telefone do próprio usuário. */
  updatePerfil(id: string, data: PerfilAlteravel): Promise<Usuario | null>
  /** Seta/limpa o e-mail pendente de troca (F4). */
  setEmailPendente(id: string, emailPendente: string | null): Promise<void>
  /** Promove `email_pendente → email` após verificação (F4). */
  confirmarEmail(id: string): Promise<void>
  /** Troca direta do e-mail (admin em usuário convidado — P-06). */
  updateEmail(id: string, email: string): Promise<void>
  /** Suspende (`suspensoEm` = data) ou reativa (`null`) a conta. */
  setSuspenso(id: string, suspensoEm: string | null): Promise<void>
}