export interface Usuario {
  id: string
  nome: string
  email: string
  senhaHash: string
  role: "admin" | "operator"
  createdAt: string
  deletedAt: string | null
}
