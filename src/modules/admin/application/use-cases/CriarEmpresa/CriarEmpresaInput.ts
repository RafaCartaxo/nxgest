export interface CriarEmpresaInput {
  nome: string
  adminNome: string
  adminEmail: string
  adminSenhaHash: string
  /** Campos opcionais (não impedem o cadastro). */
  documento?: string | null
  nomeFantasia?: string | null
  ativa?: boolean
}