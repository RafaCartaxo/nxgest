import { eq, and, gte, lte, sql, count, sum, desc, isNull } from "drizzle-orm"
import { db, rawQuery, movimentacoesFinanceiras, caixaConfig, fechamentosSemanais, auditoriaCaixa, contratos, pagamentos, usuarios } from "../../../../database.js"
import type { CaixaConfig, MovimentacaoFinanceira, FechamentoSemanal } from "../../domain/caixa.entity.js"
import type { ICaixaRepository, ListMovimentacoesParams, ListMovimentacoesResult, AuditoriaCaixa, ListarAuditoriaCaixaResult, FluxoConsolidado } from "../../application/ports/caixa.repository.js"
import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"

export class CaixaRepository implements ICaixaRepository {
  async getCaixaConfig(userId: string): Promise<CaixaConfig | null> {
    const rows = await db
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

  async getOrCreateCaixaConfig(userId: string): Promise<CaixaConfig> {
    const existing = await this.getCaixaConfig(userId)
    if (existing) return existing
    const now = new Date().toISOString()
    await db.insert(caixaConfig).values({ userId, caixaBase: 0, updatedAt: now })
    return { userId, caixaBase: 0, updatedAt: now }
  }

  async updateCaixaBase(userId: string, valor: number): Promise<void> {
    const now = new Date().toISOString()
    await db
      .update(caixaConfig)
      .set({
        caixaBase: sql`${caixaConfig.caixaBase} + ${valor}`,
        updatedAt: now,
      })
      .where(eq(caixaConfig.userId, userId))
  }

  async saveAuditoriaCaixa(a: AuditoriaCaixa): Promise<void> {
    await db.insert(auditoriaCaixa).values({
      id: a.id,
      operadorId: a.operadorId,
      adminId: a.adminId,
      valorAnterior: a.valorAnterior,
      valorNovo: a.valorNovo,
      motivo: a.motivo,
      data: a.data,
      createdAt: a.createdAt,
    })
  }

  async listAuditoriaCaixa(operadorId: string, params: { page?: number; limit?: number }): Promise<ListarAuditoriaCaixaResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    const { rows: data } = await rawQuery<{ id: string; operador_id: string; admin_id: string; valor_anterior: number; valor_novo: number; motivo: string; data: string; created_at: string; admin_nome: string | null }>(`
      SELECT
        a.id, a."operador_id", a."admin_id", a."valor_anterior", a."valor_novo", a.motivo, a.data, a."created_at",
        u.nome AS "admin_nome"
      FROM auditoria_caixa a
      LEFT JOIN usuarios u ON u.id = a."admin_id"
      WHERE a."operador_id" = ?
      ORDER BY a."created_at" DESC
      LIMIT ? OFFSET ?
    `, [operadorId, limit, offset])

    const { rows: countRows } = await rawQuery<{ total: number }>(`
      SELECT COUNT(*) AS total FROM auditoria_caixa a WHERE a."operador_id" = ?
    `, [operadorId])

    const total = Number(countRows[0]?.total ?? 0)
    return {
      data: data.map((r) => ({
        id: r.id,
        operadorId: r.operador_id,
        adminId: r.admin_id,
        valorAnterior: r.valor_anterior,
        valorNovo: r.valor_novo,
        motivo: r.motivo,
        data: r.data,
        createdAt: r.created_at,
        adminNome: r.admin_nome,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async saveMovimentacaoFinanceira(userId: string, m: MovimentacaoFinanceira): Promise<void> {
    await db.insert(movimentacoesFinanceiras).values({
      id: m.id,
      tipo: m.tipo,
      valor: m.valor,
      origem: m.origem,
      origemId: m.origemId ?? "",
      descricao: m.descricao ?? null,
      userId,
      data: m.data,
      createdAt: m.createdAt,
    })
  }

  async listMovimentacoes(userId: string, params: ListMovimentacoesParams): Promise<ListMovimentacoesResult> {
    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const offset = (page - 1) * limit

    const conditions: string[] = ["1=1"]
    const bindings: string[] = []

    conditions.push('m."user_id" = ?')
    bindings.push(userId)

    if (params.dataInicio) {
      conditions.push('m."data" >= ?')
      bindings.push(params.dataInicio)
    }
    if (params.dataFim) {
      conditions.push("m.data <= ?")
      bindings.push(params.dataFim)
    }
    if (params.origem) {
      conditions.push("m.origem = ?")
      bindings.push(params.origem)
    }

    const where = conditions.join(" AND ")

    // PLAN-083 Fase 2.1: resolução de cliente_nome/categoria via LEFT JOINs (antes eram 5
    // subqueries correlacionadas por linha — ~80 scans/página). COALESCE(cl_pg.nome, cl.nome)
    // reproduz o fallback pagamento→contrato da origem 'Cancelamento'. Sem filtro de
    // deleted_at nos JOINs, espelhando as subqueries originais.
    const { rows: data } = await rawQuery<{ id: string; tipo: string; valor: number; origem: string; origem_id: string; descricao: string | null; data: string; created_at: string; cliente_nome: string | null; categoria: string | null }>(`
      SELECT
        m.id, m.tipo, m.valor, m.origem, m."origem_id", m.descricao, m.data, m."created_at",
        COALESCE(cl_pg.nome, cl.nome) AS "cliente_nome",
        g.categoria AS "categoria"
      FROM "movimentacoes_financeiras" m
      LEFT JOIN pagamentos pg ON pg.id = m."origem_id" AND m.origem IN ('Pagamento', 'Cancelamento')
      LEFT JOIN contratos ct_pg ON ct_pg.id = pg."contrato_id"
      LEFT JOIN clientes cl_pg ON cl_pg.id = ct_pg."cliente_id"
      LEFT JOIN contratos ct ON ct.id = m."origem_id" AND m.origem IN ('Cancelamento', 'Contrato', 'Ajuste')
      LEFT JOIN clientes cl ON cl.id = ct."cliente_id"
      LEFT JOIN gastos g ON g.id = m."origem_id" AND m.origem = 'Gasto' AND g."deleted_at" IS NULL
      WHERE ${where}
      ORDER BY m."created_at" DESC
      LIMIT ? OFFSET ?
    `, [...bindings, limit, offset])

    const { rows: countRows } = await rawQuery<{ total: number }>(`
      SELECT COUNT(*) AS total FROM "movimentacoes_financeiras" m WHERE ${where}
    `, bindings)

    const total = Number(countRows[0]?.total ?? 0)

    return {
      data: data.map((row) => ({
        id: row.id,
        tipo: row.tipo as MovimentacaoFinanceira["tipo"],
        valor: row.valor,
        origem: row.origem as MovimentacaoFinanceira["origem"],
        origemId: row.origem_id || undefined,
        descricao: row.descricao ?? undefined,
        clienteNome: row.cliente_nome ?? undefined,
        categoria: row.categoria ?? undefined,
        data: row.data,
        createdAt: row.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    }
  }

  async getRecebidoSemana(userId: string, dataInicio: string, dataFim: string): Promise<number> {
    const result = await db
      .select({ total: sum(movimentacoesFinanceiras.valor) })
      .from(movimentacoesFinanceiras)
      .where(
        and(
          eq(movimentacoesFinanceiras.userId, userId),
          eq(movimentacoesFinanceiras.origem, "Pagamento"),
          gte(movimentacoesFinanceiras.data, dataInicio),
          lte(movimentacoesFinanceiras.data, dataFim),
        ),
      )
    return Number(result[0]?.total) || 0
  }

  async getGastoSemana(userId: string, dataInicio: string, dataFim: string): Promise<number> {
    const result = await db
      .select({ total: sum(movimentacoesFinanceiras.valor) })
      .from(movimentacoesFinanceiras)
      .where(
        and(
          eq(movimentacoesFinanceiras.userId, userId),
          eq(movimentacoesFinanceiras.origem, "Gasto"),
          gte(movimentacoesFinanceiras.data, dataInicio),
          lte(movimentacoesFinanceiras.data, dataFim),
        ),
      )
    return Number(result[0]?.total) || 0
  }

  async getFluxoConsolidado(userId: string, dataInicio?: string, dataFim?: string): Promise<FluxoConsolidado> {
    // PLAN-083 Fase 1: substitui getSaldoAtual(2) + getLucro(2) + getRecebidoSemana(1) + getGastoSemana(1)
    // por um único scan de movimentacoes_financeiras com FILTERs por linha. `dataInicio` NULL =
    // fluxo desde o início (mesma semântica do getSaldoAtual sem filtro / getLucro).
    const { rows } = await rawQuery<{
      entradas: number
      saidas: number
      entradas_desde: number
      saidas_desde: number
      recebido_semana: number
      gasto_semana: number
    }>(`
      SELECT
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada'), 0) AS entradas,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida'), 0) AS saidas,
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'entrada' AND (data >= ?::date OR ?::date IS NULL)), 0) AS "entradas_desde",
        COALESCE(SUM(valor) FILTER (WHERE tipo = 'saida' AND (data >= ?::date OR ?::date IS NULL)), 0) AS "saidas_desde",
        COALESCE(SUM(valor) FILTER (WHERE origem = 'Pagamento' AND data BETWEEN ?::date AND ?::date), 0) AS "recebido_semana",
        COALESCE(SUM(valor) FILTER (WHERE origem = 'Gasto' AND data BETWEEN ?::date AND ?::date), 0) AS "gasto_semana"
      FROM "movimentacoes_financeiras"
      WHERE "user_id" = ?
    `, [
      dataInicio ?? null, dataInicio ?? null,
      dataInicio ?? null, dataInicio ?? null,
      dataFim, dataFim,
      dataFim, dataFim,
      userId,
    ])
    const r = rows[0]
    return {
      entradas: Number(r?.entradas) || 0,
      saidas: Number(r?.saidas) || 0,
      entradasDesde: Number(r?.entradas_desde) || 0,
      saidasDesde: Number(r?.saidas_desde) || 0,
      recebidoSemana: Number(r?.recebido_semana) || 0,
      gastoSemana: Number(r?.gasto_semana) || 0,
    }
  }

  async getSaldoAtual(userId: string, dataInicio?: string): Promise<number> {
    const params: string[] = [userId]
    let filtro = ""
    if (dataInicio) {
      filtro = " AND data >= ?"
      params.push(dataInicio)
    }

    const { rows: entradas } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM "movimentacoes_financeiras" WHERE tipo = 'entrada' AND "user_id" = ?${filtro}`,
      params,
    )
    const { rows: saidas } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM "movimentacoes_financeiras" WHERE tipo = 'saida' AND "user_id" = ?${filtro}`,
      params,
    )

    const caixa = await this.getCaixaConfig(userId)
    const base = caixa?.caixaBase ?? 0
    const totalEntradas = Number(entradas[0]?.total) || 0
    const totalSaidas = Number(saidas[0]?.total) || 0
    return base + totalEntradas - totalSaidas
  }

  async getLucro(userId: string): Promise<number> {
    const { rows: entradas } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM "movimentacoes_financeiras" WHERE tipo = 'entrada' AND "user_id" = ?`,
      [userId],
    )
    const { rows: saidas } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM "movimentacoes_financeiras" WHERE tipo = 'saida' AND "user_id" = ?`,
      [userId],
    )
    return (Number(entradas[0]?.total) || 0) - (Number(saidas[0]?.total) || 0)
  }

  async getAReceberHoje(userId: string): Promise<number> {
    const hoje = getLocalDateString(new Date())
    const { rows } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM(p."saldo_pendente"), 0) AS total
         FROM parcelas p
         JOIN contratos ct ON ct.id = p."contrato_id"
         WHERE p."data_vencimento" = ? AND p."saldo_pendente" > 0 AND p."deleted_at" IS NULL AND ct."deleted_at" IS NULL AND ct."user_id" = ?`,
      [hoje, userId],
    )
    return Number(rows[0]?.total ?? 0)
  }

  async getRecebidoHoje(userId: string): Promise<number> {
    const hoje = getLocalDateString(new Date())
    const { rows } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM(valor), 0) AS total
         FROM pagamentos
         WHERE data = ? AND "user_id" = ?`,
      [hoje, userId],
    )
    return Number(rows[0]?.total ?? 0)
  }

  async getVendasSemana(userId: string, dataInicio: string, dataFim: string): Promise<number> {
    const { rows } = await rawQuery<{ total: number }>(
      `SELECT COALESCE(SUM("valor_base"), 0) AS total
         FROM contratos
         WHERE "data_inicio" >= ? AND "data_inicio" <= ? AND "deleted_at" IS NULL AND "user_id" = ?`,
      [dataInicio, dataFim, userId],
    )
    return Number(rows[0]?.total ?? 0)
  }

  async getUltimaLiquidacao(userId: string): Promise<FechamentoSemanal | null> {
    const rows = await db
      .select()
      .from(fechamentosSemanais)
      .where(eq(fechamentosSemanais.userId, userId))
      .orderBy(desc(fechamentosSemanais.createdAt))
      .limit(1)
    if (rows.length === 0) return null
    return {
      id: rows[0].id,
      dataInicio: rows[0].dataInicio,
      dataFim: rows[0].dataFim,
      totalRecebido: rows[0].totalRecebido,
      totalGasto: rows[0].totalGasto,
      resultado: rows[0].resultado,
      caixaBase: rows[0].caixaBase,
      saldoFechamento: rows[0].saldoFechamento,
      createdAt: rows[0].createdAt,
    }
  }

  async saveFechamentoSemanal(userId: string, f: FechamentoSemanal): Promise<boolean> {
    const result = await db
      .insert(fechamentosSemanais)
      .values({
        id: f.id,
        dataInicio: f.dataInicio,
        dataFim: f.dataFim,
        totalRecebido: f.totalRecebido,
        totalGasto: f.totalGasto,
        resultado: f.resultado,
        caixaBase: f.caixaBase,
        saldoFechamento: f.saldoFechamento,
        userId,
        createdAt: f.createdAt,
      })
      .onConflictDoNothing()
    return (result.rowCount ?? 0) > 0
  }

  async findFechamentoPorPeriodo(userId: string, dataInicio: string, dataFim: string): Promise<FechamentoSemanal | null> {
    const rows = await db
      .select()
      .from(fechamentosSemanais)
      .where(
        and(
          eq(fechamentosSemanais.userId, userId),
          eq(fechamentosSemanais.dataInicio, dataInicio),
          eq(fechamentosSemanais.dataFim, dataFim),
        ),
      )
      .limit(1)
    if (rows.length === 0) return null
    return {
      id: rows[0].id,
      dataInicio: rows[0].dataInicio,
      dataFim: rows[0].dataFim,
      totalRecebido: rows[0].totalRecebido,
      totalGasto: rows[0].totalGasto,
      resultado: rows[0].resultado,
      caixaBase: rows[0].caixaBase,
      saldoFechamento: rows[0].saldoFechamento,
      createdAt: rows[0].createdAt,
    }
  }
}
