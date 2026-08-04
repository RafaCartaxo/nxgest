import "dotenv/config"
import express from "express"
import cors from "cors"
import path from "path"
import { fileURLToPath } from "url"
import { createTables } from "./database.js"
import { healthRoutes } from "./modules/health/presentation/routes/health.routes.js"
import { authRoutes } from "./modules/auth/presentation/routes/auth.routes.js"
import { authMiddleware } from "./shared/middleware/auth.middleware.js"
import { requireModule } from "./shared/middleware/module.middleware.js"
import { adminRoutes } from "./modules/admin/presentation/routes/admin.routes.js"
import { clienteRoutes } from "./modules/cliente/presentation/routes/cliente.routes.js"
import { contratoRoutes } from "./modules/contrato/presentation/routes/contrato.routes.js"
import { pagamentoRoutes } from "./modules/pagamento/presentation/routes/pagamento.routes.js"
import { operacoesRoutes } from "./modules/operacoes/presentation/routes/operacoes.routes.js"
import { caixaRoutes } from "./modules/caixa/presentation/routes/caixa.routes.js"
import { empresaRoutes } from "./modules/admin/presentation/routes/empresa.routes.js"
import { gastoRoutes } from "./modules/gasto/presentation/routes/gasto.routes.js"

await createTables()

const app = express()

const corsOrigin = process.env.CORS_ORIGIN
app.use(cors(corsOrigin ? { origin: corsOrigin } : {}))

app.use(express.json())

app.use("/api/health", healthRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/admin", authMiddleware, adminRoutes)
app.use("/api/admin/empresas", authMiddleware, empresaRoutes)

app.use("/api/clientes", authMiddleware, requireModule("clientes"), clienteRoutes)
app.use("/api/contratos", authMiddleware, requireModule("contratos"), contratoRoutes)
app.use("/api/pagamentos", authMiddleware, requireModule("contratos"), pagamentoRoutes)
app.use("/api/operacoes", authMiddleware, operacoesRoutes)
app.use("/api/caixa", authMiddleware, requireModule("caixa"), caixaRoutes)
app.use("/api/gastos", authMiddleware, requireModule("gastos"), gastoRoutes)

if (process.env.NODE_ENV === "production") {
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const frontendDist = path.resolve(__dirname, "../frontend/dist")
  app.use(express.static(frontendDist))
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"))
  })
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Erro não tratado:", err)
  res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
})

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`)
})
