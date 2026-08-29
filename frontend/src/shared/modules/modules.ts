import { Users, FileText, Wallet, Receipt, MapPinned, ClipboardList, CheckCircle2, LineChart } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const MODULES = [
  { id: "clientes", labelKey: "modules.clientes", descricaoKey: "modules.clientes.descricao", dependsOn: [] as string[], icon: Users },
  { id: "contratos", labelKey: "modules.contratos", descricaoKey: "modules.contratos.descricao", dependsOn: ["clientes"] as string[], icon: FileText },
  { id: "caixa", labelKey: "modules.caixa", descricaoKey: "modules.caixa.descricao", dependsOn: [] as string[], icon: Wallet },
  { id: "gastos", labelKey: "modules.gastos", descricaoKey: "modules.gastos.descricao", dependsOn: ["caixa"] as string[], icon: Receipt },
  { id: "rota", labelKey: "modules.rota", descricaoKey: "modules.rota.descricao", dependsOn: ["cobrancas"] as string[], icon: MapPinned },
  { id: "cobrancas", labelKey: "modules.cobrancas", descricaoKey: "modules.cobrancas.descricao", dependsOn: ["contratos"] as string[], icon: ClipboardList },
  { id: "atendidos", labelKey: "modules.atendidos", descricaoKey: "modules.atendidos.descricao", dependsOn: ["cobrancas"] as string[], icon: CheckCircle2 },
  { id: "insights", labelKey: "modules.insights", descricaoKey: "modules.insights.descricao", dependsOn: [] as string[], icon: LineChart },
] as const

export type ModuleId = (typeof MODULES)[number]["id"]

export const ALL_MODULE_IDS = MODULES.map((m) => m.id) as ModuleId[]

export const DEFAULT_MODULES = [...ALL_MODULE_IDS]

/** Ícone canônico por módulo (whitelabel). */
export function moduleIcon(id: ModuleId): LucideIcon {
  return MODULES.find((m) => m.id === id)?.icon ?? Users
}

/** Módulo ativo? `null`/ausente = todos ativos (fallback p/ tokens antigos e super_admin). */
export function hasModule(modulos: string[] | null | undefined, id: ModuleId): boolean {
  if (!modulos) return true
  return modulos.includes(id)
}

/**
 * Registro de widgets da Central (PLAN-045) — cada widget tem UM módulo DONO.
 * A Central compõe dinamicamente os widgets dos módulos ativos (fim do gating
 * manual por `hasModule` em cada KPI/ação).
 */
export const MODULE_WIDGETS: Record<ModuleId, string[]> = {
  clientes: ["novoCliente"],
  contratos: ["aReceberHoje", "recebidoHoje", "resultadoDia", "atrasado", "aVencer"],
  caixa: ["fecharCaixa"],
  gastos: ["gastosHoje"],
  rota: ["minhaRota"],
  cobrancas: ["pendentesDia", "clientesPendentes", "receber"],
  atendidos: ["atendidosHoje"],
  insights: [],
}

/** Widget ativo? verdadeiro se o módulo DONO está ativo (ou modulos ausente = todos). */
export function isWidgetActive(modulos: string[] | null | undefined, widget: string): boolean {
  if (!modulos) return true
  return Object.entries(MODULE_WIDGETS).some(([mod, widgets]) => widgets.includes(widget) && modulos.includes(mod))
}

/** Fecha o grafo: adiciona dependências (direta/indireta) ausentes do conjunto (Fix C, PLAN-061). */
export function completarDependencias(modulos: string[]): string[] {
  const set = new Set(modulos)
  let mudou = true
  while (mudou) {
    mudou = false
    for (const m of [...set]) {
      const def = MODULES.find((x) => x.id === m)
      if (!def) continue
      for (const d of def.dependsOn) {
        if (!set.has(d)) {
          set.add(d)
          mudou = true
        }
      }
    }
  }
  return [...set]
}
