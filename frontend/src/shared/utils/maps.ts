import { buildMapsUrl as buildMapsUrlCanonico, alvoDeItemCobranca } from "../geo/alvo.js"
import type { TargetNavegacao } from "../geo/types.js"

/**
 * SHIM de compatibilidade (PLAN-055) — aceita tanto o alvo canônico (`TargetNavegacao`)
 * quanto o shape legado `cliente*` (CobrancaItem/ClienteDetail). Migrar consumidores
 * para `shared/geo` e remover este arquivo depois.
 */
export function buildMapsUrl(item: TargetNavegacao | { clienteLat: number | null; clienteLng: number | null; clienteLogradouro: string; clienteNumero: string | null; clienteBairro: string | null; clienteCidade: string | null; clienteEstado: string | null }): string | null {
  if ("lat" in item) {
    return buildMapsUrlCanonico(item)
  }
  return buildMapsUrlCanonico(alvoDeItemCobranca(item))
}
