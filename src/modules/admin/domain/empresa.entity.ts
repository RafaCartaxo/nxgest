export interface Empresa {
  id: string
  nome: string
  createdAt: string
  /** CNPJ/documento (opcional — não impede cadastro). */
  documento?: string | null
  /** Nome fantasia (opcional — usado no card/whitelabel). */
  nomeFantasia?: string | null
  /** Situação da empresa (opcional; default ativa). */
  ativa?: boolean
}

export interface EmpresaComStats extends Empresa {
  totalUsuarios: number
  totalClientes: number
  contratosAtivos: number
  adminNome?: string | null
  adminEmail?: string | null
  /** Módulos ativos da empresa (whitelabel, PLAN-031). `null` = todos ativos. */
  modulos?: string[] | null
  /** Capacidades (recursos finos) da empresa. `null` = todas ativas; `[]` = nenhuma. */
  capacidades?: string[] | null
}