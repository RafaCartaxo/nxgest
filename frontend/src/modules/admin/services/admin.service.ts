import { apiRequest } from "../../../api/client.js"

export type ConviteStatus = "PENDENTE" | "CONCLUIDO" | "EXPIRADO" | "REVOGADO"

export interface OperadorRow {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  createdAt: string
  deletedAt: string | null
  totalClientes: number
  contratosAtivos: number
  chefeId?: string | null
  foto?: string | null
  /** PLAN-065: conta sem senha definida (aguardando convite). */
  status?: "convidado" | "ativo"
  /** PLAN-075: dados de contato e troca de e-mail. */
  telefone?: string | null
  emailPendente?: string | null
  /** PLAN-075 N3: usuário suspenso (conta ativa, acesso bloqueado). */
  suspensoEm?: string | null
  /** PLAN-075 P-10: status do convite mais recente (ciclo próprio). */
  conviteStatus?: ConviteStatus | null
}

export interface AdminDashboardStats {
  totalAdmins: number
  totalSocios: number
  totalOperadores: number
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  resultadoDoDia: number
}

export interface EquipeItem {
  id: string
  nome: string
  email: string
  role: "admin" | "operator" | "socio"
  totalClientes: number
  contratosAtivos: number
  recebidoHoje: number
  foto?: string | null
}

export interface EquipeResult {
  operadores: EquipeItem[]
  totais: { totalClientes: number; contratosAtivos: number; recebidoHoje: number }
}

export type ContribuicaoMetric = "clientes" | "contratos" | "recebido"

export async function listOperadores(empresaId?: string): Promise<OperadorRow[]> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<OperadorRow[]>(`GET`, `/admin/operadores${params}`)
}

export async function getOperador(id: string, empresaId?: string): Promise<OperadorRow> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<OperadorRow>(`GET`, `/admin/operadores/${id}${params}`)
}

export async function createOperador(data: { nome: string; email: string; role: "admin" | "socio" | "operator"; empresaId?: string; chefeId?: string | null; telefone?: string | null }): Promise<OperadorRow> {
  const params = data.empresaId ? `?empresaId=${data.empresaId}` : ""
  const { empresaId, ...body } = data
  return apiRequest<OperadorRow>("POST", `/admin/operadores${params}`, body)
}

/** PLAN-065: novo token + novo e-mail de convite (conta convidada). */
export async function reenviarConvite(id: string, empresaId?: string): Promise<{ ok: boolean }> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<{ ok: boolean }>("PATCH", `/admin/operadores/${id}/reenviar-convite${params}`)
}

/** PLAN-075 P-10: revoga o convite pendente — link deixa de funcionar. */
export async function revogarConvite(id: string, empresaId?: string): Promise<{ ok: boolean }> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<{ ok: boolean }>("PATCH", `/admin/operadores/${id}/revogar-convite${params}`)
}

/** PLAN-075 N3: suspende/reativa um usuário ativo. */
export async function setSuspensao(id: string, suspender: boolean, empresaId?: string): Promise<{ ok: boolean }> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  const acao = suspender ? "suspender" : "reativar"
  return apiRequest<{ ok: boolean }>("PATCH", `/admin/operadores/${id}/${acao}${params}`)
}

export async function updateOperador(id: string, data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; chefeId?: string | null; foto?: string | null; telefone?: string | null; reatribuirParaChefeId?: string | null }, empresaId?: string): Promise<OperadorRow> {
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

export async function getEquipe(empresaId?: string): Promise<EquipeResult> {
  const params = empresaId ? `?empresaId=${empresaId}` : ""
  return apiRequest<EquipeResult>("GET", `/admin/equipe${params}`)
}
