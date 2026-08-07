import i18n from "../../i18n/config.js"

export function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

/** CPF (até 11 dígitos) ou CNPJ (14) — auto-detecta pela quantidade de dígitos (P11). */
export function maskCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 11) return maskCpf(digits)
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
    .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5")
}

/** Formata dígitos salvos (CPF ou CNPJ) para exibição. */
export function formatCpfCnpj(digits: string): string {
  return maskCpfCnpj(digits)
}

export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  if (!d) return ""
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function unmask(value: string): string {
  return value.replace(/\D/g, "")
}

function getLocale(): string {
  try {
    return i18n.language || "pt-BR"
  } catch {
    return "pt-BR"
  }
}

export function maskMonetario(value: string): string {
  const v = value.replace(/\D/g, "")
  if (!v) return ""
  const n = parseInt(v, 10)
  const reais = Math.floor(n / 100)
  const centavos = n % 100
  const locale = getLocale()
  return `${reais.toLocaleString(locale)},${String(centavos).padStart(2, "0")}`
}

export function formatCurrency(value: number): string {
  const locale = getLocale()
  return value.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function unmaskMonetario(value: string): number {
  const v = value.replace(/\D/g, "")
  return v ? parseInt(v, 10) / 100 : 0
}
