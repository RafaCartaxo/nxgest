import { eq, and, count, isNull, ne, sum, inArray } from "drizzle-orm"
import { db, rawQuery, usuarios, clientes, contratos, pagamentos, movimentacoesFinanceiras } from "../../../../database.js"
import type { IAdminRepository, OperadorRow, AdminDashboardStats, EquipeItem } from "../../application/ports/admin.repository.js"
import { v4 as uuid } from "uuid"
import { NaoPodeAutoModificarError, NaoPodeAlterarSuperAdminError, OperadorNaoEncontradoError, NaoPodeRebaixarComSubordinadosError } from "../../domain/errors/admin.error.js"
import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"

const SCOPE_NOT_SUPER = [isNull(usuarios.deletedAt), ne(usuarios.role, "super_admin")]

/** Mapeia a linha completa (com senhaHash) → OperadorRow público (strip + status). */
function toOperadorRow(
  row: { id: string; nome: string; email: string; senhaHash: string | null; role: string; createdAt: string; deletedAt: string | null; empresaId: string | null; chefeId: string | null; foto: string | null },
  totalClientes = 0,
  contratosAtivos = 0,
): OperadorRow {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    role: row.role as OperadorRow["role"],
    createdAt: row.createdAt,
    deletedAt: row.deletedAt ?? null,
    empresaId: row.empresaId ?? null,
    chefeId: row.chefeId ?? null,
    foto: row.foto ?? null,
    status: row.senhaHash ? "ativo" : "convidado",
    totalClientes,
    contratosAtivos,
  }
}

export class AdminRepository implements IAdminRepository {
  /** Contagens de clientes/contratos ativos por usuário em 2 queries (E2 — anti N+1). */
  private async countsPorUsuario(userIds: string[]): Promise<Map<string, { totalClientes: number; contratosAtivos: number }>> {
    const map = new Map<string, { totalClientes: number; contratosAtivos: number }>()
    for (const id of userIds) map.set(id, { totalClientes: 0, contratosAtivos: 0 })
    if (userIds.length === 0) return map
    const ph = userIds.map(() => "?").join(",")
    const [{ rows: clienteRows }, { rows: contratoRows }] = await Promise.all([
      rawQuery<{ userId: string; total: number }>(
        `SELECT c."userId", COUNT(*)::int AS total FROM clientes c WHERE c."deletedAt" IS NULL AND c."userId" IN (${ph}) GROUP BY c."userId"`, userIds),
      rawQuery<{ userId: string; total: number }>(
        `SELECT ct."userId", COUNT(*)::int AS total FROM contratos ct WHERE ct."deletedAt" IS NULL AND ct."estado" = 'Ativo' AND ct."userId" IN (${ph}) GROUP BY ct."userId"`, userIds),
    ])
    for (const r of clienteRows) map.get(r.userId)!.totalClientes = r.total
    for (const r of contratoRows) map.get(r.userId)!.contratosAtivos = r.total
    return map
  }

