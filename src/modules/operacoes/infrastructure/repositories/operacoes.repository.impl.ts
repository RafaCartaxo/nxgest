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
import { getLocalDateString } from "../../../../shared/utils/parseDateLocal.js"

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
  clienteId: string
  clienteNome: string
  clienteTelefone: string
  clienteLat: number | null
  clienteLng: number | null
  clienteLogradouro: string
  clienteNumero: string | null
  clienteBairro: string | null
  clienteCidade: string | null
  clienteEstado: string | null
  contratoId: string
  totalPendente: number
  quantidadeParcelas: number
  situacao: "atrasado" | "venceHoje"
  diasEmAtraso: number
  visitadoEm: string | null
  resultadoOperacional: string | null
  proximaParcela: number
  proximoNumeroParcela: number
  totalParcelasContrato: number
  saldoTotal: number
  distancia?: number
}

export class OperacoesRepository implements IOperacoesRepository {
  async listarCobrancasDoDia(userId: string, operadorLat?: number, operadorLng?: number): Promise<CobrancaDoDiaResult> {
    const hoje = getLocalDateString(new Date())
    const amanha = getLocalDateString(new Date(Date.now() + 86_400_000))
    const inicio = `${hoje}T00:00:00.000Z`
    const fim = `${amanha}T00:00:00.000Z`

    const { rows } = await rawQuery<CobrancaRow>(`
      SELECT
        c.id AS "clienteId",
        c.nome AS "clienteNome",
        c.telefone AS "clienteTelefone",
        COALESCE(c."comercioLat", c.lat) AS "clienteLat",
        COALESCE(c."comercioLng", c.lng) AS "clienteLng",
        COALESCE(c."comercioLogradouro", c.logradouro) AS "clienteLogradouro",
        COALESCE(c."comercioNumero", c.numero) AS "clienteNumero",
        COALESCE(c."comercioBairro", c.bairro) AS "clienteBairro",
        COALESCE(c."comercioCidade", c.cidade) AS "clienteCidade",
        COALESCE(c."comercioEstado", c.estado) AS "clienteEstado",
        ct.id AS "contratoId",
        ct."quantidadeParcelas" AS "totalParcelasContrato",
        SUM(p."saldoPendente") AS "totalPendente",
        (SELECT COALESCE(SUM(p3."saldoPendente"), 0)
         FROM parcelas p3
         WHERE p3."contratoId" = ct.id
           AND p3."saldoPendente" > 0
           AND p3."deletedAt" IS NULL) AS "saldoTotal",
        COUNT(p.id) AS "quantidadeParcelas",
        CASE
          WHEN MIN(p."dataVencimento") < ? THEN 'atrasado'
          ELSE 'venceHoje'
        END AS situacao,
        v."visitadoEm",
        v."resultadoOperacional",
        COALESCE((
          SELECT p2.numero
          FROM parcelas p2
          WHERE p2."contratoId" = ct.id
            AND p2."saldoPendente" > 0
            AND p2."deletedAt" IS NULL
          ORDER BY p2."dataVencimento" ASC, p2.numero ASC
          LIMIT 1
        ), 0) AS "proximoNumeroParcela",
        COALESCE((
          SELECT p2."saldoPendente"
          FROM parcelas p2
          WHERE p2."contratoId" = ct.id
            AND p2."saldoPendente" > 0
            AND p2."deletedAt" IS NULL
          ORDER BY p2."dataVencimento" ASC, p2.numero ASC
          LIMIT 1
        ), 0) AS "proximaParcela",
        COALESCE(
          ?::date - (MIN(p."dataVencimento") FILTER (WHERE p."dataVencimento" < ?))::date,
          0
        ) AS "diasEmAtraso"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      JOIN clientes c ON c.id = ct."clienteId"
      LEFT JOIN (
        SELECT h."clienteId", h."contratoId",
          MAX(h."createdAt") AS "visitadoEm",
          (SELECT h2."tipo" FROM historico_operacional h2
           WHERE h2."clienteId" = h."clienteId"
             AND h2."contratoId" = h."contratoId"
             AND h2."createdAt" >= ?
             AND h2."createdAt" < ?
             AND h2."userId" = ?
           ORDER BY h2."createdAt" DESC LIMIT 1) AS "resultadoOperacional"
        FROM historico_operacional h
        WHERE h."createdAt" >= ?
          AND h."createdAt" < ?
          AND h."userId" = ?
        GROUP BY h."clienteId", h."contratoId"
      ) v ON v."clienteId" = c.id AND v."contratoId" = ct.id
      WHERE p."saldoPendente" > 0
        AND p."dataVencimento" <= ?
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND c."deletedAt" IS NULL
        AND ct."userId" = ?
      GROUP BY c.id, ct.id, v."visitadoEm", v."resultadoOperacional"
      ORDER BY
        situacao DESC,
        MIN(p."dataVencimento") ASC,
        ct."createdAt" ASC
    `, [hoje, hoje, hoje, inicio, fim, userId, inicio, fim, userId, hoje, userId]) as { rows: CobrancaRow[] }

    const { rows: aReceberHojeRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(p."saldoPendente"), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      WHERE p."dataVencimento" = ?
        AND p."saldoPendente" > 0
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND ct."userId" = ?
    `, [hoje, userId])

    const { rows: atrasadoRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(p."saldoPendente"), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      WHERE p."dataVencimento" < ?
        AND p."saldoPendente" > 0
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND ct."userId" = ?
    `, [hoje, userId])

    const { rows: aVencerRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(p."saldoPendente"), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      WHERE p."dataVencimento" > ? AND p."dataVencimento" <= (?::date + INTERVAL '7 days')::text
        AND p."saldoPendente" > 0
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND ct."userId" = ?
    `, [hoje, hoje, userId])

    const { rows: recebidoHojeRows } = await rawQuery<{ total: number }>(`
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM pagamentos
      WHERE data = ?
        AND "userId" = ?
    `, [hoje, userId])

    const hasGPS = typeof operadorLat === "number" && typeof operadorLng === "number"

    const cobrancas: (CobrancaRow & { distancia?: number })[] = rows.map((r) => {
      const distancia = hasGPS && r.clienteLat != null && r.clienteLng != null
        ? Math.round(haversineKm(operadorLat!, operadorLng!, r.clienteLat, r.clienteLng) * 10) / 10
        : undefined
      return { ...r, distancia }
    })

    const clientHasAtrasado = new Map<string, boolean>()
    for (const c of cobrancas) {
      if (c.situacao === "atrasado") {
        clientHasAtrasado.set(c.clienteId, true)
      }
      if (!clientHasAtrasado.has(c.clienteId)) {
        clientHasAtrasado.set(c.clienteId, false)
      }
    }

    cobrancas.sort((a, b) => {
      const aHasAtrasado = clientHasAtrasado.get(a.clienteId) ?? false
      const bHasAtrasado = clientHasAtrasado.get(b.clienteId) ?? false
      if (aHasAtrasado && !bHasAtrasado) return -1
      if (!aHasAtrasado && bHasAtrasado) return 1

      if (a.resultadoOperacional !== "PENDENTE" && b.resultadoOperacional === "PENDENTE") return 1
      if (a.resultadoOperacional === "PENDENTE" && b.resultadoOperacional !== "PENDENTE") return -1

      if (hasGPS) {
        const da = a.distancia ?? Infinity
        const db = b.distancia ?? Infinity
        if (da !== db) return da - db
      }

      if (a.clienteId === b.clienteId) {
        if (a.situacao === "atrasado" && b.situacao !== "atrasado") return -1
        if (b.situacao === "atrasado" && a.situacao !== "atrasado") return 1
      }

      return 0
    })

    const items: CobrancaItem[] = cobrancas.map((r) => ({
      clienteId: r.clienteId,
      clienteNome: r.clienteNome,
      clienteTelefone: r.clienteTelefone,
      clienteLat: r.clienteLat,
      clienteLng: r.clienteLng,
      clienteLogradouro: r.clienteLogradouro,
      clienteNumero: r.clienteNumero,
      clienteBairro: r.clienteBairro,
      clienteCidade: r.clienteCidade,
      clienteEstado: r.clienteEstado,
      contratoId: r.contratoId,
      totalPendente: r.totalPendente,
      quantidadeParcelas: r.quantidadeParcelas,
      situacao: r.situacao,
      diasEmAtraso: r.diasEmAtraso,
      resultadoOperacional: r.resultadoOperacional === null ? "PENDENTE"
        : r.resultadoOperacional === "visitado" ? "VISITADO"
        : r.resultadoOperacional === "nao_localizado" ? "NAO_ENCONTRADO"
        : r.resultadoOperacional === "promessa" ? "PROMESSA"
        : "PENDENTE",
      proximaParcela: r.proximaParcela,
      proximoNumeroParcela: r.proximoNumeroParcela,
      totalParcelasContrato: r.totalParcelasContrato,
      saldoTotal: r.saldoTotal,
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

    const { rows } = await rawQuery<PagamentoDoDiaItem>(`
      SELECT
        p.id AS "pagamentoId",
        p.valor,
        p.data,
        p."createdAt",
        cli.id AS "clienteId",
        cli.nome AS "clienteNome",
        ct.id AS "contratoId"
      FROM pagamentos p
      JOIN contratos ct ON ct.id = p."contratoId"
      JOIN clientes cli ON cli.id = ct."clienteId"
      WHERE p.data >= ? AND p.data <= ?
        AND ct."deletedAt" IS NULL
        AND cli."deletedAt" IS NULL
        AND ct."userId" = ?
      ORDER BY p."createdAt" DESC
    `, [inicio, fim, userId])

    return rows
  }

  async listarParcelasHoje(userId: string): Promise<ParcelaHojeCliente[]> {
    const hoje = getLocalDateString(new Date())

    const { rows } = await rawQuery<{
      clienteId: string
      clienteNome: string
      contratoId: string
      numero: number
      valorPrevisto: number
      saldoPendente: number
    }>(`
      SELECT
        c.id AS "clienteId",
        c.nome AS "clienteNome",
        ct.id AS "contratoId",
        p.numero,
        p."valorPrevisto",
        p."saldoPendente"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      JOIN clientes c ON c.id = ct."clienteId"
      WHERE p."dataVencimento" = ?
        AND p."saldoPendente" > 0
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND c."deletedAt" IS NULL
        AND ct."userId" = ?
      ORDER BY c.nome ASC, p.numero ASC
    `, [hoje, userId])

    const clientesMap = new Map<string, ParcelaHojeCliente>()

    for (const row of rows) {
      const key = `${row.clienteId}-${row.contratoId}`
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          clienteId: row.clienteId,
          clienteNome: row.clienteNome,
          contratoId: row.contratoId,
          parcelas: [],
        })
      }
      clientesMap.get(key)!.parcelas.push({
        numero: row.numero,
        valorPrevisto: row.valorPrevisto,
        saldoPendente: row.saldoPendente,
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
      clienteId: string
      clienteNome: string
      contratoId: string
      numero: number
      valorPrevisto: number
      saldoPendente: number
    }>(`
      SELECT
        c.id AS "clienteId",
        c.nome AS "clienteNome",
        ct.id AS "contratoId",
        p.numero,
        p."valorPrevisto",
        p."saldoPendente"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      JOIN clientes c ON c.id = ct."clienteId"
      WHERE p."dataVencimento" > ?
        AND p."dataVencimento" <= ?
        AND p."saldoPendente" > 0
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND c."deletedAt" IS NULL
        AND ct."userId" = ?
      ORDER BY c.nome ASC, p."dataVencimento" ASC, p.numero ASC
    `, [hoje, fim, userId])

    const clientesMap = new Map<string, ParcelaHojeCliente>()

    for (const row of rows) {
      const key = `${row.clienteId}-${row.contratoId}`
      if (!clientesMap.has(key)) {
        clientesMap.set(key, {
          clienteId: row.clienteId,
          clienteNome: row.clienteNome,
          contratoId: row.contratoId,
          parcelas: [],
        })
      }
      clientesMap.get(key)!.parcelas.push({
        numero: row.numero,
        valorPrevisto: row.valorPrevisto,
        saldoPendente: row.saldoPendente,
      })
    }

    return Array.from(clientesMap.values())
  }

  async registrarSnapshotAtraso(userId: string, data?: string): Promise<void> {
    const hoje = data ?? getLocalDateString(new Date())

    const { rows: atrasadoRows } = await rawQuery<{ clientesAtrasados: number; contratosAtrasados: number; valorAtrasado: number }>(`
      SELECT
        COUNT(DISTINCT ct."clienteId") AS "clientesAtrasados",
        COUNT(DISTINCT ct.id) AS "contratosAtrasados",
        COALESCE(SUM(p."saldoPendente"), 0) AS "valorAtrasado"
      FROM parcelas p
      JOIN contratos ct ON ct.id = p."contratoId"
      WHERE p."dataVencimento" < ?
        AND p."saldoPendente" > 0
        AND p."deletedAt" IS NULL
        AND ct."deletedAt" IS NULL
        AND ct."userId" = ?
    `, [hoje, userId])
    const atrasadoRow = atrasadoRows[0]

    await rawQuery(`
      INSERT INTO snapshots_atraso (id, "userId", data, "clientesAtrasados", "contratosAtrasados", "valorAtrasado", "createdAt")
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT ("userId", data) DO UPDATE SET
        "clientesAtrasados" = excluded."clientesAtrasados",
        "contratosAtrasados" = excluded."contratosAtrasados",
        "valorAtrasado" = excluded."valorAtrasado",
        "createdAt" = excluded."createdAt"
    `, [
      uuidv4(),
      userId,
      hoje,
      atrasadoRow.clientesAtrasados,
      atrasadoRow.contratosAtrasados,
      atrasadoRow.valorAtrasado,
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
        "clientesAtrasados",
        "contratosAtrasados",
        "valorAtrasado"
      FROM snapshots_atraso
      WHERE "userId" = ?
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
      INSERT INTO historico_operacional (id, "clienteId", "contratoId", "tipo", "dataPromessa", "userId", "createdAt")
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
