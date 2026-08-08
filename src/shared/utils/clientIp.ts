import type { IncomingHttpHeaders } from "node:http"

/**
 * IP real do cliente por trás de proxies (PLAN-068 coordenação com PLAN-066).
 * Com Cloudflare na frente (→ Caddy → app), `req.ip` (trust proxy:1) vira o IP do
 * Cloudflare — o header `CF-Connecting-IP` é o IP real do cliente. Sem ele, cai no
 * `req.ip` (dev/sem Cloudflare). Usado nos rate limiters.
 */
export function clientIp(req: { headers: IncomingHttpHeaders; ip?: string }): string {
  const cf = req.headers["cf-connecting-ip"]
  if (typeof cf === "string" && cf.trim()) return cf.trim()
  return req.ip ?? ""
}
