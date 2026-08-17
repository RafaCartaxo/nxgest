import type { Request, Response } from "express"
import { getParam } from "../../../../shared/utils/routeParam.js"
import type { IEmpresaRepository } from "../../application/ports/empresa.repository.js"
import type { IImpactoDesativacaoQuery } from "../../application/ports/impacto-desativacao.port.js"
import type { IAuditoriaModulosWriter } from "../../application/ports/auditoria-modulos.port.js"
import { ListarEmpresasUseCase } from "../../application/use-cases/ListarEmpresas/ListarEmpresasUseCase.js"
import { CriarEmpresaUseCase } from "../../application/use-cases/CriarEmpresa/CriarEmpresaUseCase.js"
import { AtualizarModulosUseCase } from "../../application/use-cases/AtualizarModulos/AtualizarModulosUseCase.js"
import { AtualizarCapacidadesUseCase } from "../../application/use-cases/AtualizarCapacidades/AtualizarCapacidadesUseCase.js"
import { CalcularImpactoUseCase } from "../../application/use-cases/CalcularImpacto/CalcularImpactoUseCase.js"
import { EmailDuplicadoError } from "../../../auth/domain/errors/auth.error.js"
import { EmpresaNaoEncontradaError } from "../../domain/errors/empresa.error.js"
import { ModulosInvalidosError, CapacidadesInvalidasError, MotivoObrigatorioError, ModuloComDadosEmAbertoError } from "../../domain/errors/modulos.error.js"
import { isValidCpf } from "../../../../shared/validators/cpf.js"
import { ConvidarUseCase } from "../../../auth/application/use-cases/Convidar/ConvidarUseCase.js"
import { ConviteRepository } from "../../../auth/infrastructure/repositories/convite.repository.impl.js"
import { criarMailer } from "../../../../shared/email/mailers.js"
import { resolverLang } from "../../../../shared/email/templates.js"
import { EmailEnvioFalhouError } from "../../../../shared/email/errors.js"
import { isValidCnpj } from "../../../../shared/validators/cnpj.js"

/**
 * Normaliza + valida o documento da empresa (P11): aceita CPF (11) OU CNPJ (14),
 * guarda em dígitos. `undefined`/vazio → null (opcional, não impede cadastro).
 */
function validarDocumento(documento: unknown): { ok: true; valor: string | null } | { ok: false } {
  if (documento === undefined || documento === null) return { ok: true, valor: null }
  if (typeof documento !== "string") return { ok: false }
  const s = documento.trim()
  if (!s) return { ok: true, valor: null }
  const digits = s.replace(/\D/g, "")
  if (!isValidCpf(digits) && !isValidCnpj(digits)) return { ok: false }
  return { ok: true, valor: digits }
}

export class EmpresaController {
  private repository: IEmpresaRepository
  private auditoria: IAuditoriaModulosWriter
  private listUseCase: ListarEmpresasUseCase
  private criarUseCase: CriarEmpresaUseCase
  private atualizarModulosUseCase: AtualizarModulosUseCase
  private atualizarCapacidadesUseCase: AtualizarCapacidadesUseCase
  private calcularImpactoUseCase: CalcularImpactoUseCase
  private convidarUseCase: ConvidarUseCase

  constructor(repository: IEmpresaRepository, impactoQuery: IImpactoDesativacaoQuery, auditoria: IAuditoriaModulosWriter) {
    this.repository = repository
    this.auditoria = auditoria
    this.listUseCase = new ListarEmpresasUseCase(repository)
    this.criarUseCase = new CriarEmpresaUseCase(repository)
    this.atualizarModulosUseCase = new AtualizarModulosUseCase(repository, impactoQuery, auditoria)
    this.atualizarCapacidadesUseCase = new AtualizarCapacidadesUseCase(repository, auditoria)
    this.calcularImpactoUseCase = new CalcularImpactoUseCase(repository, impactoQuery)
    this.convidarUseCase = new ConvidarUseCase(new ConviteRepository(), criarMailer())
  }

