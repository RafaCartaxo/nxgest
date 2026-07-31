import { Router } from "express"
import { AuthController } from "../controllers/auth.controller.js"
import { AuthRepository } from "../../infrastructure/repositories/auth.repository.impl.js"
import { authMiddleware } from "../../../../shared/middleware/auth.middleware.js"
import rateLimit from "express-rate-limit"

const router = Router()
const repository = new AuthRepository()
const controller = new AuthController(repository)

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: "RATE_LIMIT", message: "Muitas tentativas. Tente novamente em 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
})

router.post("/login", loginLimiter, controller.login)
router.get("/me", authMiddleware, controller.me)

export { router as authRoutes }
