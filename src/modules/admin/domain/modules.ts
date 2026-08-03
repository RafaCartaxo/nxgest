export const ALL_MODULES = [
  "clientes",
  "contratos",
  "caixa",
  "gastos",
  "rota",
  "cobrancas",
  "atendidos",
] as const

export type ModuleId = (typeof ALL_MODULES)[number]

/** Dependências: módulo → lista de módulos obrigatórios. */
export const MODULE_DEPENDENCIES: Record<string, ModuleId[]> = {
  gastos: ["caixa"],
  rota: ["contratos"],
  cobrancas: ["contratos"],
  atendidos: ["contratos"],
}

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

export function validateModulos(input: unknown): ValidacaoModulos {
  if (!Array.isArray(input)) {
    return { ok: false, message: "modulos deve ser um array." }
  }
  if (input.some((m) => typeof m !== "string" || !ALL_MODULES.includes(m as ModuleId))) {
    return { ok: false, message: `modulos inválidos. Válidos: ${ALL_MODULES.join(", ")}` }
  }

  const value = input as string[]
  for (const moduleId of value) {
    const deps = MODULE_DEPENDENCIES[moduleId]
    if (deps && !deps.every((d) => value.includes(d))) {
      return {
        ok: false,
        message: `O módulo "${moduleId}" requer: ${deps.join(", ")}.`,
      }
    }
  }
  return { ok: true, value }
}
