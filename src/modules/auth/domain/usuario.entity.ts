export interface Usuario {
  id: string
  nome: string
  email: string
  senhaHash: string
  role: "super_admin" | "admin" | "operator"
  createdAt: string
  deletedAt: string | null
  empresaId: string | null
}
