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
