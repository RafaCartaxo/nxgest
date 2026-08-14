import type { Convite, ConviteStatus } from "../../domain/convite.entity.js"

export interface CriarConviteInput {
  usuarioId: string
  emailAlvo: string
  criadoPor?: string | null
  roleAlvo?: string | null
  idioma: string
  tokenHash: string
  expiraEm: string
}

export interface IConviteRepository {
  /**
   * Cria um convite invalidando os anteriores PENDENTE do mesmo usuário dentro da mesma
   * transação — invariante "nunca dois convites válidos simultaneamente" (N2).
   */
  create(input: CriarConviteInput): Promise<Convite>
  findByHash(hash: string): Promise<Convite | null>
  /** Convite PENDENTE mais recente do usuário (listagem/UI). */
  findValidoPorUsuario(usuarioId: string): Promise<Convite | null>
  /** Status do convite mais recente por usuário (listagem de operadores). */
  statusPorUsuario(userIds: string[]): Promise<Map<string, ConviteStatus | null>>
  /** Marca usado + CONCLUIDO (ativação concluída). */
  marcarUsado(id: string, agora: string): Promise<void>
  /** Marca EXPIRADO (lazy-expire — N1.10). */
  marcarExpirado(id: string): Promise<void>
  /** Revoga um convite PENDENTE (ação administrativa — P-10). */
  revogar(id: string, agora: string): Promise<void>
  /** Invalida os PENDENTE atuais do usuário (reescrito por novo convite/revogação). */
  invalidarAtivos(usuarioId: string): Promise<void>
}