import { apiRequest } from "../../../api/client.js"

export interface Empresa {
  id: string
  nome: string
  createdAt: string
  documento?: string | null
  nomeFantasia?: string | null
  ativa?: boolean
}

export interface EmpresaComStats extends Empresa {
  totalUsuarios: number
  totalClientes: number
  contratosAtivos: number
  adminNome?: string | null
  adminEmail?: string | null
  modulos?: string[] | null
  capacidades?: string[] | null
}

export interface ImpactoModuloItem {
  modulo: string
  contagem: number
  bloqueia: boolean
  detalhe: string
}

export interface ImpactoDesativacao {
  desligados: string[]
  impacto: ImpactoModuloItem[]
  bloqueado: boolean
}

export async function listEmpresas(): Promise<EmpresaComStats[]> {
  return apiRequest<EmpresaComStats[]>("GET", "/admin/empresas")
}

export async function getEmpresa(id: string): Promise<EmpresaComStats> {
  return apiRequest<EmpresaComStats>("GET", `/admin/empresas/${id}`)
}

export async function createEmpresa(data: { nome: string; documento?: string; nomeFantasia?: string; ativa?: boolean; adminNome: string; adminEmail: string; adminSenha?: string }): Promise<{ empresa: Empresa; admin: { id: string; nome: string; email: string } }> {
  return apiRequest<{ empresa: Empresa; admin: { id: string; nome: string; email: string } }>("POST", "/admin/empresas", data)
}

export async function updateEmpresa(id: string, data: { nome?: string; documento?: string | null; nomeFantasia?: string | null; ativa?: boolean }): Promise<EmpresaComStats> {
  return apiRequest<EmpresaComStats>("PATCH", `/admin/empresas/${id}`, data)
}

export async function updateEmpresaModulos(id: string, modulos: string[]): Promise<EmpresaComStats & { impacto?: ImpactoDesativacao }> {
  return apiRequest<EmpresaComStats & { impacto?: ImpactoDesativacao }>("PATCH", `/admin/empresas/${id}/modulos`, { modulos })
}

/** Aplica módulos forçando a desativação (só super admin; ecoa o impacto). */
export async function updateEmpresaModulosForcado(id: string, modulos: string[], motivo: string): Promise<EmpresaComStats & { impacto?: ImpactoDesativacao }> {
  return apiRequest<EmpresaComStats & { impacto?: ImpactoDesativacao }>("PATCH", `/admin/empresas/${id}/modulos`, { modulos, force: true, motivo })
}

export async function updateEmpresaCapacidades(id: string, capacidades: string[] | null): Promise<EmpresaComStats> {
  return apiRequest<EmpresaComStats>("PATCH", `/admin/empresas/${id}/capacidades`, { capacidades })
}

/** Prévia do impacto de desativar um conjunto de módulos (sem persistir). */
export async function getImpactoDesativacao(id: string, modulos: string[]): Promise<ImpactoDesativacao> {
  const qs = encodeURIComponent(JSON.stringify(modulos))
  return apiRequest<ImpactoDesativacao>("GET", `/admin/empresas/${id}/impacto?modulos=${qs}`)
}