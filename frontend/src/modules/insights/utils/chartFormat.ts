import { formatCurrency } from "../../../shared/utils/masks.js"

/** Rótulo do eixo X a partir de `AAAA-MM-DD` → `DD/MM`. */
export function formatDataEixo(data: string): string {
  const [, m, d] = data.split("-")
  return `${d}/${m}`
}

/** Rótulo do eixo Y compacto (R$ 1,2 mil / R$ 800). */
export function formatValorEixo(valor: number): string {
  if (Math.abs(valor) >= 1000) {
    const mil = valor / 1000
    return `R$ ${mil.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`
  }
  return `R$ ${formatCurrency(valor)}`
}