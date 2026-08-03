export const MODULES = [
  { id: "clientes", labelKey: "modules.clientes", dependsOn: [] as string[] },
  { id: "contratos", labelKey: "modules.contratos", dependsOn: [] as string[] },
  { id: "caixa", labelKey: "modules.caixa", dependsOn: [] as string[] },
  { id: "gastos", labelKey: "modules.gastos", dependsOn: ["caixa"] },
  { id: "rota", labelKey: "modules.rota", dependsOn: ["contratos"] },
  { id: "cobrancas", labelKey: "modules.cobrancas", dependsOn: ["contratos"] },
  { id: "atendidos", labelKey: "modules.atendidos", dependsOn: ["contratos"] },
] as const

export type ModuleId = (typeof MODULES)[number]["id"]

export const ALL_MODULE_IDS = MODULES.map((m) => m.id) as ModuleId[]

export const DEFAULT_MODULES = [...ALL_MODULE_IDS]

/** Módulo ativo? `null`/ausente = todos ativos (fallback p/ tokens antigos e super_admin). */
export function hasModule(modulos: string[] | null | undefined, id: ModuleId): boolean {
  if (!modulos) return true
  return modulos.includes(id)
}
