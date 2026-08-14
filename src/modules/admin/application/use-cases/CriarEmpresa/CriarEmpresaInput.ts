export interface CriarEmpresaInput {
  nome: string
  adminNome: string
  adminEmail: string
  /** PLAN-075 (F7): telefone do admin/seeded (origem: lead.atributos.telefone). */
  adminTelefone?: string | null
  /** PLAN-075 (F7): campos de contato/origem seedados na conversão de lead. */
  origem?: string | null
  emailContato?: string | null
  telefoneContato?: string | null
  /** Campos opcionais (não impedem o cadastro). */
  documento?: string | null
  nomeFantasia?: string | null
  ativa?: boolean
}