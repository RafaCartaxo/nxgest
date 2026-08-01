import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import type { IEmpresaRepository } from "../../application/ports/empresa.repository.js"
import { ListarEmpresasUseCase } from "../../application/use-cases/ListarEmpresas/ListarEmpresasUseCase.js"
import { CriarEmpresaUseCase } from "../../application/use-cases/CriarEmpresa/CriarEmpresaUseCase.js"
import { EmailDuplicadoError } from "../../../auth/domain/errors/auth.error.js"
import { EmpresaNaoEncontradaError } from "../../domain/errors/empresa.error.js"

export class EmpresaController {
  private repository: IEmpresaRepository
  private listUseCase: ListarEmpresasUseCase
  private criarUseCase: CriarEmpresaUseCase

  constructor(repository: IEmpresaRepository) {
    this.repository = repository
    this.listUseCase = new ListarEmpresasUseCase(repository)
    this.criarUseCase = new CriarEmpresaUseCase(repository)
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
      const { nome, adminNome, adminEmail, adminSenha } = req.body
      if (!nome || !adminNome || !adminEmail || !adminSenha) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Nome, adminNome, adminEmail e adminSenha são obrigatórios." })
        return
      }
      const senhaHash = bcrypt.hashSync(adminSenha, 10)
      const result = await this.criarUseCase.execute({ nome, adminNome, adminEmail, adminSenhaHash: senhaHash })
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
}