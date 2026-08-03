import { ResultadoOperacional, type CobrancaItem, type PagamentoDoDiaItem } from "../services/operacoes.service.js"

/**
 * Total de CLIENTES DISTINTOS atendidos hoje.
 *
 * União de:
 * - itens de cobrança com resultado != PENDENTE (visitado / não encontrado / promessa);
 * - clientes com pagamento registrado hoje.
 *
 * Cliente atendido E pago no mesmo dia conta UMA vez. Cliente com vários
 * contratos conta UMA vez (a rota opera por contrato, mas o total de atendidos
 * é por cliente).
 */
export function totalClientesAtendidos(
  itens: CobrancaItem[],
  pagamentosHoje: PagamentoDoDiaItem[]
): number {
  const set = new Set<string>()
  for (const i of itens) {
    if (i.resultadoOperacional !== ResultadoOperacional.PENDENTE) {
      set.add(i.clienteId)
    }
  }
  for (const p of pagamentosHoje) {
    set.add(p.clienteId)
  }
  return set.size
}

export interface ResumoAtendidos {
  /** Clientes distintos atendidos (guarda-chuva: visitado + não encontrado + promessa + pagos). */
  total: number
  visitado: number
  naoEncontrado: number
  promessa: number
  pagos: number
}

/**
 * Resumo de ATENDIDOS por subtipo (clientes distintos):
 * "Atendido" é o guarda-chuva (qualquer visita registrada + pagamentos);
 * "Visitado" é APENAS o subtipo `VISITADO` — não encontrado e promessa geram
 * visita/atendido, mas NÃO são "visitados".
 */
export function resumoAtendidos(
  itens: CobrancaItem[],
  pagamentosHoje: PagamentoDoDiaItem[]
): ResumoAtendidos {
  const atendidos = new Set<string>()
  const visitado = new Set<string>()
  const naoEncontrado = new Set<string>()
  const promessa = new Set<string>()

  for (const i of itens) {
    if (i.resultadoOperacional === ResultadoOperacional.PENDENTE) continue
    atendidos.add(i.clienteId)
    if (i.resultadoOperacional === ResultadoOperacional.VISITADO) visitado.add(i.clienteId)
    else if (i.resultadoOperacional === ResultadoOperacional.NAO_ENCONTRADO) naoEncontrado.add(i.clienteId)
    else if (i.resultadoOperacional === ResultadoOperacional.PROMESSA) promessa.add(i.clienteId)
  }

  const pagos = new Set<string>()
  for (const p of pagamentosHoje) pagos.add(p.clienteId)
  for (const c of pagos) atendidos.add(c)

  return {
    total: atendidos.size,
    visitado: visitado.size,
    naoEncontrado: naoEncontrado.size,
    promessa: promessa.size,
    pagos: pagos.size,
  }
}
