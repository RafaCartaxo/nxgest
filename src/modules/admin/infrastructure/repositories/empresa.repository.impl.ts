import { eq, and, count, isNull } from "drizzle-orm"
import { db, empresas, usuarios, clientes, contratos } from "../../../../database.js"
import type { IEmpresaRepository } from "../../application/ports/empresa.repository.js"
import type { EmpresaComStats } from "../../domain/empresa.entity.js"
import type { IAuthRepository } from "../../../../modules/auth/application/ports/auth.repository.js"
import { v4 as uuid } from "uuid"
import { EmailDuplicadoError } from "../../../../modules/auth/domain/errors/auth.error.js"

export class EmpresaRepository implements IEmpresaRepository {
  constructor(private readonly authRepository: IAuthRepository) {}

  async findAll(): Promise<EmpresaComStats[]> {
    const rows = await db.select().from(empresas).orderBy(empresas.createdAt)
    return Promise.all(
      rows.map(async (row) => {
        const [totalOps, totalClientesResult, contratosResult] = await Promise.all([
          db.select({ total: count() }).from(usuarios).where(and(eq(usuarios.empresaId, row.id), isNull(usuarios.deletedAt))),
          db.select({ total: count() }).from(clientes).innerJoin(usuarios, eq(clientes.userId, usuarios.id)).where(and(isNull(clientes.deletedAt), eq(usuarios.empresaId, row.id))),
          db.select({ total: count() }).from(contratos).innerJoin(usuarios, eq(contratos.userId, usuarios.id)).where(and(isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"), eq(usuarios.empresaId, row.id))),
        ])
        return {
          id: row.id,
          nome: row.nome,
          createdAt: row.createdAt,
          totalUsuarios: totalOps[0].total,
          totalClientes: totalClientesResult[0].total,
          contratosAtivos: contratosResult[0].total,
        }
      })
    )
  }

  async findById(id: string): Promise<EmpresaComStats | null> {
    const [row] = await db.select().from(empresas).where(eq(empresas.id, id)).limit(1)
    if (!row) return null
    const [totalOps, totalClientesResult, contratosResult] = await Promise.all([
      db.select({ total: count() }).from(usuarios).where(and(eq(usuarios.empresaId, row.id), isNull(usuarios.deletedAt))),
      db.select({ total: count() }).from(clientes).innerJoin(usuarios, eq(clientes.userId, usuarios.id)).where(and(isNull(clientes.deletedAt), eq(usuarios.empresaId, row.id))),
      db.select({ total: count() }).from(contratos).innerJoin(usuarios, eq(contratos.userId, usuarios.id)).where(and(isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"), eq(usuarios.empresaId, row.id))),
    ])
    return {
      id: row.id,
      nome: row.nome,
      createdAt: row.createdAt,
      totalUsuarios: totalOps[0].total,
      totalClientes: totalClientesResult[0].total,
      contratosAtivos: contratosResult[0].total,
    }
  }

  async create(input: { nome: string; adminNome: string; adminEmail: string; adminSenhaHash: string }) {
    const existente = await this.authRepository.findByEmail(input.adminEmail)
    if (existente) {
      throw new EmailDuplicadoError()
    }

    return db.transaction((tx) => {
      const empresaId = uuid()
      const adminId = uuid()

      tx.insert(empresas).values({
        id: empresaId,
        nome: input.nome,
        createdAt: new Date().toISOString(),
      }).run()

      tx.insert(usuarios).values({
        id: adminId,
        nome: input.adminNome,
        email: input.adminEmail,
        senhaHash: input.adminSenhaHash,
        role: "admin",
        empresaId: empresaId,
        createdAt: new Date().toISOString(),
      }).run()

      return {
        empresa: { id: empresaId, nome: input.nome, createdAt: new Date().toISOString(), totalUsuarios: 1, totalClientes: 0, contratosAtivos: 0 },
        admin: { id: adminId, nome: input.adminNome, email: input.adminEmail },
      }
    })
  }
}