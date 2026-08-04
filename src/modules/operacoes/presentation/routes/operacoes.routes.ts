import { Router } from "express"
import { requireModule } from "../../../../shared/middleware/module.middleware.js"
import { OperacoesController } from "../controllers/operacoes.controller.js"
import { ListarCobrancasDoDiaUseCase } from "../../application/use-cases/ListarCobrancasDoDia/ListarCobrancasDoDiaUseCase.js"
import { ListarPagamentosDoDiaUseCase } from "../../application/use-cases/ListarPagamentosDoDia/ListarPagamentosDoDiaUseCase.js"
import { ListarParcelasHojeUseCase } from "../../application/use-cases/ListarParcelasHoje/ListarParcelasHojeUseCase.js"
import { ListarParcelasSemanaUseCase } from "../../application/use-cases/ListarParcelasSemana/ListarParcelasSemanaUseCase.js"
import { RegistrarVisitaUseCase } from "../../application/use-cases/RegistrarVisita/RegistrarVisitaUseCase.js"
import { ListarHistoricoAtrasosUseCase } from "../../application/use-cases/ListarHistoricoAtrasos/ListarHistoricoAtrasosUseCase.js"
import { OperacoesRepository } from "../../infrastructure/repositories/operacoes.repository.impl.js"

const router = Router()
const repo = new OperacoesRepository()
const listarCobrancas = new ListarCobrancasDoDiaUseCase(repo)
const listarPagamentosDoDia = new ListarPagamentosDoDiaUseCase(repo)
const listarParcelasHoje = new ListarParcelasHojeUseCase(repo)
const listarParcelasSemana = new ListarParcelasSemanaUseCase(repo)
const registrarVisita = new RegistrarVisitaUseCase(repo)
const listarHistoricoAtrasos = new ListarHistoricoAtrasosUseCase(repo)
const controller = new OperacoesController(listarCobrancas, listarPagamentosDoDia, listarParcelasHoje, listarParcelasSemana, registrarVisita, listarHistoricoAtrasos)

router.get("/cobrancas", controller.cobrancas.bind(controller))
router.get("/pagamentos-hoje", controller.pagamentosHoje.bind(controller))
router.get("/parcelas-hoje", controller.parcelasHoje.bind(controller))
router.get("/parcelas-semana", controller.parcelasSemana.bind(controller))
router.get("/historico-atrasos", requireModule("cobrancas"), controller.historicoAtrasos.bind(controller))
router.post("/visitas", requireModule("rota"), controller.visitas.bind(controller))

export { router as operacoesRoutes }
