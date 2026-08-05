/** Registro canônico de módulos do whitelabel (fonte única — PLAN-031/045). */

export type ModuleId = "clientes" | "contratos" | "caixa" | "gastos" | "rota" | "cobrancas" | "atendidos"

export interface ModuleManifestEntry {
  labelKey: string
  /** Rotas/superfícies do frontend que o módulo expõe. */
  surfaces: string[]
  /** Endpoints protegidos por `requireModule` quando o módulo está off. */
  dados: string[]
  /** Chaves de widgets da Central que este módulo é DONO (composição dinâmica). */
  widgets: string[]
  /** Capacidades que este módulo habilita em outros módulos (ex.: contratos habilita pagamento). */
  capacidades: string[]
  dependsOn: ModuleId[]
  /** UCs/API-UCs de validação relacionadas (ver docs/product/08-UC-MODULOS.md). */
  ucs: string[]
}

export const MODULE_MANIFEST: Record<string, ModuleManifestEntry> = {
  clientes: {
    labelKey: "modules.clientes",
    surfaces: ["/clientes", "/clientes/novo", "/clientes/:id", "/clientes/:id/editar"],
    dados: ["/api/clientes"],
    widgets: ["novoCliente"],
    capacidades: ["contratos:cliente"],
    dependsOn: [],
    ucs: ["UC-015", "UC-017", "UC-047", "UC-048", "UC-071", "API-UC-004..008"],
  },
  contratos: {
    labelKey: "modules.contratos",
    surfaces: ["/contratos", "/contratos/novo", "/contratos/:id", "/contratos/:id/editar"],
    dados: ["/api/contratos", "/api/pagamentos"],
    widgets: ["aReceberHoje", "recebidoHoje", "resultadoDia", "atrasado", "aVencer"],
    capacidades: ["pagamento", "parcelas"],
    dependsOn: ["clientes"],
    ucs: ["UC-006", "UC-007", "UC-008", "UC-016", "UC-017", "UC-022", "UC-029", "UC-030", "UC-033", "UC-035", "UC-049", "UC-050", "UC-072", "API-UC-009..017"],
  },
  caixa: {
    labelKey: "modules.caixa",
    surfaces: ["/caixa"],
    dados: ["/api/caixa"],
    widgets: ["fecharCaixa"],
    capacidades: ["gastos:caixa"],
    dependsOn: [],
    ucs: ["UC-012", "UC-013", "UC-014", "UC-025", "UC-026", "API-UC-024..028"],
  },
  gastos: {
    labelKey: "modules.gastos",
    surfaces: ["/gastos"],
    dados: ["/api/gastos"],
    widgets: ["gastosHoje"],
    capacidades: [],
    dependsOn: ["caixa"],
    ucs: ["UC-011", "UC-051", "API-UC-029..031"],
  },
  rota: {
    labelKey: "modules.rota",
    surfaces: ["/rota"],
    dados: ["/api/operacoes/visitas"],
    widgets: ["minhaRota"],
    capacidades: ["atendidos:visitas"],
    dependsOn: ["cobrancas"],
    ucs: ["UC-002", "UC-003", "UC-004", "UC-005", "UC-018", "UC-019", "UC-037", "API-UC-023"],
  },
  cobrancas: {
    labelKey: "modules.cobrancas",
    surfaces: ["/cobrancas"],
    dados: ["/api/operacoes/historico-atrasos"],
    widgets: ["pendentesDia", "clientesPendentes", "receber"],
    capacidades: ["rota:rota", "atendidos:atendidos"],
    dependsOn: ["contratos"],
    ucs: ["UC-009", "UC-020", "UC-038", "API-UC-018", "API-UC-022"],
  },
  atendidos: {
    labelKey: "modules.atendidos",
    surfaces: ["/atendidos"],
    dados: [],
    widgets: ["atendidosHoje"],
    capacidades: [],
    dependsOn: ["cobrancas"],
    ucs: ["UC-010", "UC-021", "UC-036", "UC-070"],
  },
}

export const ALL_MODULES = Object.keys(MODULE_MANIFEST) as ModuleId[]

/** Dependências derivadas do manifest (fonte única do grafo). */
export const MODULE_DEPENDENCIES = Object.fromEntries(
  Object.entries(MODULE_MANIFEST).map(([id, m]) => [id, m.dependsOn])
) as Record<string, ModuleId[]>

export const DEFAULT_MODULOS: string[] = [...ALL_MODULES]

export function parseModulos(raw: string | null | undefined): string[] | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.every((m) => typeof m === "string")) return parsed
    return null
  } catch {
    return null
  }
}

export function serializeModulos(modulos: string[]): string {
  return JSON.stringify(modulos)
}

export type ValidacaoModulos = { ok: true; value: string[] } | { ok: false; message: string }

/** Dependências transitivas (incl. indiretas) ausentes do conjunto. */
function dependenciasFaltantes(moduleId: ModuleId, inSet: Set<string>): string[] {
  const faltantes: string[] = []
  const visitados = new Set<string>()
  function walk(id: string): void {
    if (visitados.has(id)) return
    visitados.add(id)
    for (const dep of MODULE_DEPENDENCIES[id] ?? []) {
      if (!inSet.has(dep) && !faltantes.includes(dep)) faltantes.push(dep)
      walk(dep)
    }
  }
  walk(moduleId)
  return faltantes
}

export function validateModulos(input: unknown): ValidacaoModulos {
  if (!Array.isArray(input)) {
    return { ok: false, message: "modulos deve ser um array." }
  }
  if (input.some((m) => typeof m !== "string" || !ALL_MODULES.includes(m as ModuleId))) {
    return { ok: false, message: `modulos inválidos. Válidos: ${ALL_MODULES.join(", ")}` }
  }

  const value = input as string[]
  const inSet = new Set(value)
  for (const moduleId of value) {
    const faltantes = dependenciasFaltantes(moduleId as ModuleId, inSet)
    if (faltantes.length > 0) {
      return {
        ok: false,
        message: `O módulo "${moduleId}" requer: ${faltantes.join(", ")}.`,
      }
    }
  }
  return { ok: true, value }
}
