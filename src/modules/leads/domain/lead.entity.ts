export const LEAD_STATUS = ["NOVO", "EMAIL_CONFIRMADO", "EM_ONBOARDING", "CONVERTIDO", "DESCARTADO"] as const
export type LeadStatus = (typeof LEAD_STATUS)[number]

export const LEAD_ORIGENS = ["Site", "WhatsApp", "Instagram", "Indicacao", "Manual"] as const
export type LeadOrigem = (typeof LEAD_ORIGENS)[number]

export interface Lead {
  id: string
  nomeResponsavel: string
  empresa: string
  /** Anonimizado no descarte (LGPD). */
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
