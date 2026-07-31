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

export async function listOperadores(): Promise<OperadorRow[]> {
  return apiRequest<OperadorRow[]>("GET", "/admin/operadores")
}

export async function createOperador(data: { nome: string; email: string; senha: string; role: "admin" | "operator" }): Promise<OperadorRow> {
  return apiRequest<OperadorRow>("POST", "/admin/operadores", data)
}

export async function updateOperador(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senha?: string }): Promise<OperadorRow> {
  return apiRequest<OperadorRow>("PATCH", `/admin/operadores/${id}`, data)
}

export async function deleteOperador(id: string): Promise<void> {
  return apiRequest<void>("DELETE", `/admin/operadores/${id}`)
}

export async function getDashboard(): Promise<AdminDashboardStats> {
  return apiRequest<AdminDashboardStats>("GET", "/admin/dashboard")
}
