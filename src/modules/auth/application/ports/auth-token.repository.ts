import type { AuthToken, AuthTokenTipo } from "../../domain/auth-token.entity.js"

export interface IAuthTokenRepository {
  create(input: { subjectId: string; tipo: AuthTokenTipo; hash: string; expiraEm: string }): Promise<void>
  findByHashAndTipo(hash: string, tipo: AuthTokenTipo): Promise<AuthToken | null>
  marcarUsado(id: string, agora: string): Promise<void>
  /** Reenvio invalida tokens anteriores do mesmo tipo (SE-04). */
  invalidarPorTipo(subjectId: string, tipo: AuthTokenTipo): Promise<void>
}
