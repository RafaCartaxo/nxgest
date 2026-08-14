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
  /** PLAN-075 (P-09): telefone opcional. */
  telefone: string | null
  /** PLAN-075 (F4): e-mail aguardando verificação (troca pendente). */
  emailPendente: string | null
  /** PLAN-075 (N3): não-nulo = conta suspensa. */
  suspensoEm: string | null
  /** PLAN-065: conta sem senha definida (aguardando convite). */
  status: "convidado" | "ativo"
  /** PLAN-075 (N1.10): estado do convite mais recente (exposição para listagem/UI). */
  conviteStatus: "PENDENTE" | "CONCLUIDO" | "EXPIRADO" | "REVOGADO" | null
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
  /** Dedup global (N1.6): `email` ou `email_pendente` de outro usuário. */
  emailEmUso(email: string, ignoreId?: string | null): Promise<boolean>
  create(input: { nome: string; email: string; role: "super_admin" | "admin" | "socio" | "operator"; empresaId: string | null; chefeId?: string | null; telefone?: string | null }): Promise<OperadorRow>
  update(id: string, data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; chefeId?: string | null; foto?: string | null; telefone?: string | null; emailPendente?: string | null; suspensoEm?: string | null; reatribuirParaChefeId?: string | null }, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow | null>
  softDelete(id: string, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<void>
  getDashboardStats(empresaId?: string | null, userId?: string | null, scopeUserIds?: string[]): Promise<AdminDashboardStats>
  listEquipe(empresaId: string | null, scopeUserIds?: string[]): Promise<EquipeItem[]>
  /** Subárvore hierárquica: chefe + descendentes (PLAN-032). */
  subarvoreIds(chefeId: string): Promise<string[]>
}
