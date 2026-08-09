/**
 * Lê uma env numérica de forma segura. `""` (compose injeta string vazia quando a
 * chave não existe no `.env`), `undefined` e `NaN` caem no fallback.
 * Sem isso, `Number(process.env.X ?? fallback)` vira 0 para `""` e, num rate limit,
 * `max: 0` BLOQUEIA todas as requisições (express-rate-limit v7/v8).
 */
export function envNumber(key: string, fallback: number): number {
  const raw = process.env[key]
  if (raw === undefined || raw === null || raw === "") return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}
