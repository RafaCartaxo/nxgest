import { eq, and, isNull, sql, count, inArray } from "drizzle-orm"
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3"
import { db, sqlite, contratos, parcelas, movimentacoesFinanceiras, caixaConfig, pagamentos, clientes } from "../../../../database.js"
import type { Contrato, Parcela, ContratoComParcelas, MovimentacaoFinanceira, CaixaConfig } from "../../domain/contrato.entity.js"
import type { IContratoRepository, FindAllParams, FindAllResult } from "../../application/ports/contrato.repository.js"
import { getLocalDateString, parseDateLocal } from "../../../../shared/utils/parseDateLocal.js"

type ContratoRow = typeof contratos.$inferSelect
type ParcelaRow = typeof parcelas.$inferSelect
type CaixaRow = typeof caixaConfig.$inferSelect

function rowToContrato(row: ContratoRow): Contrato {
  return {
    id: row.id,
    clienteId: row.clienteId,
    valorBase: row.valorBase,
    percentualJuros: row.percentualJuros,
    valorFinal: row.valorFinal,
    quantidadeParcelas: row.quantidadeParcelas,
    dataInicio: row.dataInicio,
    dataFinal: row.dataFinal,
    estado: row.estado as Contrato["estado"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

function rowToParcela(row: ParcelaRow): Parcela {
  return {
    id: row.id,
    contratoId: row.contratoId,
    numero: row.numero,
    valorPrevisto: row.valorPrevisto,
    valorPago: row.valorPago,
    saldoPendente: row.saldoPendente,
    estado: row.estado as Parcela["estado"],
    dataVencimento: row.dataVencimento,
    dataQuitacao: row.dataQuitacao,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  }
}

export class ContratoRepository implements IContratoRepository {
  private drizzle: BetterSQLite3Database

  constructor(drizzle?: BetterSQLite3Database) {
    this.drizzle = drizzle ?? db
  }

  async save(userId: string, contrato: Contrato): Promise<void> {
    await this.drizzle.insert(contratos).values({
      id: contrato.id,
      userId,
      clienteId: contrato.clienteId,
      valorBase: contrato.valorBase,
      percentualJuros: contrato.percentualJuros,
      valorFinal: contrato.valorFinal,
      quantidadeParcelas: contrato.quantidadeParcelas,
      dataInicio: contrato.dataInicio,
      dataFinal: contrato.dataFinal,
      estado: contrato.estado,
      createdAt: contrato.createdAt,
      updatedAt: contrato.updatedAt,
      deletedAt: null,
    })
  }

  async saveParcela(_userId: string, parcela: Parcela): Promise<void> {
    await this.drizzle.insert(parcelas).values({
      id: parcela.id,
      contratoId: parcela.contratoId,
      numero: parcela.numero,
      valorPrevisto: parcela.valorPrevisto,
      valorPago: parcela.valorPago,
      saldoPendente: parcela.saldoPendente,
      estado: parcela.estado,
      dataVencimento: parcela.dataVencimento,
      dataQuitacao: parcela.dataQuitacao,
      createdAt: parcela.createdAt,
      updatedAt: parcela.updatedAt,
      deletedAt: null,
    })
  }

  async updateParcela(_userId: string, id: string, data: Partial<Parcela>): Promise<void> {
    await this.drizzle
      .update(parcelas)
      .set({
        ...data,
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      })
      .where(eq(parcelas.id, id))
  }

  async findById(userId: string, id: string): Promise<Contrato | null> {
    const rows = await this.drizzle
      .select()
      .from(contratos)
      .where(and(eq(contratos.id, id), isNull(contratos.deletedAt), eq(contratos.userId, userId)))
      .limit(1)
    if (rows.length === 0) return null
    return rowToContrato(rows[0])
  }

  async findByIdWithParcelas(userId: string, id: string): Promise<ContratoComParcelas | null> {
    const rows = await this.drizzle
      .select()
      .from(contratos)
      .where(and(eq(contratos.id, id), isNull(contratos.deletedAt), eq(contratos.userId, userId)))
      .limit(1)
    if (rows.length === 0) return null
    const contrato = rowToContrato(rows[0])
    const parcelasList = await this.findParcelasByContratoId(userId, id)
    return { ...contrato, parcelas: parcelasList }
  }

  async findAll(userId: string, params: FindAllParams): Promise<FindAllResult> {
    const conditions = [sql`${contratos.deletedAt} IS NULL`, sql`${contratos.userId} = ${userId}`]
    if (params.clienteId) {
      conditions.push(sql`${contratos.clienteId} = ${params.clienteId}`)
    }
    if (params.dataInicio) {
      conditions.push(sql`${contratos.dataInicio} >= ${params.dataInicio}`)
    }
    if (params.dataFim) {
      conditions.push(sql`${contratos.dataInicio} <= ${params.dataFim}`)
    }
    const where = sql.join(conditions, sql` AND `)

    const totalResult = await this.drizzle
      .select({ total: count() })
      .from(contratos)
      .where(where)
    const total = totalResult[0].total

    const offset = (params.page - 1) * params.limit
    const orderColumn =
      params.sort in contratos
        ? contratos[params.sort as keyof typeof contratos]
        : contratos.createdAt

    const rows = await this.drizzle
      .select({
        contrato: contratos,
        clienteNome: clientes.nome,
      })
      .from(contratos)
      .leftJoin(clientes, eq(contratos.clienteId, clientes.id))
      .where(where)
      .orderBy(
        params.order === "desc"
          ? sql`${orderColumn} DESC`
          : sql`${orderColumn} ASC`
      )
      .limit(params.limit)
      .offset(offset)

    const contratoIds = rows.map((r) => r.contrato.id)
    const hoje = getLocalDateString(new Date())
    const sums = contratoIds.length > 0
      ? await this.drizzle
          .select({
            contratoId: parcelas.contratoId,
            total: sql<number>`COALESCE(SUM(parcelas.saldoPendente), 0)`,
            pagas: sql<number>`COALESCE(SUM(CASE WHEN ${parcelas.estado} = 'Paga' THEN 1 ELSE 0 END), 0)`,
            emAtraso: sql<number>`COALESCE(SUM(CASE WHEN ${parcelas.dataVencimento} < ${hoje} AND ${parcelas.saldoPendente} > 0 THEN ${parcelas.saldoPendente} ELSE 0 END), 0)`,
            parcelasEmAtraso: sql<number>`COALESCE(SUM(CASE WHEN ${parcelas.dataVencimento} < ${hoje} AND ${parcelas.saldoPendente} > 0 THEN 1 ELSE 0 END), 0)`,
            maisAntigaAtraso: sql<string | null>`MIN(CASE WHEN ${parcelas.dataVencimento} < ${hoje} AND ${parcelas.saldoPendente} > 0 THEN ${parcelas.dataVencimento} END)`,
          })
          .from(parcelas)
          .where(and(inArray(parcelas.contratoId, contratoIds), isNull(parcelas.deletedAt)))
          .groupBy(parcelas.contratoId)
      : []

    const sumMap = new Map(sums.map((s) => [s.contratoId, { total: s.total, pagas: s.pagas, emAtraso: s.emAtraso, parcelasEmAtraso: s.parcelasEmAtraso, maisAntigaAtraso: s.maisAntigaAtraso }]))

    return {
      data: rows.map((r) => {
        const sum = sumMap.get(r.contrato.id)
        const diasEmAtraso =
          sum?.maisAntigaAtraso != null
            ? Math.round(
                (parseDateLocal(hoje).getTime() - parseDateLocal(sum.maisAntigaAtraso).getTime()) /
                  86_400_000
              )
            : 0
        return {
          ...rowToContrato(r.contrato),
          clienteNome: r.clienteNome ?? undefined,
          saldoPendente: sum?.total ?? r.contrato.valorFinal,
          parcelasPagas: sum?.pagas ?? 0,
          emAtraso: Math.round((sum?.emAtraso ?? 0) * 100) / 100,
          parcelasEmAtraso: sum?.parcelasEmAtraso ?? 0,
          diasEmAtraso,
        }
      }),
      pagination: {
        page: params.page,
        limit: params.limit,
        total,
        pages: Math.ceil(total / params.limit),
      },
    }
  }

  async findParcelasByContratoId(_userId: string, contratoId: string): Promise<Parcela[]> {
    const rows = await this.drizzle
      .select()
      .from(parcelas)
      .where(
        and(
          eq(parcelas.contratoId, contratoId),
          isNull(parcelas.deletedAt)
        )
      )
      .orderBy(parcelas.numero)
    return rows.map(rowToParcela)
  }

  async update(userId: string, id: string, data: Partial<Contrato>): Promise<Contrato | null> {
    const existing = await this.findById(userId, id)
    if (!existing) return null

    const input = data as Record<string, unknown>
    const updateData: Record<string, unknown> = {}
    if (input.valorBase !== undefined) updateData.valorBase = input.valorBase
    if (input.percentualJuros !== undefined)
      updateData.percentualJuros = input.percentualJuros
    if (input.valorFinal !== undefined) updateData.valorFinal = input.valorFinal
    if (input.quantidadeParcelas !== undefined)
      updateData.quantidadeParcelas = input.quantidadeParcelas
    if (input.dataInicio !== undefined) updateData.dataInicio = input.dataInicio
    if (input.dataFinal !== undefined) updateData.dataFinal = input.dataFinal
    if (input.estado !== undefined) updateData.estado = input.estado
    if (input.updatedAt !== undefined) updateData.updatedAt = input.updatedAt
    if (Object.keys(updateData).length === 0) return existing
    await this.drizzle.update(contratos).set(updateData).where(and(eq(contratos.id, id), eq(contratos.userId, userId)))
    return this.findById(userId, id)
  }

  async softDelete(userId: string, id: string): Promise<void> {
    await this.drizzle
      .update(contratos)
      .set({ deletedAt: new Date().toISOString() })
      .where(and(eq(contratos.id, id), eq(contratos.userId, userId)))
  }

  async softDeleteParcelasByContratoId(_userId: string, contratoId: string): Promise<void> {
    await this.drizzle
      .update(parcelas)
      .set({ deletedAt: new Date().toISOString() })
      .where(eq(parcelas.contratoId, contratoId))
  }

  async hasPayments(userId: string, contratoId: string): Promise<boolean> {
    const rows = await this.drizzle
      .select({ total: count() })
      .from(pagamentos)
      .where(and(eq(pagamentos.contratoId, contratoId), eq(pagamentos.userId, userId)))
    return rows[0].total > 0
  }

  async getSaldoAtual(userId: string): Promise<number> {
    const caixa = await this.getCaixaConfig(userId)
    const base = caixa?.caixaBase ?? 0
    const entradas = sqlite
      .prepare("SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoesFinanceiras WHERE tipo = 'entrada' AND userId = ?")
      .get(userId) as { total: number }
    const saidas = sqlite
      .prepare("SELECT COALESCE(SUM(valor), 0) AS total FROM movimentacoesFinanceiras WHERE tipo = 'saida' AND userId = ?")
      .get(userId) as { total: number }
    return base + (Number(entradas.total) || 0) - (Number(saidas.total) || 0)
  }

  async getCaixaConfig(userId: string): Promise<CaixaConfig | null> {
    const rows = await this.drizzle
      .select()
      .from(caixaConfig)
      .where(eq(caixaConfig.userId, userId))
      .limit(1)
    if (rows.length === 0) return null
    return {
      userId: rows[0].userId,
      caixaBase: rows[0].caixaBase,
      updatedAt: rows[0].updatedAt,
    }
  }

  async updateCaixaBase(userId: string, valor: number): Promise<void> {
    const now = new Date().toISOString()
    await this.drizzle
      .update(caixaConfig)
      .set({
        caixaBase: sql`${caixaConfig.caixaBase} + ${valor}`,
        updatedAt: now,
      })
      .where(eq(caixaConfig.userId, userId))
  }

  async saveMovimentacaoFinanceira(userId: string, mov: MovimentacaoFinanceira): Promise<void> {
    await this.drizzle.insert(movimentacoesFinanceiras).values({
      id: mov.id,
      userId,
      tipo: mov.tipo,
      valor: mov.valor,
      origem: mov.origem,
      origemId: mov.origemId,
      descricao: mov.descricao ?? null,
      data: mov.data,
      createdAt: mov.createdAt,
    })
  }

  async transaction<T>(
    userId: string,
    fn: (repo: IContratoRepository) => Promise<T>
  ): Promise<T> {
    sqlite.exec("BEGIN IMMEDIATE")
    try {
      const result = await fn(this)
      sqlite.exec("COMMIT")
      return result
    } catch (error) {
      sqlite.exec("ROLLBACK")
      throw error
    }
  }
}
