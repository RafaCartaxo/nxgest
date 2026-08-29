import { Router } from "express"
import { InsightsController } from "../controllers/insights.controller.js"

const router = Router()
const controller = new InsightsController()

router.get("/resumo", controller.resumo.bind(controller))

export { router as insightsRoutes }