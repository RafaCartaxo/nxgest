import { v4 as uuidv4 } from "uuid"
import { sqlite, pagamentos } from "../../../../database.js"
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

    const rows = sqlite.prepare(`
      SELECT
        c.id AS clienteId,
        c.nome AS clienteNome,
        c.telefone AS clienteTelefone,
        COALESCE(c.comercioLat, c.lat) AS clienteLat,
        COALESCE(c.comercioLng, c.lng) AS clienteLng,
        COALESCE(c.comercioLogradouro, c.logradouro) AS clienteLogradouro,
        COALESCE(c.comercioNumero, c.numero) AS clienteNumero,
        COALESCE(c.comercioBairro, c.bairro) AS clienteBairro,
        COALESCE(c.comercioCidade, c.cidade) AS clienteCidade,
        COALESCE(c.comercioEstado, c.estado) AS clienteEstado,
        ct.id AS contratoId,
        ct.quantidadeParcelas AS totalParcelasContrato,
        SUM(p.saldoPendente) AS totalPendente,
        (SELECT COALESCE(SUM(p2.saldoPendente), 0)
         FROM parcelas p2
         WHERE p2.contratoId = ct.id
           AND p2.saldoPendente > 0
           AND p2.deletedAt IS NULL) AS saldoTotal,
        COUNT(p.id) AS quantidadeParcelas,
        CASE
          WHEN MIN(p.dataVencimento) < ? THEN 'atrasado'
          ELSE 'venceHoje'
        END AS situacao,
        v.visitadoEm,
        v.resultadoOperacional,
        COALESCE((
          SELECT p2.numero
          FROM parcelas p2
          WHERE p2.contratoId = ct.id
            AND p2.saldoPendente > 0
            AND p2.deletedAt IS NULL
          ORDER BY p2.dataVencimento ASC
          LIMIT 1
        ), 0) AS proximoNumeroParcela,
        COALESCE((
          SELECT p2.saldoPendente
          FROM parcelas p2
          WHERE p2.contratoId = ct.id
            AND p2.saldoPendente > 0
            AND p2.deletedAt IS NULL
          ORDER BY p2.dataVencimento ASC
          LIMIT 1
        ), 0) AS proximaParcela
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      JOIN clientes c ON c.id = ct.clienteId
LEFT JOIN (
  SELECT clienteId, contratoId,
    MAX(createdAt) AS visitadoEm,
    (SELECT h2.tipo FROM historico_operacional h2
     WHERE h2.clienteId = h.clienteId
       AND h2.contratoId = h.contratoId
       AND date(h2.createdAt) = ?
       AND h2.userId = ?
     ORDER BY h2.createdAt DESC LIMIT 1) AS resultadoOperacional
  FROM historico_operacional h
  WHERE date(h.createdAt) = ?
    AND h.userId = ?
  GROUP BY clienteId, contratoId
) v ON v.clienteId = c.id AND v.contratoId = ct.id
      WHERE p.saldoPendente > 0
        AND p.dataVencimento <= ?
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND ct.userId = ?
      GROUP BY c.id, ct.id
      ORDER BY
        situacao DESC,
        MIN(p.dataVencimento) ASC,
        ct.createdAt ASC
    `).all(hoje, hoje, userId, hoje, userId, hoje, userId) as CobrancaRow[]

    const aReceberHojeRow = sqlite.prepare(`
      SELECT COALESCE(SUM(p.saldoPendente), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      WHERE p.dataVencimento = ?
        AND p.saldoPendente > 0
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND ct.userId = ?
    `).get(hoje, userId) as { total: number }

    const atrasadoRow = sqlite.prepare(`
      SELECT COALESCE(SUM(p.saldoPendente), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      WHERE p.dataVencimento < ?
        AND p.saldoPendente > 0
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND ct.userId = ?
    `).get(hoje, userId) as { total: number }

    const aVencerRow = sqlite.prepare(`
      SELECT COALESCE(SUM(p.saldoPendente), 0) AS total
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      WHERE p.dataVencimento > ? AND p.dataVencimento <= DATE(?, '+7 days')
        AND p.saldoPendente > 0
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND ct.userId = ?
    `).get(hoje, hoje, userId) as { total: number }

    const recebidoHojeRow = sqlite.prepare(`
      SELECT COALESCE(SUM(valor), 0) AS total
      FROM pagamentos
      WHERE data = ?
        AND userId = ?
    `).get(hoje, userId) as { total: number }

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
        aReceberHoje: aReceberHojeRow.total,
        recebidoHoje: recebidoHojeRow.total,
        clientesParaCobrar: clientesMap.size,
        atrasado: atrasadoRow.total,
        aVencer: aVencerRow.total,
      },
      cobrancas: items,
    }
  }

  async listarPagamentosDoDia(userId: string, dataInicio?: string, dataFim?: string): Promise<PagamentoDoDiaItem[]> {
    const inicio = dataInicio ?? getLocalDateString(new Date())
    const fim = dataFim ?? inicio

    const rows = sqlite.prepare(`
      SELECT
        p.id AS pagamentoId,
        p.valor,
        p.data,
        p.createdAt,
        cli.id AS clienteId,
        cli.nome AS clienteNome,
        ct.id AS contratoId
      FROM pagamentos p
      JOIN contratos ct ON ct.id = p.contratoId
      JOIN clientes cli ON cli.id = ct.clienteId
      WHERE p.data >= ? AND p.data <= ?
        AND ct.deletedAt IS NULL
        AND cli.deletedAt IS NULL
        AND ct.userId = ?
      ORDER BY p.createdAt DESC
    `).all(inicio, fim, userId) as PagamentoDoDiaItem[]

    return rows
  }

  async listarParcelasHoje(userId: string): Promise<ParcelaHojeCliente[]> {
    const hoje = getLocalDateString(new Date())

    const rows = sqlite.prepare(`
      SELECT
        c.id AS clienteId,
        c.nome AS clienteNome,
        ct.id AS contratoId,
        p.numero,
        p.valorPrevisto,
        p.saldoPendente
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      JOIN clientes c ON c.id = ct.clienteId
      WHERE p.dataVencimento = ?
        AND p.saldoPendente > 0
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND ct.userId = ?
      ORDER BY c.nome ASC, p.numero ASC
    `).all(hoje, userId) as {
      clienteId: string
      clienteNome: string
      contratoId: string
      numero: number
      valorPrevisto: number
      saldoPendente: number
    }[]

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

    const rows = sqlite.prepare(`
      SELECT
        c.id AS clienteId,
        c.nome AS clienteNome,
        ct.id AS contratoId,
        p.numero,
        p.valorPrevisto,
        p.saldoPendente
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      JOIN clientes c ON c.id = ct.clienteId
      WHERE p.dataVencimento > ?
        AND p.dataVencimento <= ?
        AND p.saldoPendente > 0
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND c.deletedAt IS NULL
        AND ct.userId = ?
      ORDER BY c.nome ASC, p.dataVencimento ASC, p.numero ASC
    `).all(hoje, fim, userId) as {
      clienteId: string
      clienteNome: string
      contratoId: string
      numero: number
      valorPrevisto: number
      saldoPendente: number
    }[]

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

    const atrasadoRow = sqlite.prepare(`
      SELECT
        COUNT(DISTINCT ct.clienteId) AS clientesAtrasados,
        COUNT(DISTINCT ct.id) AS contratosAtrasados,
        COALESCE(SUM(p.saldoPendente), 0) AS valorAtrasado
      FROM parcelas p
      JOIN contratos ct ON ct.id = p.contratoId
      WHERE p.dataVencimento < ?
        AND p.saldoPendente > 0
        AND p.deletedAt IS NULL
        AND ct.deletedAt IS NULL
        AND ct.userId = ?
    `).get(hoje, userId) as { clientesAtrasados: number; contratosAtrasados: number; valorAtrasado: number }

    sqlite.prepare(`
      INSERT INTO snapshots_atraso (id, userId, data, clientesAtrasados, contratosAtrasados, valorAtrasado, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (userId, data) DO UPDATE SET
        clientesAtrasados = excluded.clientesAtrasados,
        contratosAtrasados = excluded.contratosAtrasados,
        valorAtrasado = excluded.valorAtrasado,
        createdAt = excluded.createdAt
    `).run(
      uuidv4(),
      userId,
      hoje,
      atrasadoRow.clientesAtrasados,
      atrasadoRow.contratosAtrasados,
      atrasadoRow.valorAtrasado,
      new Date().toISOString(),
    )
  }

  async listarHistoricoAtrasos(userId: string, dias = 30): Promise<SnapshotAtraso[]> {
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() - (dias - 1))
    const limiteStr = getLocalDateString(dataLimite)

    const rows = sqlite.prepare(`
      SELECT
        data,
        clientesAtrasados,
        contratosAtrasados,
        valorAtrasado
      FROM snapshots_atraso
      WHERE userId = ?
        AND data >= ?
      ORDER BY data DESC
      LIMIT ?
    `).all(userId, limiteStr, dias) as SnapshotAtraso[]

    return rows
  }

  async registrarVisita(userId: string, input: RegistrarVisitaInput): Promise<RegistrarVisitaOutput> {
    const id = uuidv4()
    const createdAt = new Date().toISOString()

    sqlite.prepare(`
      INSERT INTO historico_operacional (id, clienteId, contratoId, tipo, dataPromessa, userId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, input.clienteId, input.contratoId, input.tipo, input.dataPromessa ?? null, userId, createdAt)

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
