export interface OperadorRow {
  id: string
  nome: string
  email: string
  role: "admin" | "operator"
  createdAt: string
  deletedAt: string | null
  totalClientes: number
  contratosAtivos: number
}

export interface AdminDashboardStats {
  totalOperadores: number
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  resultadoDoDia: number
}

export interface IAdminRepository {
  findAllOperadores(): Promise<OperadorRow[]>
  findById(id: string): Promise<OperadorRow | null>
  findByEmail(email: string): Promise<OperadorRow | null>
  create(input: { nome: string; email: string; senhaHash: string; role: "admin" | "operator" }): Promise<OperadorRow>
  update(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senhaHash?: string }, currentUserId: string): Promise<OperadorRow | null>
  softDelete(id: string, currentUserId: string): Promise<void>
  getDashboardStats(): Promise<AdminDashboardStats>
}
