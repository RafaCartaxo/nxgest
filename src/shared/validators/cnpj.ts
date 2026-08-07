/** Validação de CNPJ (P11 — empresa aceita CPF ou CNPJ). Espelha o padrão do `cpf.ts`. */
export function isValidCnpj(value: string): boolean {
  if (!/^\d{14}$/.test(value)) return false

  const digits = value.split("").map(Number)

  if (digits.every((d) => d === digits[0])) return false

  const calc = (base: number[], pesos: number[]): number => {
    const sum = base.reduce((acc, d, i) => acc + d * pesos[i]!, 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const p1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const p2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  if (calc(digits.slice(0, 12), p1) !== digits[12]) return false
  if (calc(digits.slice(0, 13), p2) !== digits[13]) return false

  return true
}
