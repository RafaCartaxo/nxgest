export function parseDateLocal(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Range `[inicio, fim)` do dia (date-only) convertido para instantes UTC ISO,
 * usando as fronteiras do **relógio local do servidor**.
 *
 * Replica o comportamento do SQLite `date(col, 'localtime') = ?` (G3 — PLAN-070):
 * `new Date("YYYY-MM-DDT00:00:00")` (sem Z) é parseado como hora local; `.toISOString()`
 * devolve o instante UTC correspondente — correta em qualquer TZ (o VPS é EDT/-0400).
 */
export function rangeDoDiaLocal(dateStr: string): { inicio: string; fim: string } {
  const inicio = new Date(`${dateStr}T00:00:00`)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 1)
  return { inicio: inicio.toISOString(), fim: fim.toISOString() }
}
