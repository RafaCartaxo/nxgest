import { v4 as uuidv4 } from "uuid"
import { rawQuery } from "../../../../database.js"
import type {
  IOperacoesRepository,
  CobrancaDoDiaResult,
  CobrancaItem,
  PagamentoDoDiaItem,
  ParcelaHojeCliente,
  RegistrarVisitaInput,
  RegistrarVisitaOutput,
  SnapshotAtraso,
} from "../../application/ports/operacoes.repository.js"
import { getLocalDateString, rangeDoDiaLocal } from "../../../../shared/utils/parseDateLocal.js"

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

interface CobrancaRow {
  cliente_id: string
  cliente_nome: string
  cliente_telefone: string
  cliente_lat: number | null
  cliente_lng: number | null
  cliente_logradouro: string | null
  cliente_numero: string | null
  cliente_bairro: string | null
  cliente_cidade: string | null
  cliente_estado: string | null
  contrato_id: string
  total_pendente: number
  quantidade_parcelas: number
  situacao: "atrasado" | "venceHoje"
  dias_em_atraso: number
  visitado_em: string | null
  resultado_operacional: string | null
  proxima_parcela: number
  proximo_numero_parcela: number
  total_parcelas_contrato: number
  saldo_total: number
  distancia?: number
}

export class OperacoesRepository implements IOperacoesRepository {
  async listarCobrancasDoDia(userId: string, operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult> {
    const hoje = getLocalDateString(new Date())
    const { inicio, fim } = rangeDoDiaLocal(hoje)

    const { rows } = await rawQuery<CobrancaRow>(`
      SELECT
        c.id AS "cliente_id",
        c.nome AS "cliente_nome",
        c.telefone AS "cliente_telefone",
        COALESCE(c."comercio_lat", c.lat) AS "cliente_lat",
        COALESCE(c."comercio_lng", c.lng) AS "cliente_lng",
        COALESCE(c."comercio_logradouro", c.logradouro) AS "cliente_logradouro",
        COALESCE(c."comercio_numero", c.numero) AS "cliente_numero",
        COALESCE(c."comercio_bairro", c.bairro) AS "cliente_bairro",
        COALESCE(c."comercio_cidade", c.cidade) AS "cliente_cidade",
        COALESCE(c."comercio_estado", c.estado) AS "cliente_estado",
        ct.id AS "contrato_id",
        ct."quantidade_parcelas" AS "total_parcelas_contrato",
        SUM(p."saldo_pendente") AS "total_pendente",
        (SELECT COALESCE(SUM(p3."saldo_pendente"), 0)
         FROM parcelas p3
         WHERE p3."contrato_id" = ct.id
           AND p3."saldo_pendente" > 0
           AND p3."deleted_at" IS NULL) AS "saldo_total",
        COUNT(p.id) AS "quantidade_parcelas",
        CASE
          WHEN MIN(p."data_vencimento") < ? THEN 'atrasado'
          ELSE 'venceHoje'
        END AS situacao,
        v."visitado_em",
        v."resultado_operacional",
        COALESCE(prox.numero, 0) AS "proximo_numero_parcela",
        COALESCE(prox."saldo_pendente", 0) AS "proxima_parcela",
        COALESCE(
          ?::date - (MIN(p."data_vencimento") FILTER (WHERE p."data_vencimento" < ?))::date,
          0
        ) AS "dias_em_atraso"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      JOIN clientes c ON c.id = ct."cliente_id"
      LEFT JOIN LATERAL (
        SELECT p2.numero, p2."saldo_pendente"
        FROM parcelas p2
        WHERE p2."contrato_id" = ct.id
          AND p2."saldo_pendente" > 0
          AND p2."deleted_at" IS NULL
        ORDER BY p2."data_vencimento" ASC, p2.numero ASC
        LIMIT 1
      ) prox ON true
      LEFT JOIN LATERAL (
        SELECT h."created_at" AS "visitado_em", h."tipo" AS "resultado_operacional"
        FROM historico_operacional h
        WHERE h."cliente_id" = c.id
          AND h."contrato_id" = ct.id
          AND h."created_at" >= ?
          AND h."created_at" < ?
          AND h."user_id" = ?
        ORDER BY h."created_at" DESC
        LIMIT 1
      ) v ON true
      WHERE p."saldo_pendente" > 0
        AND p."data_vencimento" <= ?
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND c."deleted_at" IS NULL
        AND ct."user_id" = ?
      GROUP BY c.id, ct.id, v."visitado_em", v."resultado_operacional", prox.numero, prox."saldo_pendente"
      ORDER BY
        situacao DESC,
        MIN(p."data_vencimento") ASC,
        ct."created_at" ASC
    `, [hoje, hoje, hoje, inicio, fim, userId, hoje, userId]) as { rows: CobrancaRow[] }

    const { rows: aReceberHojeRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(p."saldo_pendente"), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      WHERE p."data_vencimento" = ?
        AND p."saldo_pendente" > 0
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND ct."user_id" = ?
    `, [hoje, userId])

    const { rows: atrasadoRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(p."saldo_pendente"), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      WHERE p."data_vencimento" < ?
        AND p."saldo_pendente" > 0
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND ct."user_id" = ?
    `, [hoje, userId])

    const { rows: aVencerRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(p."saldo_pendente"), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      WHERE p."data_vencimento" > ? AND p."data_vencimento" <= (?::date + INTERVAL '7 days')
        AND p."saldo_pendente" > 0
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND ct."user_id" = ?
    `, [hoje, hoje, userId])

    const { rows: recebidoHojeRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM pagamentos
      WHERE data = ?
        AND "user_id" = ?
    `, [hoje, userId])

    const hasGPS = typeof operadorLat === "number" && typeof operadorLng === "number"

    const cobrancas: (CobrancaRow & { distancia?: number })[] = rows.map((r) => {
      const distancia = hasGPS && r.cliente_lat != null && r.cliente_lng != null
        ? Math.round(haversineKm(operadorLat!, operadorLng!, r.cliente_lat, r.cliente_lng) * 10) / 10
        : undefined
      return { ...r, distancia }
    })

    const clientHasAtrasado = new Map<string, boolean>()
    for (const c of cobrancas) {
      if (c.situacao === "atrasado") {
        clientHasAtrasado.set(c.cliente_id, true)
      }
      if (!clientHasAtrasado.has(c.cliente_id)) {
        clientHasAtrasado.set(c.cliente_id, false)
      }
    }

    cobrancas.sort((a, b) => {
      const aHasAtrasado = clientHasAtrasado.get(a.cliente_id) ?? false
      const bHasAtrasado = clientHasAtrasado.get(b.cliente_id) ?? false
      if (aHasAtrasado && !bHasAtrasado) return -1
      if (!aHasAtrasado && bHasAtrasado) return 1

      if (a.resultado_operacional !== "PENDENTE" && b.resultado_operacional === "PENDENTE") return 1
      if (a.resultado_operacional === "PENDENTE" && b.resultado_operacional !== "PENDENTE") return -1

      if (hasGPS) {
        const da = a.distancia ?? Infinity
        const db = b.distancia ?? Infinity
        if (da !== db) return da - db
      }

      if (a.cliente_id === b.cliente_id) {
        if (a.situacao === "atrasado" && b.situacao !== "atrasado") return -1
        if (b.situacao === "atrasado" && a.situacao !== "atrasado") return 1
      }

      return 0
    })

    const items: CobrancaItem[] = cobrancas.map((r) => ({
      clienteId: r.cliente_id,
      clienteNome: r.cliente_nome,
      clienteTelefone: r.cliente_telefone,
      clienteLat: r.cliente_lat,
      clienteLng: r.cliente_lng,
      clienteLogradouro: r.cliente_logradouro,
      clienteNumero: r.cliente_numero,
      clienteBairro: r.cliente_bairro,
      clienteCidade: r.cliente_cidade,
      clienteEstado: r.cliente_estado,
      contratoId: r.contrato_id,
      totalPendente: r.total_pendente,
      quantidadeParcelas: r.quantidade_parcelas,
      situacao: r.situacao,
      diasEmAtraso: r.dias_em_atraso,
      resultadoOperacional: r.resultado_operacional === null ? "PENDENTE"
        : r.resultado_operacional === "visitado" ? "VISITADO"
        : r.resultado_operacional === "nao_localizado" ? "NAO_ENCONTRADO"
        : r.resultado_operacional === "promessa" ? "PROMESSA"
        : "PENDENTE",
      proximaParcela: r.proxima_parcela,
      proximoNumeroParcela: r.proximo_numero_parcela,
      totalParcelasContrato: r.total_parcelas_contrato,
      saldoTotal: r.saldo_total,
    }))

    const clientesMap = new Set<string>()
    for (const c of items) {
      if (c.resultadoOperacional === "PENDENTE") {
        clientesMap.add(c.clienteId)
      }
    }

    return {
      indicadores: {
        aReceberHoje: Number(aReceberHojeRows[0]?.total ?? 0),
        recebidoHoje: Number(recebidoHojeRows[0]?.total ?? 0),
        clientesParaCobrar: clientesMap.size,
        atrasado: Number(atrasadoRows[0]?.total ?? 0),
        aVencer: Number(aVencerRows[0]?.total ?? 0),
      },
      cobrancas: items,
    }
  }

  async listarPagamentosDoDia(userId: string, dataInicio?: string, dataFim?: string): Promise<PagamentoDoDiaItem[]> {
    const inicio = dataInicio ?? getLocalDateString(new Date())
    const fim = dataFim ?? inicio

    const { rows } = await rawQuery<{
      pagamento_id: string
      valor: number
      data: string
      created_at: string
      cliente_id: string
      cliente_nome: string
      contrato_id: string
    }>(`
      SELECT
        p.id AS "pagamento_id",
        p.valor,
        p.data,
        p."created_at",
        cli.id AS "cliente_id",
        cli.nome AS "cliente_nome",
        ct.id AS "contrato_id"
      FROM pagamentos p
      JOIN contratos ct ON ct.id = p."contrato_id"
      JOIN clientes cli ON cli.id = ct."cliente_id"
      WHERE p.data >= ? AND p.data <= ?
        AND ct."deleted_at" IS NULL
        AND cli."deleted_at" IS NULL
        AND ct."user_id" = ?
      ORDER BY p."created_at" DESC
    `, [inicio, fim, userId])

    return rows.map((r) => ({
      pagamentoId: r.pagamento_id,
      valor: r.valor,
      data: r.data,
      createdAt: r.created_at,
      clienteId: r.cliente_id,
      clienteNome: r.cliente_nome,
      contratoId: r.contrato_id,
    }))
  }

  async listarParcelasHoje(userId: string): Promise<ParcelaHojeCliente[]> {
    const hoje = getLocalDateString(new Date())

    const { rows } = await rawQuery<{
      cliente_id: string
      cliente_nome: string
      contrato_id: string
      numero: number
      valor_previsto: number
      saldo_pendente: number
    }>(`
      SELECT
        c.id AS "cliente_id",
        c.nome AS "cliente_nome",
        ct.id AS "contrato_id",
        p.numero,
        p."valor_previsto",
        p."saldo_pendente"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      JOIN clientes c ON c.id = ct."cliente_id"
      WHERE p."data_vencimento" = ?
        AND p."saldo_pendente" > 0
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND c."deleted_at" IS NULL
        AND ct."user_id" = ?
      ORDER BY c.nome ASC, p.numero ASC
    `, [hoje, userId])

    const clientesMap = new Map<string, ParcelaHojeCliente>()

    for (const row of rows) {
      const key = `${row.cliente_id}-${row.contrato_id}`
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          clienteId: row.cliente_id,
          clienteNome: row.cliente_nome,
          contratoId: row.contrato_id,
          parcelas: [],
        })
      }
      clientesMap.get(key)!.parcelas.push({
        numero: row.numero,
        valorPrevisto: row.valor_previsto,
        saldoPendente: row.saldo_pendente,
      })
    }

    return Array.from(clientesMap.values())
  }

  async listarParcelasSemana(userId: string): Promise<ParcelaHojeCliente[]> {
    const hoje = getLocalDateString(new Date())
    const seteDias = new Date()
    seteDias.setDate(seteDias.getDate() + 7)
    const fim = getLocalDateString(seteDias)

    const { rows } = await rawQuery<{
      cliente_id: string
      cliente_nome: string
      contrato_id: string
      numero: number
      valor_previsto: number
      saldo_pendente: number
    }>(`
      SELECT
        c.id AS "cliente_id",
        c.nome AS "cliente_nome",
        ct.id AS "contrato_id",
        p.numero,
        p."valor_previsto",
        p."saldo_pendente"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      JOIN clientes c ON c.id = ct."cliente_id"
      WHERE p."data_vencimento" > ?
        AND p."data_vencimento" <= ?
        AND p."saldo_pendente" > 0
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND c."deleted_at" IS NULL
        AND ct."user_id" = ?
      ORDER BY c.nome ASC, p."data_vencimento" ASC, p.numero ASC
    `, [hoje, fim, userId])

    const clientesMap = new Map<string, ParcelaHojeCliente>()

    for (const row of rows) {
      const key = `${row.cliente_id}-${row.contrato_id}`
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          clienteId: row.cliente_id,
          clienteNome: row.cliente_nome,
          contratoId: row.contrato_id,
          parcelas: [],
        })
      }
      clientesMap.get(key)!.parcelas.push({
        numero: row.numero,
        valorPrevisto: row.valor_previsto,
        saldoPendente: row.saldo_pendente,
      })
    }

    return Array.from(clientesMap.values())
  }

  async registrarSnapshotAtraso(userId: string, data?: string): Promise<void> {
    const hoje = data ?? getLocalDateString(new Date())

    const { rows: atrasadoRows } = await rawQuery<{ clientes_atrasados: number; contratos_atrasados: number; valor_atrasado: number }>(`
      SELECT
        COUNT(DISTINCT ct."cliente_id") AS "clientes_atrasados",
        COUNT(DISTINCT ct.id) AS "contratos_atrasados",
        COALESCE(SUM(p."saldo_pendente"), 0) AS "valor_atrasado"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contrato_id"
      WHERE p."data_vencimento" < ?
        AND p."saldo_pendente" > 0
        AND p."deleted_at" IS NULL
        AND ct."deleted_at" IS NULL
        AND ct."user_id" = ?
    `, [hoje, userId])
    const atrasadoRow = atrasadoRows[0]

    await rawQuery(`
      INSERT INTO snapshots_atraso (id, "user_id", data, "clientes_atrasados", "contratos_atrasados", "valor_atrasado", "created_at")
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT ("user_id", data) DO UPDATE SET
        "clientes_atrasados" = excluded."clientes_atrasados",
        "contratos_atrasados" = excluded."contratos_atrasados",
        "valor_atrasado" = excluded."valor_atrasado",
        "created_at" = excluded."created_at"
    `, [
      uuidv4(),
      userId,
      hoje,
      atrasadoRow.clientes_atrasados,
      atrasadoRow.contratos_atrasados,
      atrasadoRow.valor_atrasado,
      new Date().toISOString(),
    ])
  }

  async listarHistoricoAtrasos(userId: string, dias = 30): Promise<SnapshotAtraso[]> {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - (dias - 1))
    const limiteStr = getLocalDateString(dataLimite)

    const { rows } = await rawQuery<SnapshotAtraso>(`
      SELECT
        data,
        "clientes_atrasados",
        "contratos_atrasados",
        "valor_atrasado"
      FROM snapshots_atraso
      WHERE "user_id" = ?
        AND data >= ?
      ORDER BY data DESC
      LIMIT ?
    `, [userId, limiteStr, dias])

    return rows
  }

  async registrarVisita(userId: string, input: RegistrarVisitaInput): Promise<RegistrarVisitaOutput> {
    const id = uuidv4()
    const createdAt = new Date().toISOString()

    await rawQuery(`
      INSERT INTO historico_operacional (id, "cliente_id", "contrato_id", "tipo", "data_promessa", "user_id", "created_at")
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [id, input.clienteId, input.contratoId, input.tipo, input.dataPromessa ?? null, userId, createdAt])

    return {
      id,
      clienteId: input.clienteId,
      contratoId: input.contratoId,
      tipo: input.tipo,
      dataPromessa: input.dataPromessa ?? null,
      createdAt,
    }
  }
}
