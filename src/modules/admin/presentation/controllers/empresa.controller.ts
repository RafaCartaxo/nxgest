import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
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

  constructor(repository: IEmpresaRepository, impactoQuery: IImpactoDesativacaoQuery, auditoria: IAuditoriaModulosWriter) {
    this.repository = repository
    this.auditoria = auditoria
    this.listUseCase = new ListarEmpresasUseCase(repository)
    this.criarUseCase = new CriarEmpresaUseCase(repository)
    this.atualizarModulosUseCase = new AtualizarModulosUseCase(repository, impactoQuery, auditoria)
    this.atualizarCapacidadesUseCase = new AtualizarCapacidadesUseCase(repository, auditoria)
    this.calcularImpactoUseCase = new CalcularImpactoUseCase(repository, impactoQuery)
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
      const empresa = await this.repository.findById(req.params.id)
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
      const { nome, documento, nomeFantasia, ativa, adminNome, adminEmail, adminSenha } = req.body
      if (!nome || !adminNome || !adminEmail || !adminSenha) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Nome, adminNome, adminEmail e adminSenha são obrigatórios." })
        return
      }
      const senhaHash = bcrypt.hashSync(adminSenha, 10)
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
        adminSenhaHash: senhaHash,
      })
      res.status(201).json(result)
    } catch (err: unknown) {
      if (err instanceof EmailDuplicadoError) {
        res.status(409).json({ code: "EMAIL_DUPLICATED", message: (err as Error).message })
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
        const existente = await this.repository.findById(req.params.id)
        antesAtiva = existente ? existente.ativa !== false : null
      }

      const result = await this.repository.update(req.params.id, data)
      if (!result) {
        res.status(404).json({ code: "EMPRESA_NOT_FOUND", message: "Empresa não encontrada." })
        return
      }

      if (data.ativa !== undefined && antesAtiva !== null && antesAtiva !== data.ativa) {
        await this.auditoria.registrar({
          empresaId: req.params.id,
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
        empresaId: req.params.id,
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
        empresaId: req.params.id,
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
      const impacto = await this.calcularImpactoUseCase.execute({ empresaId: req.params.id, modulos: parsed })
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
