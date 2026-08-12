import { eq, and, count, isNull } from "drizzle-orm"
import { db, rawQuery, empresas, usuarios, clientes, contratos } from "../../../../database.js"
import type { IEmpresaRepository } from "../../application/ports/empresa.repository.js"
import type { EmpresaComStats } from "../../domain/empresa.entity.js"
import { parseModulos, serializeModulos, DEFAULT_MODULOS } from "../../domain/modules.js"
import { parseCapacidades, serializeCapacidades } from "../../domain/capacidades.js"
import type { IAuthRepository } from "../../../../modules/auth/application/ports/auth.repository.js"
import { v4 as uuid } from "uuid"
import { EmailDuplicadoError } from "../../../../modules/auth/domain/errors/auth.error.js"

const toComStats = (row: { id: string; nome: string; createdAt: string; modulos?: string | null; capacidades?: string | null; documento?: string | null; nomeFantasia?: string | null; ativa?: number | boolean | null }, stats: Omit<EmpresaComStats, "id" | "nome" | "createdAt" | "modulos" | "capacidades" | "documento" | "nomeFantasia" | "ativa">): EmpresaComStats => ({
  id: row.id,
  nome: row.nome,
  createdAt: row.createdAt,
  modulos: parseModulos(row.modulos ?? null),
  capacidades: parseCapacidades(row.capacidades ?? null),
  documento: row.documento ?? null,
  nomeFantasia: row.nomeFantasia ?? null,
  ativa: row.ativa == null ? true : Boolean(row.ativa),
  ...stats,
})

export class EmpresaRepository implements IEmpresaRepository {
  constructor(private readonly authRepository: IAuthRepository) {}

  /** Stats de um conjunto de empresas em 4 queries (E2 — anti N+1). */
  private async statsDeEmpresas(empresaIds: string[]): Promise<Map<string, {
    totalUsuarios: number
    totalClientes: number
    contratosAtivos: number
    adminNome: string | null
    adminEmail: string | null
  }>> {
    const map = new Map<string, { totalUsuarios: number; totalClientes: number; contratosAtivos: number; adminNome: string | null; adminEmail: string | null }>()
    for (const id of empresaIds) map.set(id, { totalUsuarios: 0, totalClientes: 0, contratosAtivos: 0, adminNome: null, adminEmail: null })
    if (empresaIds.length === 0) return map

    const ph = empresaIds.map(() => "?").join(",")
    const [{ rows: usuariosRows }, { rows: clientesRows }, { rows: contratosRows }, { rows: adminRows }] = await Promise.all([
      rawQuery<{ empresa_id: string; total: number }>(
        `SELECT u."empresa_id", COUNT(*)::int AS total FROM usuarios u WHERE u."deleted_at" IS NULL AND u."empresa_id" IN (${ph}) GROUP BY u."empresa_id"`, empresaIds),
      rawQuery<{ empresa_id: string; total: number }>(
        `SELECT u."empresa_id", COUNT(*)::int AS total FROM clientes c JOIN usuarios u ON c."user_id" = u.id WHERE c."deleted_at" IS NULL AND u."empresa_id" IN (${ph}) GROUP BY u."empresa_id"`, empresaIds),
      rawQuery<{ empresa_id: string; total: number }>(
        `SELECT u."empresa_id", COUNT(*)::int AS total FROM contratos ct JOIN usuarios u ON ct."user_id" = u.id WHERE ct."deleted_at" IS NULL AND ct."estado" = 'Ativo' AND u."empresa_id" IN (${ph}) GROUP BY u."empresa_id"`, empresaIds),
      rawQuery<{ empresa_id: string; nome: string; email: string }>(
        `SELECT DISTINCT ON (u."empresa_id") u."empresa_id", u.nome, u.email FROM usuarios u WHERE u."deleted_at" IS NULL AND u.role = 'admin' AND u."empresa_id" IN (${ph}) ORDER BY u."empresa_id", u."created_at"`, empresaIds),
    ])
    for (const r of usuariosRows) map.get(r.empresa_id)!.totalUsuarios = r.total
    for (const r of clientesRows) map.get(r.empresa_id)!.totalClientes = r.total
    for (const r of contratosRows) map.get(r.empresa_id)!.contratosAtivos = r.total
    for (const r of adminRows) {
      const s = map.get(r.empresa_id)
      if (s) { s.adminNome = r.nome; s.adminEmail = r.email }
    }
    return map
  }

  async findAll(): Promise<EmpresaComStats[]> {
    const rows = await db.select().from(empresas).orderBy(empresas.createdAt)
    const stats = await this.statsDeEmpresas(rows.map((r) => r.id))
    return rows.map((row) => toComStats(row, stats.get(row.id)!))
  }

  async findById(id: string): Promise<EmpresaComStats | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    if (!row) return null
    const stats = await this.statsDeEmpresas([row.id])
    return toComStats(row, stats.get(row.id)!)
  }

  async create(input: { nome: string; documento?: string | null; nomeFantasia?: string | null; ativa?: boolean; adminNome: string; adminEmail: string; adminSenhaHash: string | null }) {
    const existente = await this.authRepository.findByEmail(input.adminEmail)
    if (existente) {
      throw new EmailDuplicadoError()
    }

    return db.transaction(async (tx) => {
      const empresaId = uuid()
      const adminId = uuid()

      await tx.insert(empresas).values({
        id: empresaId,
        nome: input.nome,
        documento: input.documento ?? null,
        nomeFantasia: input.nomeFantasia ?? null,
        ativa: input.ativa === false ? 0 : 1,
        createdAt: new Date().toISOString(),
      })

      await tx.insert(usuarios).values({
        id: adminId,
        nome: input.adminNome,
        email: input.adminEmail,
        senhaHash: input.adminSenhaHash,
        role: "admin",
        empresaId: empresaId,
        createdAt: new Date().toISOString(),
      })

      return {
        empresa: { id: empresaId, nome: input.nome, documento: input.documento ?? null, nomeFantasia: input.nomeFantasia ?? null, ativa: input.ativa === false ? false : true, createdAt: new Date().toISOString(), totalUsuarios: 1, totalClientes: 0, contratosAtivos: 0, modulos: [...DEFAULT_MODULOS], capacidades: null },
        admin: { id: adminId, nome: input.adminNome, email: input.adminEmail },
      }
    })
  }

  async updateModulos(id: string, modulos: string[]): Promise<EmpresaComStats | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    if (!row) return null
    await db.update(empresas).set({ modulos: serializeModulos(modulos) }).where(eq(empresas.id, id))
    return this.findById(id)
  }

  async updateCapacidades(id: string, capacidades: string[] | null): Promise<EmpresaComStats | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    if (!row) return null
    await db.update(empresas).set({ capacidades: capacidades === null ? null : serializeCapacidades(capacidades) }).where(eq(empresas.id, id))
    return this.findById(id)
  }

  async update(id: string, data: { nome?: string; documento?: string | null; nomeFantasia?: string | null; ativa?: boolean }): Promise<EmpresaComStats | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    if (!row) return null
    const set: Record<string, unknown> = {}
    if (data.nome !== undefined) set.nome = data.nome
    if (data.documento !== undefined) set.documento = data.documento
    if (data.nomeFantasia !== undefined) set.nomeFantasia = data.nomeFantasia
    if (data.ativa !== undefined) set.ativa = data.ativa ? 1 : 0
    if (Object.keys(set).length > 0) {
      await db.update(empresas).set(set).where(eq(empresas.id, id))
    }
    return this.findById(id)
  }
}