import { eq, and, count, isNull, sum } from "drizzle-orm"
import { db, usuarios, clientes, contratos, pagamentos, movimentacoesFinanceiras } from "../../../../database.js"
import type { IAdminRepository, OperadorRow, AdminDashboardStats } from "../../application/ports/admin.repository.js"
import { v4 as uuid } from "uuid"
import { NaoPodeAutoModificarError, OperadorNaoEncontradoError } from "../../domain/errors/admin.error.js"
import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"

export class AdminRepository implements IAdminRepository {
  async findAllOperadores(empresaId?: string | null): Promise<OperadorRow[]> {
    const conditions = [isNull(usuarios.deletedAt)]
    if (empresaId) {
      conditions.push(eq(usuarios.empresaId, empresaId))
    }
    const rows = await db.select().from(usuarios).where(and(...conditions)).orderBy(usuarios.createdAt)

    const result: OperadorRow[] = []
    for (const row of rows) {
    const [clientesCount, contratosCount] = await Promise.all([
      db.select({ total: count() }).from(clientes).where(and(eq(clientes.userId, row.id), isNull(clientes.deletedAt))),
      db.select({ total: count() }).from(contratos).where(and(eq(contratos.userId, row.id), isNull(contratos.deletedAt))),
    ])
      result.push({
        id: row.id,
        nome: row.nome,
        email: row.email,
        role: row.role as "super_admin" | "admin" | "operator",
        createdAt: row.createdAt,
        deletedAt: row.deletedAt,
        totalClientes: clientesCount[0].total,
        contratosAtivos: contratosCount[0].total,
        empresaId: row.empresaId ?? null,
      })
    }
    return result
  }

  async findById(id: string, empresaId?: string | null): Promise<OperadorRow | null> {
    const conditions = [eq(usuarios.id, id), isNull(usuarios.deletedAt)]
    if (empresaId) {
      conditions.push(eq(usuarios.empresaId, empresaId))
    }
    const rows = await db.select().from(usuarios).where(and(...conditions))
    if (rows.length === 0) return null
    const row = rows[0]
    const [clientesCount, contratosCount] = await Promise.all([
      db.select({ total: count() }).from(clientes).where(and(eq(clientes.userId, row.id), isNull(clientes.deletedAt))),
      db.select({ total: count() }).from(contratos).where(and(eq(contratos.userId, row.id), isNull(contratos.deletedAt))),
    ])
    return {
      ...row,
      role: row.role as "super_admin" | "admin" | "operator",
      totalClientes: clientesCount[0].total,
      contratosAtivos: contratosCount[0].total,
      empresaId: row.empresaId ?? null,
    }
  }

  async findByEmail(email: string): Promise<OperadorRow | null> {
    const rows = await db.select().from(usuarios).where(and(eq(usuarios.email, email), isNull(usuarios.deletedAt)))
    if (rows.length === 0) return null
    const row = rows[0]
    const [clientesCount, contratosCount] = await Promise.all([
      db.select({ total: count() }).from(clientes).where(and(eq(clientes.userId, row.id), isNull(clientes.deletedAt))),
      db.select({ total: count() }).from(contratos).where(and(eq(contratos.userId, row.id), isNull(contratos.deletedAt))),
    ])
    return {
      ...row,
      role: row.role as "super_admin" | "admin" | "operator",
      totalClientes: clientesCount[0].total,
      contratosAtivos: contratosCount[0].total,
      empresaId: row.empresaId ?? null,
    }
  }

  async create(input: { nome: string; email: string; senhaHash: string; role: "admin" | "operator"; empresaId: string | null }): Promise<OperadorRow> {
    const id = uuid()
    await db.insert(usuarios).values({
      id,
      nome: input.nome,
      email: input.email,
      senhaHash: input.senhaHash,
      role: input.role,
      empresaId: input.empresaId,
      createdAt: new Date().toISOString(),
    })
    return { id, nome: input.nome, email: input.email, role: input.role, empresaId: input.empresaId, createdAt: new Date().toISOString(), deletedAt: null, totalClientes: 0, contratosAtivos: 0 }
  }

