import { MessageCircle, Phone, Navigation, Paperclip, FileText } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ModuleId } from "./modules.js"

/** Capacidade = recurso fino de um módulo, ativável/desativável por empresa (whitelabel). */
export const CAPABILITIES = [
  { id: "cliente:whatsapp", labelKey: "capacidades.cliente.whatsapp", moduleOwner: "clientes" as ModuleId, icon: MessageCircle },
  { id: "cliente:ligar", labelKey: "capacidades.cliente.ligar", moduleOwner: "clientes" as ModuleId, icon: Phone },
  { id: "cliente:navegar", labelKey: "capacidades.cliente.navegar", moduleOwner: "clientes" as ModuleId, icon: Navigation },
  { id: "cliente:anexos", labelKey: "capacidades.cliente.anexos", moduleOwner: "clientes" as ModuleId, icon: Paperclip },
  { id: "rota:whatsapp", labelKey: "capacidades.rota.whatsapp", moduleOwner: "rota" as ModuleId, icon: MessageCircle },
  { id: "rota:ligar", labelKey: "capacidades.rota.ligar", moduleOwner: "rota" as ModuleId, icon: Phone },
  { id: "rota:navegar", labelKey: "capacidades.rota.navegar", moduleOwner: "rota" as ModuleId, icon: Navigation },
  { id: "pagamento:comprovante_whatsapp", labelKey: "capacidades.pagamento.comprovanteWhatsapp", moduleOwner: "contratos" as ModuleId, icon: FileText },
] as const

export type CapabilityId = (typeof CAPABILITIES)[number]["id"]

export const ALL_CAPABILITIES = CAPABILITIES.map((c) => c.id) as CapabilityId[]

export function capabilityIcon(id: CapabilityId): LucideIcon {
  return CAPABILITIES.find((c) => c.id === id)?.icon ?? FileText
}

/**
 * Capacidade ativa para a empresa do usuário?
 * - `modulos` null/ausente = todos ativos (dono sempre ativo);
 * - dono off ⇒ capacidade inativa (mesmo que esteja na lista);
 * - `capacidades` null/ausente = todas ativas; `[]` = nenhuma.
 */
export function hasCapability(
  capacidades: string[] | null | undefined,
  modulos: string[] | null | undefined,
  id: CapabilityId
): boolean {
  const owner = CAPABILITIES.find((c) => c.id === id)?.moduleOwner
  if (!owner) return false
  if (modulos && !modulos.includes(owner)) return false
  if (!capacidades) return true
  return capacidades.includes(id)
}

/**
 * Capacidades APLICÁVEIS ao salvar (Fix D, PLAN-061): remove as que têm o módulo
 * dono desativado — elas ficam inativas por definição e o backend as rejeita (422).
 */
export function capacidadesAplicaveis(capacidades: string[], modulos: string[] | null | undefined): string[] {
  if (!modulos) return capacidades
  return capacidades.filter((id) => {
    const owner = CAPABILITIES.find((c) => c.id === id)?.moduleOwner
    return owner === undefined || modulos.includes(owner)
  })
}
