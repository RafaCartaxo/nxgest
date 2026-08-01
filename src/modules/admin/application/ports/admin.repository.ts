export interface OperadorRow {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "operator"
  createdAt: string
  deletedAt: string | null
  totalClientes: number
  contratosAtivos: number
  empresaId: string | null
}

export interface AdminDashboardStats {
  totalAdmins: number
  totalOperadores: number
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  resultadoDoDia: number
}

export interface IAdminRepository {
  findAllOperadores(empresaId?: string | null): Promise<OperadorRow[]>
  findById(id: string, empresaId?: string | null): Promise<OperadorRow | null>
  findByEmail(email: string): Promise<OperadorRow | null>
  create(input: { nome: string; email: string; senhaHash: string; role: "super_admin" | "admin" | "operator"; empresaId: string | null }): Promise<OperadorRow>
  update(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senhaHash?: string }, currentUserId: string, empresaId?: string | null): Promise<OperadorRow | null>
  softDelete(id: string, currentUserId: string, empresaId?: string | null): Promise<void>
  getDashboardStats(empresaId?: string | null, userId?: string | null): Promise<AdminDashboardStats>
}
