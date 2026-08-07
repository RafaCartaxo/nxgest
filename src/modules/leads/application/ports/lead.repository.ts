import type { Lead } from "../../domain/lead.entity.js"

export interface CriarLeadInput {
  nomeResponsavel: string
  empresa: string
  email: string
  telefone?: string | null
  origem?: string
}

export interface ILeadRepository {
  create(input: CriarLeadInput): Promise<Lead>
  findByEmail(email: string): Promise<Lead | null>
  findById(id: string): Promise<Lead | null>
  list(status?: string): Promise<Lead[]>
  updateStatus(id: string, status: Lead["status"]): Promise<Lead | null>
  marcarConfirmado(id: string): Promise<Lead | null>
  marcarConvertido(id: string, data: { empresaId: string; por: string }): Promise<Lead | null>
  /** Descarte (LGPD): anonimiza dados pessoais e registra motivo/quem/quando. */
  descartar(id: string, data: { por: string; motivo: string }): Promise<Lead | null>
  /** Remove o lead (rollback quando o e-mail de confirmação falha). */
  deleteById(id: string): Promise<void>
}
