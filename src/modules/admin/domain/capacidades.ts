/**
 * Registro canônico de CAPACIDADES (recursos finos do whitelabel).
 *
 * Capacidade = recurso individual dentro de um módulo, ativável/desativável por
 * empresa (`empresas.capacidades`). `null`/ausente = todas ativas (mesma
 * convenção de `empresas.modulos`); `[]` = nenhuma capacidade.
 *
 * Cada capacidade tem UM módulo DONO (`moduleOwner`): módulo desativado torna a
 * capacidade implicitamente INATIVA (o PATCH valida dono ativo no momento da
 * mudança; donos desligados depois ficam inertes e voltam quando reativados).
 *
 * Espelhado no frontend: `frontend/src/shared/modules/capacidades.ts`.
 */
import type { ModuleId } from "./modules.js"

export type CapabilityId =
  | "cliente:whatsapp"
  | "cliente:ligar"
  | "cliente:navegar"
  | "cliente:anexos"
  | "rota:whatsapp"
  | "rota:ligar"
  | "rota:navegar"
  | "pagamento:comprovante_whatsapp"

export interface CapabilityManifestEntry {
  labelKey: string
  /** Módulo que precisa estar ativo para a capacidade valer. */
  moduleOwner: ModuleId
  /** Superfícies do frontend onde a capacidade se aplica (documentação). */
  surfaces: string[]
  /** Endpoints protegidos por `requireCapability` quando a capacidade está off. */
  endpoints: string[]
}

export const CAPABILITY_MANIFEST: Record<CapabilityId, CapabilityManifestEntry> = {
  "cliente:whatsapp": {
    labelKey: "capacidades.cliente.whatsapp",
    moduleOwner: "clientes",
    surfaces: ["ClienteDetail (ação WhatsApp)"],
    endpoints: [],
  },
  "cliente:ligar": {
    labelKey: "capacidades.cliente.ligar",
    moduleOwner: "clientes",
    surfaces: ["ClienteDetail (ação Ligar)"],
    endpoints: [],
  },
  "cliente:navegar": {
    labelKey: "capacidades.cliente.navegar",
    moduleOwner: "clientes",
    surfaces: ["ClienteDetail (ação Navegar)"],
    endpoints: [],
  },
  "cliente:anexos": {
    labelKey: "capacidades.cliente.anexos",
    moduleOwner: "clientes",
    surfaces: ["ClienteDetail (seção Anexos)"],
    endpoints: ["/api/clientes/:id/anexos"],
  },
  "rota:whatsapp": {
    labelKey: "capacidades.rota.whatsapp",
    moduleOwner: "rota",
    surfaces: ["RotaPage (ação WhatsApp)"],
    endpoints: [],
  },
  "rota:ligar": {
    labelKey: "capacidades.rota.ligar",
    moduleOwner: "rota",
    surfaces: ["RotaPage (ação Ligar)"],
    endpoints: [],
  },
  "rota:navegar": {
    labelKey: "capacidades.rota.navegar",
    moduleOwner: "rota",
    surfaces: ["RotaPage (ação Navegar)"],
    endpoints: [],
  },
  "pagamento:comprovante_whatsapp": {
    labelKey: "capacidades.pagamento.comprovanteWhatsapp",
    moduleOwner: "contratos",
    surfaces: ["RotaPage/ContratoDetail (comprovante via WhatsApp)"],
    endpoints: [],
  },
}

export const ALL_CAPABILITIES = Object.keys(CAPABILITY_MANIFEST) as CapabilityId[]

export function parseCapacidades(raw: string | null | undefined): string[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((c) => typeof c === "string")) return parsed as string[]
    return null
  } catch {
    return null
  }
}

export function serializeCapacidades(capacidades: string[]): string {
  return JSON.stringify(capacidades)
}

export type ValidacaoCapacidades = { ok: true; value: string[] } | { ok: false; message: string }

/** Valida o array de capacidades: ids existem; duplicadas são normalizadas. */
export function validateCapacidades(input: unknown): ValidacaoCapacidades {
  if (!Array.isArray(input)) {
    return { ok: false, message: "capacidades deve ser um array." }
  }
  if (input.some((c) => typeof c !== "string" || !ALL_CAPABILITIES.includes(c as CapabilityId))) {
    return { ok: false, message: `capacidades inválidas. Válidas: ${ALL_CAPABILITIES.join(", ")}` }
  }
  const value = Array.from(new Set(input as string[]))
  return { ok: true, value }
}

/** Capacidades cujo módulo dono está desativado (ficam inativas). */
export function capacidadesComDonoDesativado(value: string[], modulos: string[] | null): string[] {
  if (modulos === null) return []
  return value.filter((c) => {
    const owner = CAPABILITY_MANIFEST[c as CapabilityId]?.moduleOwner
    return owner !== undefined && !modulos.includes(owner)
  })
}

/**
 * Capacidade ativa para o usuário/empresa?
 * - `modulos` null/ausente = todos ativos (dono sempre ativo);
 * - dono off ⇒ capacidade inativa (mesmo que esteja na lista);
 * - `capacidades` null/ausente = todas ativas; `[]` = nenhuma.
 */
export function hasCapability(
  capacidades: string[] | null | undefined,
  modulos: string[] | null | undefined,
  capabilityId: CapabilityId
): boolean {
  const owner = CAPABILITY_MANIFEST[capabilityId]?.moduleOwner
  if (!owner) return false
  if (modulos !== null && modulos !== undefined && !modulos.includes(owner)) return false
  if (capacidades === null || capacidades === undefined) return true
  return capacidades.includes(capabilityId)
}
