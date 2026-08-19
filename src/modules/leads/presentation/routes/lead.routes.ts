import { Router } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import { LeadController } from "../controllers/lead.controller.js"
import { clientIp } from "../../../../shared/utils/clientIp.js"
import { envNumber } from "../../../../shared/utils/env.js"

const router = Router()
const controller = new LeadController()

// IP real do cliente atrás de Cloudflare→Caddy (CF-Connecting-IP) — PLAN-068/066.
const ipDe = (req: Parameters<typeof clientIp>[0]) => ipKeyGenerator(clientIp(req))

const criarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envNumber("LEADS_RATE_LIMIT_MAX", 10),
  keyGenerator: ipDe,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

const confirmarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envNumber("LEADS_RATE_LIMIT_MAX", 10),
  keyGenerator: ipDe,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

const reenviarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envNumber("LEADS_RATE_LIMIT_MAX", 3),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipDe(req)}-${String((req.body as { email?: string })?.email ?? "").toLowerCase()}`,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

// Públicas (sem auth) — criação e confirmação de lead (PLAN-064).
router.post("/", criarLimiter, controller.criar)
router.post("/confirmar", confirmarLimiter, controller.confirmar)
router.post("/reconfirmar", reenviarLimiter, controller.reenviar)

export { router as leadPublicRoutes }
