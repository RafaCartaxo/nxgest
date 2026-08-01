import { apiRequest } from "../../../api/client.js"

export interface OperadorRow {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "operator"
  createdAt: string
  deletedAt: string | null
  totalClientes: number
  contratosAtivos: number
}

export interface AdminDashboardStats {
  totalOperadores: number
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  resultadoDoDia: number
}

export async function listOperadores(empresaId?: string): Promise<OperadorRow[]> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<OperadorRow[]>(`GET`, `/admin/operadores${params}`)
}

export async function getOperador(id: string, empresaId?: string): Promise<OperadorRow> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<OperadorRow>(`GET`, `/admin/operadores/${id}${params}`)
}

export async function createOperador(data: { nome: string; email: string; senha: string; role: "admin" | "operator"; empresaId?: string }): Promise<OperadorRow> {
  const params = data.empresaId ? `?empresaId=${data.empresaId}` : ""
  const { empresaId, ...body } = data
  return apiRequest<OperadorRow>("POST", `/admin/operadores${params}`, body)
}

export async function updateOperador(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senha?: string }, empresaId?: string): Promise<OperadorRow> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<OperadorRow>("PATCH", `/admin/operadores/${id}${params}`, data)
}

export async function deleteOperador(id: string, empresaId?: string): Promise<void> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<void>("DELETE", `/admin/operadores/${id}${params}`)
}

export async function getDashboard(empresaId?: string): Promise<AdminDashboardStats> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<AdminDashboardStats>("GET", `/admin/dashboard${params}`)
}
