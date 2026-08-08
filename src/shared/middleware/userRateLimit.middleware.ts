import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import { clientIp } from "../utils/clientIp.js"

/**
 * Rate limit por usuário em rotas autenticadas (PLAN-066 · CT D-03).
 * Chave = `userId` quando autenticado (via authMiddleware ANTES deste), senão IP real
 * (CF-Connecting-IP → req.ip). Protege abuso/carga sem afetar o usuário normal.
 */
export const userRateLimit = rateLimit({
  windowMs: 60_000,
  max: Number(process.env.USER_RATE_LIMIT_MAX ?? 600),
  keyGenerator: (req) => `u:${req.userId ?? ipKeyGenerator(clientIp(req))}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Muitas requisições. Tente novamente em instantes." },
})
