export interface Usuario {
  id: string
  nome: string
  email: string
  /** E-mail aguardando verificação (troca pendente — PLAN-075). Nulo sem troca. */
  emailPendente: string | null
  /** Nullable (PLAN-065): convidado ainda não definiu senha. */
  senhaHash: string | null
  role: "super_admin" | "admin" | "socio" | "operator"
  createdAt: string
  deletedAt: string | null
  empresaId: string | null
  chefeId: string | null
  foto: string | null
  /** Telefone opcional (P-09 — PLAN-075). */
  telefone: string | null
  /** Não-nulo = conta suspensa (N3 — PLAN-075). */
  suspensoEm: string | null
}