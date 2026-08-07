export interface CriarEmpresaInput {
  nome: string
  adminNome: string
  adminEmail: string
  /** Nullable (PLAN-065): sem senha = admin convidado (recebe convite). */
  adminSenhaHash: string | null
  /** Campos opcionais (não impedem o cadastro). */
  documento?: string | null
  nomeFantasia?: string | null
  ativa?: boolean
}