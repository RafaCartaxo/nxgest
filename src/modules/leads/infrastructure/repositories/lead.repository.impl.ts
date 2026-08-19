import { eq, and, sql } from "drizzle-orm"
import { v4 as uuid } from "uuid"
import { db, leads } from "../../../../database.js"
import type { Lead, LeadStatus } from "../../domain/lead.entity.js"
import type { CriarLeadInput, ILeadRepository, ListLeadsParams, ListLeadsResult } from "../../application/ports/lead.repository.js"

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
    })
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

  async list(params: ListLeadsParams): Promise<ListLeadsResult> {
    const offset = (params.page - 1) * params.limit
    const conds = []
    if (params.status) conds.push(eq(leads.status, params.status as LeadStatus))
    // PLAN-083 Fase 6.3: busca sem acento por nome/empresa/email/telefone (mesmo padrão de clientes).
    if (params.q) {
      conds.push(sql`(
        f_unaccent(${leads.nomeResponsavel}) ILIKE '%' || f_unaccent(${params.q}) || '%'
        OR f_unaccent(${leads.empresa}) ILIKE '%' || f_unaccent(${params.q}) || '%'
        OR f_unaccent(${leads.email}) ILIKE '%' || f_unaccent(${params.q}) || '%'
        OR f_unaccent(${leads.telefone}) ILIKE '%' || f_unaccent(${params.q}) || '%'
      )`)
    }
    const where = conds.length > 0 ? and(...conds) : undefined
    const rows = await db
      .select({
        lead: leads,
        total: sql<number>`COUNT(*) OVER()`,
      })
      .from(leads)
      .where(where)
      .orderBy(leads.createdAt)
      .limit(params.limit)
      .offset(offset)
    const total = rows.length > 0 ? Number(rows[0].total) : 0
    return {
      data: rows.map((r) => toLead(r.lead)),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    }
  }

  async updateStatus(id: string, status: Lead["status"]): Promise<Lead | null> {
    await db.update(leads).set({ status }).where(eq(leads.id, id))
    return this.findById(id)
  }

  async marcarConfirmado(id: string): Promise<Lead | null> {
    await db.update(leads).set({ status: "EMAIL_CONFIRMADO" }).where(eq(leads.id, id))
    return this.findById(id)
  }

  async marcarConvertido(id: string, data: { empresaId: string; por: string }): Promise<Lead | null> {
    await db.update(leads).set({
      status: "CONVERTIDO",
      convertidoEmpresaId: data.empresaId,
      convertidoEm: new Date().toISOString(),
      convertidoPor: data.por,
    }).where(eq(leads.id, id))
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
    }).where(eq(leads.id, id))
    return this.findById(id)
  }

  async deleteById(id: string): Promise<void> {
    await db.delete(leads).where(eq(leads.id, id))
  }
}
