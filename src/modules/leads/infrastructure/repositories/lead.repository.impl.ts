import { eq, and } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { db, leads } from "../../../../database.js"
import type { Lead, LeadStatus } from "../../domain/lead.entity.js"
import type { CriarLeadInput, ILeadRepository } from "../../application/ports/lead.repository.js"

const toLead = (r: typeof leads.$inferSelect): Lead => ({
  id: r.id,
  nomeResponsavel: r.nomeResponsavel,
  empresa: r.empresa,
  email: r.email,
  telefone: r.telefone,
  origem: r.origem,
  status: r.status as LeadStatus,
  convertidoEmpresaId: r.convertidoEmpresaId,
  convertidoEm: r.convertidoEm,
  convertidoPor: r.convertidoPor,
  descartadoEm: r.descartadoEm,
  descartadoPor: r.descartadoPor,
  descarteMotivo: r.descarteMotivo,
  createdAt: r.createdAt,
})

export class LeadRepository implements ILeadRepository {
  async create(input: CriarLeadInput): Promise<Lead> {
    const id = uuid()
    await db.insert(leads).values({
      id,
      nomeResponsavel: input.nomeResponsavel,
      empresa: input.empresa,
      email: input.email,
      telefone: input.telefone ?? null,
      origem: input.origem ?? "Site",
      status: "NOVO",
      convertidoEmpresaId: null,
      convertidoEm: null,
      convertidoPor: null,
      descartadoEm: null,
      descartadoPor: null,
      descarteMotivo: null,
      createdAt: new Date().toISOString(),
    }).run()
    const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
    return toLead(row)
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const rows = await db.select().from(leads).where(eq(leads.email, email)).limit(1)
    if (!rows[0]) return null
    return toLead(rows[0])
  }

  async findById(id: string): Promise<Lead | null> {
    const rows = await db.select().from(leads).where(eq(leads.id, id)).limit(1)
    if (!rows[0]) return null
    return toLead(rows[0])
  }

  async list(status?: string): Promise<Lead[]> {
    const rows = status
      ? await db.select().from(leads).where(and(eq(leads.status, status as LeadStatus))).orderBy(leads.createdAt)
      : await db.select().from(leads).orderBy(leads.createdAt)
    return rows.map(toLead)
  }

  async updateStatus(id: string, status: Lead["status"]): Promise<Lead | null> {
    await db.update(leads).set({ status }).where(eq(leads.id, id)).run()
    return this.findById(id)
  }

  async marcarConfirmado(id: string): Promise<Lead | null> {
    await db.update(leads).set({ status: "EMAIL_CONFIRMADO" }).where(eq(leads.id, id)).run()
    return this.findById(id)
  }

  async marcarConvertido(id: string, data: { empresaId: string; por: string }): Promise<Lead | null> {
    await db.update(leads).set({
      status: "CONVERTIDO",
      convertidoEmpresaId: data.empresaId,
      convertidoEm: new Date().toISOString(),
      convertidoPor: data.por,
    }).where(eq(leads.id, id)).run()
    return this.findById(id)
  }

  async descartar(id: string, data: { por: string; motivo: string }): Promise<Lead | null> {
    await db.update(leads).set({
      status: "DESCARTADO",
      // LGPD: remove os dados pessoais; e-mail vira marcador anônimo único (mantém dedup futuro).
      nomeResponsavel: "—",
      email: `descartado-${id}@descartado.local`,
      telefone: null,
      descartadoEm: new Date().toISOString(),
      descartadoPor: data.por,
      descarteMotivo: data.motivo,
    }).where(eq(leads.id, id)).run()
    return this.findById(id)
  }

  async deleteById(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id)).run()
  }
}
