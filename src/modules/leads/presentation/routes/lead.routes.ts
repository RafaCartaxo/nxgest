import { Router } from "express"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import { LeadController } from "../controllers/lead.controller.js"

const router = Router()
const controller = new LeadController()

const criarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

const confirmarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

const reenviarLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip ?? "")}-${String((req.body as { email?: string })?.email ?? "").toLowerCase()}`,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

// Públicas (sem auth) — criação e confirmação de lead (PLAN-064).
router.post("/", criarLimiter, controller.criar)
router.post("/confirmar", confirmarLimiter, controller.confirmar)
router.post("/reconfirmar", reenviarLimiter, controller.reenviar)

export { router as leadPublicRoutes }
