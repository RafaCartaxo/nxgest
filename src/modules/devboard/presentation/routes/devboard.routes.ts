import { Router } from "express"
import { DevboardController } from "../controllers/devboard.controller.js"
import { GithubGateway } from "../../infrastructure/gateways/github-gateway.impl.js"

const router = Router()
const controller = new DevboardController(new GithubGateway())

router.get("/runs", controller.runs)
router.get("/prs", controller.prs)
router.get("/dependabot", controller.dependabot)

export { router as devboardRoutes }