  async findAllOperadores(empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow[]> {
    const conditions = [...SCOPE_NOT_SUPER]
    if (empresaId) {
      conditions.push(eq(usuarios.empresaId, empresaId))
    }
    if (scopeUserIds && scopeUserIds.length > 0) {
      conditions.push(inArray(usuarios.id, scopeUserIds))
    }
    const rows = await db.select().from(usuarios).where(and(...conditions)).orderBy(usuarios.createdAt)

    const counts = await this.countsPorUsuario(rows.map((r) => r.id))
    return rows.map((row) => {
      const c = counts.get(row.id)!
      return toOperadorRow(row, c.totalClientes, c.contratosAtivos)
    })
  }

  async findById(id: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow | null> {
    const conditions = [eq(usuarios.id, id), isNull(usuarios.deletedAt)]
    if (empresaId) {
      conditions.push(eq(usuarios.empresaId, empresaId))
    }
    if (scopeUserIds && scopeUserIds.length > 0) {
      conditions.push(inArray(usuarios.id, scopeUserIds))
    }
    const rows = await db.select().from(usuarios).where(and(...conditions))
    if (rows.length === 0) return null
    const row = rows[0]
    const [clientesCount, contratosCount] = await Promise.all([
      db.select({ total: count() }).from(clientes).where(and(eq(clientes.userId, row.id), isNull(clientes.deletedAt))),
      db.select({ total: count() }).from(contratos).where(and(eq(contratos.userId, row.id), isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"))),
    ])
    return toOperadorRow(row, clientesCount[0].total, contratosCount[0].total)
  }

  async findByEmail(email: string): Promise<OperadorRow | null> {
    const rows = await db.select().from(usuarios).where(eq(usuarios.email, email))
    if (rows.length === 0) return null
    const row = rows[0]
    const [clientesCount, contratosCount] = await Promise.all([
      db.select({ total: count() }).from(clientes).where(and(eq(clientes.userId, row.id), isNull(clientes.deletedAt))),
      db.select({ total: count() }).from(contratos).where(and(eq(contratos.userId, row.id), isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"))),
    ])
    return toOperadorRow(row, clientesCount[0].total, contratosCount[0].total)
  }

  async create(input: { nome: string; email: string; senhaHash: string | null; role: "super_admin" | "admin" | "socio" | "operator"; empresaId: string | null; chefeId?: string | null }): Promise<OperadorRow> {
    const id = uuid()
    await db.insert(usuarios).values({
      id,
      nome: input.nome,
      email: input.email,
      senhaHash: input.senhaHash,
      role: input.role,
      empresaId: input.empresaId,
      chefeId: input.chefeId ?? null,
      createdAt: new Date().toISOString(),
    })
    return { id, nome: input.nome, email: input.email, role: input.role, empresaId: input.empresaId, chefeId: input.chefeId ?? null, createdAt: new Date().toISOString(), deletedAt: null, totalClientes: 0, contratosAtivos: 0, foto: null, status: input.senhaHash ? "ativo" : "convidado" }
  }

  async update(id: string, data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; senhaHash?: string; chefeId?: string | null; foto?: string | null; reatribuirParaChefeId?: string | null }, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<OperadorRow | null> {
    if (id === currentUserId && data.role !== undefined) {
      throw new NaoPodeAutoModificarError("Você não pode alterar seu próprio papel.")
    }

    const existing = await this.findById(id, empresaId, scopeUserIds)
    if (!existing) throw new OperadorNaoEncontradoError()
    if (existing.role === "super_admin") {
      throw new NaoPodeAlterarSuperAdminError()
    }

    // Bloqueio de "chefe órfão" (WS7): rebaixar pode deixar subordinados com chefe inválido.
    // Com `reatribuirParaChefeId`, os subordinados são movidos para o novo chefe no MESMO
    // ato (reassign atômico — PLAN-061).
    const demoteToOperator = data.role === "operator" && existing.role !== "operator"
    const demoteToSocio = data.role === "socio" && existing.role === "admin"
    const reassign = data.reatribuirParaChefeId ?? null

    await db.transaction(async (tx) => {
      if (demoteToOperator) {
        const sub = (await tx.select({ total: count() }).from(usuarios).where(and(eq(usuarios.chefeId, id), isNull(usuarios.deletedAt))).limit(1))[0]
        if ((sub?.total ?? 0) > 0) {
          if (reassign) {
            await tx.update(usuarios).set({ chefeId: reassign }).where(and(eq(usuarios.chefeId, id), isNull(usuarios.deletedAt)))
          } else {
            throw new NaoPodeRebaixarComSubordinadosError("Rebaixe/reatribua os operadores antes de rebaixar para operador.", sub?.total ?? 0)
          }
        }
      }
      if (demoteToSocio) {
        const sub = (await tx.select({ total: count() }).from(usuarios).where(and(eq(usuarios.chefeId, id), eq(usuarios.role, "socio"), isNull(usuarios.deletedAt))).limit(1))[0]
        if ((sub?.total ?? 0) > 0) {
          if (reassign) {
            await tx.update(usuarios).set({ chefeId: reassign }).where(and(eq(usuarios.chefeId, id), eq(usuarios.role, "socio"), isNull(usuarios.deletedAt)))
          } else {
            throw new NaoPodeRebaixarComSubordinadosError("Rebaixe/reatribua os sócios antes de rebaixar para sócio.", sub?.total ?? 0)
          }
        }
      }

      const updateData: Record<string, unknown> = {}
      if (data.nome !== undefined) updateData.nome = data.nome
      if (data.email !== undefined) updateData.email = data.email
      if (data.role !== undefined) updateData.role = data.role
      if (data.senhaHash !== undefined) updateData.senhaHash = data.senhaHash
      if (data.chefeId !== undefined) updateData.chefeId = data.chefeId
      if (data.foto !== undefined) updateData.foto = data.foto

      await tx.update(usuarios).set(updateData).where(eq(usuarios.id, id))
    })

    return this.findById(id, empresaId, scopeUserIds)
  }

  async softDelete(id: string, currentUserId: string, empresaId?: string | null, scopeUserIds?: string[]): Promise<void> {
    if (id === currentUserId) {
      throw new NaoPodeAutoModificarError("Você não pode remover a si mesmo.")
    }

    const existing = await this.findById(id, empresaId, scopeUserIds)
    if (!existing) throw new OperadorNaoEncontradoError()
    if (existing.role === "super_admin") {
      throw new NaoPodeAlterarSuperAdminError()
    }

    await db.update(usuarios).set({ deletedAt: new Date().toISOString() }).where(eq(usuarios.id, id))
  }

  async getDashboardStats(empresaId?: string | null, userId?: string | null, scopeUserIds?: string[]): Promise<AdminDashboardStats> {
    const hoje = getLocalDateString(new Date())

    // Escopo de usuários nas queries com JOIN (subárvore p/ sócio, empresa p/ admin/super)
    const usuarioScope = () => {
      if (scopeUserIds && scopeUserIds.length > 0) return [inArray(usuarios.id, scopeUserIds)]
      if (empresaId) return [eq(usuarios.empresaId, empresaId)]
      return []
    }

    const countRole = (role: string) =>
      db.select({ total: count() }).from(usuarios).where(and(isNull(usuarios.deletedAt), eq(usuarios.role, role), ...usuarioScope()))

    const countClientes = userId
      ? db.select({ total: count() }).from(clientes).where(and(isNull(clientes.deletedAt), eq(clientes.userId, userId)))
      : db.select({ total: count() }).from(clientes).innerJoin(usuarios, eq(clientes.userId, usuarios.id)).where(and(isNull(clientes.deletedAt), ...usuarioScope()))

    const countContratos = userId
      ? db.select({ total: count() }).from(contratos).where(and(isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"), eq(contratos.userId, userId)))
      : db.select({ total: count() }).from(contratos).innerJoin(usuarios, eq(contratos.userId, usuarios.id)).where(and(isNull(contratos.deletedAt), eq(contratos.estado, "Ativo"), ...usuarioScope()))

    const recebidoHoje = userId
      ? db.select({ total: sum(pagamentos.valor) }).from(pagamentos).where(and(eq(pagamentos.data, hoje), eq(pagamentos.userId, userId)))
      : db.select({ total: sum(pagamentos.valor) }).from(pagamentos).innerJoin(usuarios, eq(pagamentos.userId, usuarios.id)).where(and(eq(pagamentos.data, hoje), ...usuarioScope()))

    const entradasHoje = userId
      ? db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).where(and(eq(movimentacoesFinanceiras.tipo, "entrada"), eq(movimentacoesFinanceiras.data, hoje), eq(movimentacoesFinanceiras.userId, userId)))
      : db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).innerJoin(usuarios, eq(movimentacoesFinanceiras.userId, usuarios.id)).where(and(eq(movimentacoesFinanceiras.tipo, "entrada"), eq(movimentacoesFinanceiras.data, hoje), ...usuarioScope()))

    const saidasHoje = userId
      ? db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).where(and(eq(movimentacoesFinanceiras.tipo, "saida"), eq(movimentacoesFinanceiras.data, hoje), eq(movimentacoesFinanceiras.userId, userId)))
      : db.select({ total: sum(movimentacoesFinanceiras.valor) }).from(movimentacoesFinanceiras).innerJoin(usuarios, eq(movimentacoesFinanceiras.userId, usuarios.id)).where(and(eq(movimentacoesFinanceiras.tipo, "saida"), eq(movimentacoesFinanceiras.data, hoje), ...usuarioScope()))

    const [totalAdminsResult, totalSociosResult, totalOps, totalClientesResult, contratosResult, recebidoResult, entradasResult, saidasResult] = await Promise.all([
      countRole("admin"),
      countRole("socio"),
      countRole("operator"),
      countClientes,
      countContratos,
      recebidoHoje,
      entradasHoje,
      saidasHoje,
    ])

    const entradasValor = Number(entradasResult[0].total) || 0
    const saidasValor = Number(saidasResult[0].total) || 0

    return {
      totalAdmins: totalAdminsResult[0].total,
      totalSocios: totalSociosResult[0].total,
      totalOperadores: totalOps[0].total,
      totalClientes: totalClientesResult[0].total,
      contratosAtivos: contratosResult[0].total,
      recebidoHoje: Number(recebidoResult[0].total) || 0,
      resultadoDoDia: entradasValor - saidasValor,
    }
  }

  async listEquipe(empresaId: string | null, scopeUserIds?: string[]): Promise<EquipeItem[]> {
    const hoje = getLocalDateString(new Date())

    const conditions = [...SCOPE_NOT_SUPER]
    if (empresaId) {
      conditions.push(eq(usuarios.empresaId, empresaId))
    }
    if (scopeUserIds && scopeUserIds.length > 0) {
      conditions.push(inArray(usuarios.id, scopeUserIds))
    }
    const rows = await db.select().from(usuarios).where(and(...conditions))

    // recebidoHoje por usuário (uma query agrupada)
    const userIds = rows.map((r) => r.id).filter((id): id is string => id !== null)
    const recebidoMap = new Map<string, number>()
    if (userIds.length > 0) {
      const recebido = await db
        .select({ userId: pagamentos.userId, total: sum(pagamentos.valor) })
        .from(pagamentos)
        .where(and(eq(pagamentos.data, hoje), inArray(pagamentos.userId, userIds)))
        .groupBy(pagamentos.userId)
      for (const r of recebido) if (r.userId) recebidoMap.set(r.userId, Number(r.total) || 0)
    }

    const counts = await this.countsPorUsuario(userIds)
    return rows.map((row) => {
      const c = counts.get(row.id)!
      return {
        id: row.id,
        nome: row.nome,
        email: row.email,
        role: row.role as EquipeItem["role"],
        totalClientes: c.totalClientes,
        contratosAtivos: c.contratosAtivos,
        recebidoHoje: recebidoMap.get(row.id) ?? 0,
        foto: row.foto ?? null,
      }
    })
  }

  async subarvoreIds(chefeId: string): Promise<string[]> {
    const all = await db.select({ id: usuarios.id, chefeId: usuarios.chefeId }).from(usuarios).where(and(...SCOPE_NOT_SUPER))
    const result: string[] = []
    const visit = (id: string) => {
      result.push(id)
      for (const u of all) if (u.chefeId === id) visit(u.id)
    }
    visit(chefeId)
    return result
  }
}
