/** Ciclo de vida do convite (PLAN-075 N1.1/P-10): o convite controla o processo de ativação. */
export type ConviteStatus = "PENDENTE" | "CONCLUIDO" | "EXPIRADO" | "REVOGADO"

export interface Convite {
  id: string
  /** Usuário convidado (a conta nasce sempre CONVIDADO). */
  usuarioId: string
  /** E-mail para o qual o convite foi enviado (N1.7 — binding na ativação). */
  emailAlvo: string
  /** Quem convidou (auditoria — N8). */
  criadoPor: string | null
  /** Apenas informativo/auditoria (N1.2 — nunca autoritativo). */
  roleAlvo: string | null
  /** Idioma do e-mail de convite (N1.9). */
  idioma: string
  status: ConviteStatus
  /** Hash SHA-256 do token (padrão SE-01 do projeto). */
  tokenHash: string
  criadoEm: string
  expiraEm: string
  usadoEm: string | null
  revogadoEm: string | null
}