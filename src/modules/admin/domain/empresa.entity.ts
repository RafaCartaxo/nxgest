export interface Empresa {
  id: string
  nome: string
  createdAt: string
}

export interface EmpresaComStats extends Empresa {
  totalUsuarios: number
  totalClientes: number
  contratosAtivos: number
  adminNome?: string | null
  adminEmail?: string | null
  /** Módulos ativos da empresa (whitelabel, PLAN-031). `null` = todos ativos. */
  modulos?: string[] | null
}