  list = async (_req: Request, res: Response) => {
    try {
      const empresas = await this.listUseCase.execute()
      res.json(empresas)
    } catch (err) {
      console.error("Erro ao listar empresas:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao listar empresas." })
    }
  }

  getById = async (req: Request, res: Response) => {
    try {
      const empresa = await this.repository.findById(getParam(req, "id"))
      if (!empresa) {
        res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: "Empresa não encontrada." })
        return
      }
      res.json(empresa)
    } catch (err) {
      console.error("Erro ao buscar empresa:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao buscar empresa." })
    }
  }

  create = async (req: Request, res: Response) => {
    try {
      const { nome, documento, nomeFantasia, ativa, adminNome, adminEmail } = req.body
      if (!nome || !adminNome || !adminEmail) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Nome, adminNome e adminEmail são obrigatórios." })
        return
      }
      const doc = validarDocumento(documento)
      if (!doc.ok) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Documento inválido — informe um CPF ou CNPJ válido." })
        return
      }
      const result = await this.criarUseCase.execute({
        nome,
        documento: doc.valor,
        nomeFantasia: typeof nomeFantasia === "string" && nomeFantasia.trim() ? nomeFantasia.trim() : null,
        ativa: typeof ativa === "boolean" ? ativa : true,
        adminNome,
        adminEmail,
        adminTelefone: typeof req.body.adminTelefone === "string" ? req.body.adminTelefone : undefined,
      })
      // R6 (PLAN-075): admin da nova empresa nasce convidado — o convite é o único caminho de ativação.
      await this.convidarUseCase.execute({
        subjectId: result.admin.id,
        nome: result.admin.nome,
        email: result.admin.email,
        role: "admin",
        lang: resolverLang(req.headers["accept-language"]),
        criadoPor: req.userId ?? null,
        empresaNome: nome,
      })
      res.status(201).json(result)
    } catch (err: unknown) {
      if (err instanceof EmailDuplicadoError) {
        res.status(409).json({ code: "EMAIL_DUPLICATED", message: (err as Error).message })
        return
      }
      if (err instanceof EmailEnvioFalhouError) {
        // Empresa + admin criados — o admin aparece com "Convite pendente" na lista de operadores da empresa.
        console.error("[EMAIL] Falha no envio do convite do admin:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Empresa criada, mas o convite do administrador não foi enviado (serviço de e-mail indisponível). Use 'Reenviar convite'." })
        return
      }
      console.error("Erro ao criar empresa:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao criar empresa." })
    }
  }

  update = async (req: Request, res: Response) => {
    try {
      const { nome, documento, nomeFantasia, ativa } = req.body
      const data: { nome?: string; documento?: string | null; nomeFantasia?: string | null; ativa?: boolean } = {}
      if (nome !== undefined && typeof nome === "string" && nome.trim()) data.nome = nome.trim()
      if (documento !== undefined) {
        const doc = validarDocumento(documento)
        if (!doc.ok) {
          res.status(422).json({ code: "VALIDATION_ERROR", message: "Documento inválido — informe um CPF ou CNPJ válido." })
          return
        }
        data.documento = doc.valor
      }
      if (nomeFantasia !== undefined) data.nomeFantasia = typeof nomeFantasia === "string" && nomeFantasia.trim() ? nomeFantasia.trim() : null
      if (ativa !== undefined && typeof ativa === "boolean") data.ativa = ativa

      // Auditoria da suspensão/reativação (BR-106): lê o estado ANTES, aplica e registra só se mudou.
      let antesAtiva: boolean | null = null
      if (data.ativa !== undefined) {
        const existente = await this.repository.findById(getParam(req, "id"))
        antesAtiva = existente ? existente.ativa !== false : null
      }

      const result = await this.repository.update(getParam(req, "id"), data)
      if (!result) {
        res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: "Empresa não encontrada." })
        return
      }

      if (data.ativa !== undefined && antesAtiva !== null && antesAtiva !== data.ativa) {
        await this.auditoria.registrar({
          empresaId: getParam(req, "id"),
          adminId: req.userId ?? "unknown",
          tipo: "empresa",
          antes: JSON.stringify({ ativa: antesAtiva }),
          depois: JSON.stringify({ ativa: data.ativa }),
          force: false,
          motivo: null,
        })
      }

      res.json(result)
    } catch (err) {
      console.error("Erro ao atualizar empresa:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao atualizar empresa." })
    }
  }

  updateModulos = async (req: Request, res: Response) => {
    try {
      const result = await this.atualizarModulosUseCase.execute({
        empresaId: getParam(req, "id"),
        modulos: req.body?.modulos,
        force: req.body?.force === true,
        motivo: req.body?.motivo,
        adminId: req.userId ?? "unknown",
      })
      res.json(result)
    } catch (err) {
      if (err instanceof EmpresaNaoEncontradaError) {
        res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof ModulosInvalidosError || err instanceof MotivoObrigatorioError) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: err.message })
        return
      }
      if (err instanceof ModuloComDadosEmAbertoError) {
        res.status(409).json({
          code: "MODULE_HAS_ACTIVE_DATA",
          message: err.message,
          impacto: err.impacto,
        })
        return
      }
      console.error("Erro ao atualizar módulos:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao atualizar módulos da empresa." })
    }
  }

  updateCapacidades = async (req: Request, res: Response) => {
    try {
      const result = await this.atualizarCapacidadesUseCase.execute({
        empresaId: getParam(req, "id"),
        capacidades: req.body?.capacidades,
        adminId: req.userId ?? "unknown",
      })
      res.json(result)
    } catch (err) {
      if (err instanceof EmpresaNaoEncontradaError) {
        res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof CapacidadesInvalidasError) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: err.message })
        return
      }
      console.error("Erro ao atualizar capacidades:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao atualizar capacidades da empresa." })
    }
  }

  getImpacto = async (req: Request, res: Response) => {
    const { modulos } = req.query
    if (typeof modulos !== "string") {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Query `modulos` (JSON) é obrigatória." })
      return
    }
    let parsed: unknown
    try {
      parsed = JSON.parse(modulos)
    } catch {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Query `modulos` deve ser um JSON válido." })
      return
    }
    try {
      const impacto = await this.calcularImpactoUseCase.execute({ empresaId: getParam(req, "id"), modulos: parsed })
      res.json(impacto)
    } catch (err) {
      if (err instanceof EmpresaNaoEncontradaError) {
        res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof ModulosInvalidosError) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: err.message })
        return
      }
      console.error("Erro ao calcular impacto:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao calcular impacto de desativação." })
    }
  }
}
