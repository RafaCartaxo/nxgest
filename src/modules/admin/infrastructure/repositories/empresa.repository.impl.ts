import { eq, and, count, isNull } from "drizzle-orm"
import { db, empresas, usuarios, clientes, contratos } from "../../../../database.js"
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

  async findAll(): Promise<EmpresaComStats[]> {
    const rows = await db.select().from(empresas).orderBy(empresas.createdAt)
    return Promise.all(
      rows.map(async (row) => {
        const [totalOps, totalClientesResult, contratosResult, adminResult] = await Promise.all([
          db.select({ total: count() }).from(usuarios).where(and(eq(usuarios.empresaId, row.id), isNull(usuarios.deletedAt))),
          db.select({ total: count() }).from(clientes).innerJoin(usuarios, eq(clientes.userId, usuarios.id)).where(and(isNull(clientes.deletedAt), eq(usuarios.empresaId, row.id))),
          db.select({ total: count() }).from(contratos).innerJoin(usuarios, eq(contratos.userId, usuarios.id)).where(and(isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"), eq(usuarios.empresaId, row.id))),
          db.select({ nome: usuarios.nome, email: usuarios.email }).from(usuarios).where(and(eq(usuarios.empresaId, row.id), eq(usuarios.role, "admin"), isNull(usuarios.deletedAt))).orderBy(usuarios.createdAt).limit(1),
        ])
        return toComStats(row, {
          totalUsuarios: totalOps[0].total,
          totalClientes: totalClientesResult[0].total,
          contratosAtivos: contratosResult[0].total,
          adminNome: adminResult[0]?.nome ?? null,
          adminEmail: adminResult[0]?.email ?? null,
        })
      })
    )
  }

  async findById(id: string): Promise<EmpresaComStats | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    if (!row) return null
    const [totalOps, totalClientesResult, contratosResult, adminResult] = await Promise.all([
      db.select({ total: count() }).from(usuarios).where(and(eq(usuarios.empresaId, row.id), isNull(usuarios.deletedAt))),
      db.select({ total: count() }).from(clientes).innerJoin(usuarios, eq(clientes.userId, usuarios.id)).where(and(isNull(clientes.deletedAt), eq(usuarios.empresaId, row.id))),
      db.select({ total: count() }).from(contratos).innerJoin(usuarios, eq(contratos.userId, usuarios.id)).where(and(isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"), eq(usuarios.empresaId, row.id))),
      db.select({ nome: usuarios.nome, email: usuarios.email }).from(usuarios).where(and(eq(usuarios.empresaId, row.id), eq(usuarios.role, "admin"), isNull(usuarios.deletedAt))).orderBy(usuarios.createdAt).limit(1),
    ])
    return toComStats(row, {
      totalUsuarios: totalOps[0].total,
      totalClientes: totalClientesResult[0].total,
      contratosAtivos: contratosResult[0].total,
      adminNome: adminResult[0]?.nome ?? null,
      adminEmail: adminResult[0]?.email ?? null,
    })
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