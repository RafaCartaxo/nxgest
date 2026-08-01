import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import type { IAdminRepository } from "../../application/ports/admin.repository.js"
import { ListOperadoresUseCase } from "../../application/use-cases/ListOperadores/ListOperadoresUseCase.js"
import { CriarOperadorUseCase } from "../../application/use-cases/CriarOperador/CriarOperadorUseCase.js"
import { EditarOperadorUseCase } from "../../application/use-cases/EditarOperador/EditarOperadorUseCase.js"
import { RemoverOperadorUseCase } from "../../application/use-cases/RemoverOperador/RemoverOperadorUseCase.js"
import { OperadorNaoEncontradoError, NaoPodeAutoModificarError, NaoPodeAlterarSuperAdminError, NaoPodeAtribuirSuperAdminError } from "../../domain/errors/admin.error.js"
import { EmailDuplicadoError } from "../../../../modules/auth/domain/errors/auth.error.js"

export class AdminController {
  private repository: IAdminRepository
  private listUseCase: ListOperadoresUseCase
  private criarUseCase: CriarOperadorUseCase
  private editarUseCase: EditarOperadorUseCase
  private removerUseCase: RemoverOperadorUseCase
  private dashboardGetter: IAdminRepository

  constructor(repository: IAdminRepository) {
    this.repository = repository
    this.listUseCase = new ListOperadoresUseCase(repository)
    this.criarUseCase = new CriarOperadorUseCase(repository)
    this.editarUseCase = new EditarOperadorUseCase(repository)
    this.removerUseCase = new RemoverOperadorUseCase(repository)
    this.dashboardGetter = repository
  }

  private resolveEmpresaId(req: Request): string | null | undefined {
    if (req.userRole === "super_admin") {
      return (req.query.empresaId as string) || undefined
    }
    return req.empresaId
  }

  list = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const operadores = await this.listUseCase.execute(targetEmpresaId)
      res.json(operadores)
    } catch (err) {
      console.error("Erro ao listar operadores:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao listar operadores." })
    }
  }

  getOperador = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const operador = await this.dashboardGetter.findById(req.params.id, targetEmpresaId)
      if (!operador) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: "Operador não encontrado." })
        return
      }
      res.json(operador)
    } catch (err) {
      console.error("Erro ao buscar operador:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao buscar operador." })
    }
  }

  create = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req) ?? null
      if (req.userRole === "super_admin" && !targetEmpresaId) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Informe a empresa (empresaId)." })
        return
      }
      const { nome, email, senha, role } = req.body
      if (!nome || !email || !senha || !role) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Nome, email, senha e role são obrigatórios." })
        return
      }
      if (role !== "admin" && role !== "operator") {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Role deve ser 'admin' ou 'operator'." })
        return
      }
      const senhaHash = await bcrypt.hash(senha, 10)
      const operador = await this.criarUseCase.execute({ nome, email, senhaHash, role, empresaId: targetEmpresaId })
      res.status(201).json(operador)
    } catch (err) {
      if (err instanceof EmailDuplicadoError) {
        res.status(409).json({ code: "EMAIL_DUPLICATED", message: err.message })
        return
      }
      if (err instanceof NaoPodeAtribuirSuperAdminError) {
        res.status(403).json({ code: "FORBIDDEN", message: err.message })
        return
      }
      console.error("Erro ao criar operador:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao criar operador." })
    }
  }

  update = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const userId = req.userId!
      const { nome, email, role, senha } = req.body
      if (role !== undefined && role !== "admin" && role !== "operator") {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Role deve ser 'admin' ou 'operator'." })
        return
      }
      const data: { nome?: string; email?: string; role?: "admin" | "operator"; senhaHash?: string } = {}
      if (nome !== undefined) data.nome = nome
      if (email !== undefined) data.email = email
      if (role !== undefined) data.role = role
      if (senha !== undefined) data.senhaHash = await bcrypt.hash(senha, 10)

      const operador = await this.editarUseCase.execute(req.params.id, data, userId, targetEmpresaId)
      res.json(operador)
    } catch (err) {
      if (err instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof NaoPodeAutoModificarError || err instanceof NaoPodeAlterarSuperAdminError || err instanceof NaoPodeAtribuirSuperAdminError) {
        res.status(403).json({ code: "FORBIDDEN", message: err.message })
        return
      }
      console.error("Erro ao editar operador:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao editar operador." })
    }
  }

  remove = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const userId = req.userId!
      await this.removerUseCase.execute(req.params.id, userId, targetEmpresaId)
      res.status(204).send()
    } catch (err) {
      if (err instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof NaoPodeAutoModificarError || err instanceof NaoPodeAlterarSuperAdminError) {
        res.status(403).json({ code: "FORBIDDEN", message: err.message })
        return
      }
      console.error("Erro ao remover operador:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao remover operador." })
    }
  }

  dashboard = async (req: Request, res: Response) => {
    try {
      const isAdminSelf = req.userRole === "admin" && !req.query.empresaId
      const targetEmpresaId = this.resolveEmpresaId(req)
      const stats = isAdminSelf
        ? await this.dashboardGetter.getDashboardStats(req.empresaId ?? null, req.userId!)
        : await this.dashboardGetter.getDashboardStats(targetEmpresaId)
      res.json(stats)
    } catch (err) {
      console.error("Erro ao carregar dashboard admin:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao carregar dashboard." })
    }
  }
}
