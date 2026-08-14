export type AuthTokenTipo = "convite" | "reset" | "lead" | "email"

export interface AuthToken {
  id: string
  /** Id do sujeito (usuário; p/ lead no PLAN-064). */
  subjectId: string
  tipo: AuthTokenTipo
  /** Hash SHA-256 do token (nunca o token em texto). */
  hash: string
  expiraEm: string
  usadoEm: string | null
  createdAt: string
}
