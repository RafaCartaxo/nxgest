import type { TargetNavegacao } from "./types.js"

/** Formata coordenadas para exibição curta (ex.: "-23.55050, -46.63330"). */
export function formatarCoords(c: { lat: number; lng: number }): string {
  return `${c.lat.toFixed(5)}, ${c.lng.toFixed(5)}`
}

/**
 * Gera a URL de navegação (Google Maps "Directions") para um alvo.
 * Prioridade: coordenadas (precisão) → texto do endereço (fallback, mínimo 2 partes).
 * Retorna `null` quando não há alvo utilizável (o botão "Navegar" não aparece).
 */
export function buildMapsUrl(item: TargetNavegacao): string | null {
  if (item.lat && item.lng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`
  }

  const parts = [
    item.logradouro,
    item.numero,
    item.bairro,
    item.cidade,
    item.estado,
  ].filter((p): p is string => !!p)

  if (parts.length >= 2) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(parts.join(", "))}`
  }

  return null
}
