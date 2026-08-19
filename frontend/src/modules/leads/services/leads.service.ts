import { apiRequest } from "../../../api/client.js"

export type LeadStatus = "NOVO" | "EMAIL_CONFIRMADO" | "EM_ONBOARDING" | "CONVERTIDO" | "DESCARTADO"

export interface Lead {
  id: string
  nomeResponsavel: string
  empresa: string
  email: string | null
  telefone: string | null
  origem: string
  status: LeadStatus
  convertidoEmpresaId: string | null
  convertidoEm: string | null
  convertidoPor: string | null
  descartadoEm: string | null
  descartadoPor: string | null
  descarteMotivo: string | null
  createdAt: string
}

export interface CriarLeadResult {
  ok: boolean
  jaExistia?: boolean
  lead?: Lead
}

export async function criarLead(data: { nomeResponsavel: string; empresa: string; email: string; telefone?: string; origem?: string }): Promise<CriarLeadResult> {
  return apiRequest<CriarLeadResult>("POST", "/leads", data)
}

export async function confirmarLead(token: string): Promise<{ ok: boolean; lead: Lead }> {
  return apiRequest<{ ok: boolean; lead: Lead }>("POST", "/leads/confirmar", { token })
}

export async function reenviarConfirmacao(email: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>("POST", "/leads/reconfirmar", { email })
}

export interface ListarLeadsResult {
  data: Lead[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

export async function listarLeads(status?: string, page = 1, limit = 50): Promise<ListarLeadsResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set("status", status)
  return apiRequest<ListarLeadsResult>("GET", `/admin/leads?${params}`)
}

export async function iniciarOnboarding(id: string): Promise<Lead> {
  return apiRequest<Lead>("POST", `/admin/leads/${id}/onboarding`)
}

export async function converterLead(id: string): Promise<{ ok: boolean; lead: Lead; empresaId: string }> {
  return apiRequest<{ ok: boolean; lead: Lead; empresaId: string }>("POST", `/admin/leads/${id}/converter`)
}

export async function descartarLead(id: string, motivo: string): Promise<Lead> {
  return apiRequest<Lead>("POST", `/admin/leads/${id}/descartar`, { motivo })
}
