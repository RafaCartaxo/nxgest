import { eq, and, isNull, sql, count, inArray } from "drizzle-orm"
import type { PgDatabase } from "drizzle-orm/pg-core"
import { db, contratos, parcelas, movimentacoesFinanceiras, caixaConfig, pagamentos, clientes } from "../../../../database.js"
import type { Contrato, Parcela, ContratoComParcelas, MovimentacaoFinanceira, CaixaConfig } from "../../domain/contrato.entity.js"
import type { IContratoRepository, FindAllParams, FindAllResult, ParcelaUpdateLote } from "../../application/ports/contrato.repository.js"
import type { IPagamentoRepository } from "../../../pagamento/application/ports/pagamento.repository.js"
import { PagamentoRepository } from "../../../pagamento/infrastructure/repositories/pagamento.repository.impl.js"
import { getLocalDateString, parseDateLocal } from "../../../../shared/utils/parseDateLocal.js"
import { isPeriodicidade } from "../../domain/periodicidade.js"

type ContratoRow = typeof contratos.$inferSelect
type ParcelaRow = typeof parcelas.$inferSelect
type CaixaRow = typeof caixaConfig.$inferSelect

function rowToContrato(row: ContratoRow & { clienteNome?: string | null }): Contrato {
  return {
    id: row.id,
    clienteId: row.clienteId,
    clienteNome: row.clienteNome ?? undefined,
    valorBase: row.valorBase,
    percentualJuros: row.percentualJuros,
    valorFinal: row.valorFinal,
    quantidadeParcelas: row.quantidadeParcelas,
    dataInicio: row.dataInicio,
    dataFinal: row.dataFinal,
    periodicidade: isPeriodicidade(row.periodicidade) ? row.periodicidade : "diaria",
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
  private drizzle: PgDatabase<any, any, any>

  constructor(drizzle?: PgDatabase<any, any, any>) {
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
      periodicidade: contrato.periodicidade,
      estado: contrato.estado,
      createdAt: contrato.createdAt,
      updatedAt: contrato.updatedAt,
      deletedAt: null,
    })
  }

  async saveParcelas(_userId: string, parcelasList: Parcela[]): Promise<void> {
    if (parcelasList.length === 0) return
    await this.drizzle.insert(parcelas).values(
      parcelasList.map((parcela) => ({
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
      }))
    )
  }

  async updateParcelasEmLote(_userId: string, updates: ParcelaUpdateLote[]): Promise<void> {
    if (updates.length === 0) return
    await this.drizzle.execute(sql`
      UPDATE ${parcelas} AS p SET
        valor_pago = v.valor_pago,
        saldo_pendente = v.saldo_pendente,
        estado = v.estado,
        data_quitacao = v.data_quitacao,
        updated_at = v.updated_at
      FROM (VALUES
        ${sql.join(
          updates.map((u) =>
            sql`(${u.id}, ${u.valorPago}::numeric, ${u.saldoPendente}::numeric, ${u.estado}, ${u.dataQuitacao}::date, ${u.updatedAt}::timestamptz)`
          ),
          sql`, `
        )}
      ) AS v(id, valor_pago, saldo_pendente, estado, data_quitacao, updated_at)
      WHERE p.id = v.id
    `)
  }

  async findById(userId: string, id: string): Promise<Contrato | null> {
    const rows = await this.drizzle
      .select({
        contrato: contratos,
        clienteNome: clientes.nome,
      })
      .from(contratos)
      .leftJoin(clientes, eq(contratos.clienteId, clientes.id))
      .where(and(eq(contratos.id, id), isNull(contratos.deletedAt), eq(contratos.userId, userId)))
      .limit(1)
    if (rows.length === 0) return null
    return rowToContrato({ ...rows[0].contrato, clienteNome: rows[0].clienteNome })
  }

  async findByIdWithParcelas(userId: string, id: string): Promise<ContratoComParcelas | null> {
    const rows = await this.drizzle
      .select({
        contrato: contratos,
        clienteNome: clientes.nome,
      })
      .from(contratos)
      .leftJoin(clientes, eq(contratos.clienteId, clientes.id))
      .where(and(eq(contratos.id, id), isNull(contratos.deletedAt), eq(contratos.userId, userId)))
      .limit(1)
    if (rows.length === 0) return null
    const contrato = rowToContrato({ ...rows[0].contrato, clienteNome: rows[0].clienteNome })
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
            total: sql<number>`COALESCE(SUM(${parcelas.saldoPendente}), 0)`,
            pagas: sql<number>`COALESCE(SUM(CASE WHEN ${parcelas.estado} = 'Paga' THEN 1 ELSE 0 END), 0)`,
            emAtraso: sql<number>`COALESCE(SUM(CASE WHEN ${parcelas.dataVencimento} < ${hoje} AND ${parcelas.saldoPendente} > 0 THEN ${parcelas.saldoPendente} ELSE 0 END), 0)`,
            parcelasEmAtraso: sql<number>`COALESCE(SUM(CASE WHEN ${parcelas.dataVencimento} < ${hoje} AND ${parcelas.saldoPendente} > 0 THEN 1 ELSE 0 END), 0)`,
            maisAntigaAtraso: sql<string | null>`MIN(CASE WHEN ${parcelas.dataVencimento} < ${hoje} AND ${parcelas.saldoPendente} > 0 THEN ${parcelas.dataVencimento} END)`,
          })
          .from(parcelas)
          .where(and(inArray(parcelas.contratoId, contratoIds), isNull(parcelas.deletedAt)))
          .groupBy(parcelas.contratoId)
      : []

    // G1: SUM() via drizzle volta string com numeric(12,2) — normalizar para number.
    const sumMap = new Map(sums.map((s) => [s.contratoId, {
      total: Number(s.total),
      pagas: Number(s.pagas),
      emAtraso: Number(s.emAtraso),
      parcelasEmAtraso: Number(s.parcelasEmAtraso),
      maisAntigaAtraso: s.maisAntigaAtraso,
    }]))

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
    if (input.periodicidade !== undefined) updateData.periodicidade = input.periodicidade
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
    // PLAN-083 Fase 7.1: a leitura de saldo roda no MESMO client da transação (this.drizzle.execute),
    // não no pool global (rawQuery). `getSaldoAtual` é chamado dentro de Create/UpdateContratoUseCase
    // via `repo` ligado à tx — antes o check de saldo lia em outra conexão, fora da transação
    // (sem read-your-writes nem locks do mesmo tx). Sem tx (repo default), `this.drizzle` é o `db`.
    const caixa = await this.getCaixaConfig(userId)
    const base = caixa?.caixaBase ?? 0
    const [entradas, saidas] = await Promise.all([
      this.drizzle.execute<{ total: string }>(sql`
        SELECT COALESCE(SUM(valor), 0) AS total
        FROM "movimentacoes_financeiras"
        WHERE tipo = 'entrada' AND "user_id" = ${userId}
      `),
      this.drizzle.execute<{ total: string }>(sql`
        SELECT COALESCE(SUM(valor), 0) AS total
        FROM "movimentacoes_financeiras"
        WHERE tipo = 'saida' AND "user_id" = ${userId}
      `),
    ])
    return base + (Number(entradas.rows[0]?.total) || 0) - (Number(saidas.rows[0]?.total) || 0)
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
    _userId: string,
    fn: (repo: IContratoRepository, pagamentoRepo: IPagamentoRepository) => Promise<T>
  ): Promise<T> {
    return db.transaction(async (tx) => {
      const repo = new ContratoRepository(tx as unknown as PgDatabase<any, any, any>)
      const pagamentoRepo = new PagamentoRepository(tx as unknown as PgDatabase<any, any, any>)
      return fn(repo, pagamentoRepo)
    })
  }
}
