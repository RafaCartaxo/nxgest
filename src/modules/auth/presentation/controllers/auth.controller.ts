import type { Request, Response } from "express"
import { eq } from "drizzle-orm"
import { db, empresas } from "../../../../database.js"
import type { IAuthRepository } from "../../application/ports/auth.repository.js"
import { LoginUseCase } from "../../application/use-cases/Login/LoginUseCase.js"
import { CredenciaisInvalidasError } from "../../domain/errors/auth.error.js"

export class AuthController {
  private loginUseCase: LoginUseCase
  private repository: IAuthRepository

  constructor(repository: IAuthRepository) {
    this.repository = repository
    this.loginUseCase = new LoginUseCase(repository)
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body

      if (!email || !senha) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "E-mail e senha são obrigatórios." })
        return
      }

      const result = await this.loginUseCase.execute({ email, senha })
      res.json(result)
    } catch (err) {
      if (err instanceof CredenciaisInvalidasError) {
        res.status(401).json({ code: "INVALID_CREDENTIALS", message: err.message })
        return
      }
      console.error("Erro no login:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  me = async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }

      const usuario = await this.repository.findById(req.userId)
      if (!usuario) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Usuário não encontrado." })
        return
      }

      let empresaNome: string | null = null
      if (usuario.empresaId) {
        const [empresaRow] = await db.select().from(empresas).where(eq(empresas.id, usuario.empresaId)).limit(1)
        empresaNome = empresaRow?.nome ?? null
      }

      res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        empresaId: usuario.empresaId,
        empresaNome,
      })
    } catch (err) {
      console.error("Erro no me:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }
}
