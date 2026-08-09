import { Router } from "express"
import { AuthController } from "../controllers/auth.controller.js"
import { AuthRepository } from "../../infrastructure/repositories/auth.repository.impl.js"
import { authMiddleware } from "../../../../shared/middleware/auth.middleware.js"
import rateLimit, { ipKeyGenerator } from "express-rate-limit"
import { clientIp } from "../../../../shared/utils/clientIp.js"
import { envNumber } from "../../../../shared/utils/env.js"

const router = Router()
const repository = new AuthRepository()
const controller = new AuthController(repository)

// IP real do cliente atrás de Cloudflare→Caddy (CF-Connecting-IP) — PLAN-068/066.
const ipDe = (req: Parameters<typeof clientIp>[0]) => ipKeyGenerator(clientIp(req))

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: envNumber("LOGIN_RATE_LIMIT_MAX", 10),
  keyGenerator: ipDe,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
})

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  // PLAN-065: limite por e-mail + IP (não só por IP). ipKeyGenerator normaliza IPv6 (IPv6 não burla).
  keyGenerator: (req) => `${ipDe(req)}-${String((req.body as { email?: string })?.email ?? "").toLowerCase()}`,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

const publicoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
})

router.post("/login", loginLimiter, controller.login)
router.post("/ativar", publicoLimiter, controller.ativar)
router.post("/forgot", forgotLimiter, controller.forgot)
router.post("/reset", publicoLimiter, controller.reset)
router.get("/me", authMiddleware, controller.me)
router.patch("/senha", authMiddleware, controller.alterarSenha)
router.patch("/foto", authMiddleware, controller.alterarFoto)

export { router as authRoutes }
