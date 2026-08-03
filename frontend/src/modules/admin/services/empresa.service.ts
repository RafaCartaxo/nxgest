import { apiRequest } from "../../../api/client.js"

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
  modulos?: string[] | null
}

export async function listEmpresas(): Promise<EmpresaComStats[]> {
  return apiRequest<EmpresaComStats[]>("GET", "/admin/empresas")
}

export async function getEmpresa(id: string): Promise<EmpresaComStats> {
  return apiRequest<EmpresaComStats>("GET", `/admin/empresas/${id}`)
}

export async function createEmpresa(data: { nome: string; adminNome: string; adminEmail: string; adminSenha: string }): Promise<{ empresa: Empresa; admin: { id: string; nome: string; email: string } }> {
  return apiRequest<{ empresa: Empresa; admin: { id: string; nome: string; email: string } }>("POST", "/admin/empresas", data)
}

export async function updateEmpresaModulos(id: string, modulos: string[]): Promise<EmpresaComStats> {
  return apiRequest<EmpresaComStats>("PATCH", `/admin/empresas/${id}/modulos`, { modulos })
}