export interface Usuario {
  id: string
  nome: string
  email: string
  /** Nullable (PLAN-065): convidado ainda não definiu senha. */
  senhaHash: string | null
  role: "super_admin" | "admin" | "socio" | "operator"
  createdAt: string
  deletedAt: string | null
  empresaId: string | null
  chefeId: string | null
  foto: string | null
}
