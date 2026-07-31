import { Router } from "express"
import { AuthController } from "../controllers/auth.controller.js"
import { AuthRepository } from "../../infrastructure/repositories/auth.repository.impl.js"
import { authMiddleware } from "../../../../shared/middleware/auth.middleware.js"

const router = Router()
const repository = new AuthRepository()
const controller = new AuthController(repository)

router.post("/login", controller.login)
router.get("/me", authMiddleware, controller.me)

export { router as authRoutes }
