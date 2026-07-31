import { apiRequest } from "../../../api/client.js"

export interface OperadorRow {
  id: string
  nome: string
  email: string
  role: "admin" | "operator"
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

export async function createOperador(data: { nome: string; email: string; senha: string; role: "admin" | "operator"; empresaId?: string }): Promise<OperadorRow> {
  return apiRequest<OperadorRow>("POST", "/admin/operadores", data)
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
