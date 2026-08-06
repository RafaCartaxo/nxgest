export interface Usuario {
  id: string
  nome: string
  email: string
  senhaHash: string
  role: "super_admin" | "admin" | "socio" | "operator"
  createdAt: string
  deletedAt: string | null
  empresaId: string | null
  chefeId: string | null
  foto: string | null
}