  async update(id: string, data: { nome?: string; email?: string; role?: "admin" | "operator"; senhaHash?: string }, currentUserId: string, empresaId?: string | null): Promise<OperadorRow | null> {
    if (id === currentUserId && data.role && data.role !== "admin") {
      throw new NaoPodeAutoModificarError("Você não pode alterar seu próprio papel.")
    }

    const existing = await this.findById(id, empresaId)
    if (!existing) throw new OperadorNaoEncontradoError()

    const updateData: Record<string, unknown> = {}
    if (data.nome !== undefined) updateData.nome = data.nome
    if (data.email !== undefined) updateData.email = data.email
    if (data.role !== undefined) updateData.role = data.role
    if (data.senhaHash !== undefined) updateData.senhaHash = data.senhaHash

    await db.update(usuarios).set(updateData).where(eq(usuarios.id, id))

    return this.findById(id, empresaId)
  }

  async softDelete(id: string, currentUserId: string, empresaId?: string | null): Promise<void> {
    if (id === currentUserId) {
      throw new NaoPodeAutoModificarError("Você não pode remover a si mesmo.")
    }

    const existing = await this.findById(id, empresaId)
    if (!existing) throw new OperadorNaoEncontradoError()

    await db.update(usuarios).set({ deletedAt: new Date().toISOString() }).where(eq(usuarios.id, id))
  }

  async getDashboardStats(empresaId?: string | null): Promise<AdminDashboardStats> {
    const hoje = getLocalDateString(new Date())

    const [totalOps, totalClientesResult, contratosResult, recebidoResult, entradasResult, saidasResult] = await Promise.all([
      empresaId
        ? db.select({ total: count() }).from(usuarios).where(and(isNull(usuarios.deletedAt), eq(usuarios.empresaId, empresaId)))
        : db.select({ total: count() }).from(usuarios).where(isNull(usuarios.deletedAt)),
      empresaId
        ? db.select({ total: count() }).from(clientes).innerJoin(usuarios, eq(clientes.userId, usuarios.id)).where(and(isNull(clientes.deletedAt), eq(usuarios.empresaId, empresaId)))
        : db.select({ total: count() }).from(clientes).where(isNull(clientes.deletedAt)),
      empresaId
        ? db.select({ total: count() }).from(contratos).innerJoin(usuarios, eq(contratos.userId, usuarios.id)).where(and(isNull(contratos.deletedAt), eq(usuarios.empresaId, empresaId)))
        : db.select({ total: count() }).from(contratos).where(isNull(contratos.deletedAt)),
      empresaId
        ? db.select({ total: sum(pagamentos.valor) }).from(pagamentos).innerJoin(usuarios, eq(pagamentos.userId, usuarios.id)).where(and(eq(pagamentos.data, hoje), eq(usuarios.empresaId, empresaId)))
        : db.select({ total: sum(pagamentos.valor) }).from(pagamentos).where(eq(pagamentos.data, hoje)),
      empresaId
        ? db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).innerJoin(usuarios, eq(movimentacoesFinanceiras.userId, usuarios.id)).where(and(eq(movimentacoesFinanceiras.tipo, "entrada"), eq(movimentacoesFinanceiras.data, hoje), eq(usuarios.empresaId, empresaId)))
        : db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).where(and(eq(movimentacoesFinanceiras.tipo, "entrada"), eq(movimentacoesFinanceiras.data, hoje))),
      empresaId
        ? db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).innerJoin(usuarios, eq(movimentacoesFinanceiras.userId, usuarios.id)).where(and(eq(movimentacoesFinanceiras.tipo, "saida"), eq(movimentacoesFinanceiras.data, hoje), eq(usuarios.empresaId, empresaId)))
        : db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).where(and(eq(movimentacoesFinanceiras.tipo, "saida"), eq(movimentacoesFinanceiras.data, hoje))),
    ])

    const entradasValor = Number(entradasResult[0].total) || 0
    const saidasValor = Number(saidasResult[0].total) || 0

    return {
      totalOperadores: totalOps[0].total,
      totalClientes: totalClientesResult[0].total,
      contratosAtivos: contratosResult[0].total,
      recebidoHoje: Number(recebidoResult[0].total) || 0,
      resultadoDoDia: entradasValor - saidasValor,
    }
  }
}
