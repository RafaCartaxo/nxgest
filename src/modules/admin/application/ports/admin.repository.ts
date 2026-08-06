export interface OperadorRow {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  createdAt: string
  deletedAt: string | null
  totalClientes: number
  contratosAtivos: number
  empresaId: string | null
  chefeId: string | null
  foto: string | null
}

export interface AdminDashboardStats {
  totalAdmins: number
  totalSocios: number
  totalOperadores: number
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  resultadoDoDia: number
}

export interface EquipeItem {
  id: string
  nome: string
  email: string
  role: "admin" | "operator" | "socio"
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  foto: string | null
}

export interface EquipeResult {
  operadores: EquipeItem[]
  totais: {
    totalClientes: number
    contratosAtivos: number
    recebidoHoje: number
  }
}

export interface IAdminRepository {
  findAllOperadores(empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow[]>
  findById(id: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow | null>
  findByEmail(email: string): Promise<OperadorRow | null>
  create(input: { nome: string; email: string; senhaHash: string; role: "super_admin" | "admin" | "socio" | "operator"; empresaId: string | null; chefeId?: string | null }): Promise<OperadorRow>
  update(id: string, data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; senhaHash?: string; chefeId?: string | null; foto?: string | null }, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow | null>
  softDelete(id: string, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<void>
  getDashboardStats(empresaId?: string | null, userId?: string | null, scopeUserIds?: string[]): Promise<AdminDashboardStats>
  listEquipe(empresaId: string | null, scopeUserIds?: string[]): Promise<EquipeItem[]>
  /** Subárvore hierárquica: chefe + descendentes (PLAN-032). */
  subarvoreIds(chefeId: string): Promise<string[]>
}
