import type { Request, Response } from "express"
import { eq } from "drizzle-orm"
import { db, empresas } from "../../../../database.js"
import { parseModulos } from "../../../admin/domain/modules.js"
import { parseCapacidades } from "../../../admin/domain/capacidades.js"
import type { IAuthRepository } from "../../application/ports/auth.repository.js"
import { LoginUseCase } from "../../application/use-cases/Login/LoginUseCase.js"
import { AlterarSenhaUseCase } from "../../application/use-cases/AlterarSenha/AlterarSenhaUseCase.js"
import { AtivarContaUseCase } from "../../application/use-cases/AtivarConta/AtivarContaUseCase.js"
import { EsquecerSenhaUseCase } from "../../application/use-cases/EsquecerSenha/EsquecerSenhaUseCase.js"
import { RedefinirSenhaUseCase } from "../../application/use-cases/RedefinirSenha/RedefinirSenhaUseCase.js"
import { AuthTokenRepository } from "../../infrastructure/repositories/auth-token.repository.impl.js"
import { criarMailer } from "../../../../shared/email/mailers.js"
import { resolverLang } from "../../../../shared/email/templates.js"
import { CredenciaisInvalidasError, SenhaAtualIncorretaError, ContaConvidadaError, TokenInvalidoError, TokenExpiradoError } from "../../domain/errors/auth.error.js"
import { validarFoto } from "../../../../shared/utils/foto.js"

export class AuthController {
  private loginUseCase: LoginUseCase
  private alterarSenhaUseCase: AlterarSenhaUseCase
  private ativarContaUseCase: AtivarContaUseCase
  private esquecerSenhaUseCase: EsquecerSenhaUseCase
  private redefinirSenhaUseCase: RedefinirSenhaUseCase
  private repository: IAuthRepository

  constructor(repository: IAuthRepository) {
    this.repository = repository
    this.loginUseCase = new LoginUseCase(repository)
    this.alterarSenhaUseCase = new AlterarSenhaUseCase(repository)
    const tokenRepo = new AuthTokenRepository()
    const mailer = criarMailer()
    this.ativarContaUseCase = new AtivarContaUseCase(repository, tokenRepo)
    this.esquecerSenhaUseCase = new EsquecerSenhaUseCase(repository, tokenRepo, mailer)
    this.redefinirSenhaUseCase = new RedefinirSenhaUseCase(repository, tokenRepo)
  }

  private async enriquecer(usuario: { empresaId: string | null }): Promise<{ empresaNome: string | null; modulos: string[] | null; capacidades: string[] | null; ativa: boolean | null }> {
    if (!usuario.empresaId) {
      return { empresaNome: null, modulos: null, capacidades: null, ativa: null }
    }
    const [empresaRow] = await db.select().from(empresas).where(eq(empresas.id, usuario.empresaId)).limit(1)
    return {
      empresaNome: empresaRow?.nome ?? null,
      modulos: parseModulos(empresaRow?.modulos ?? null),
      capacidades: parseCapacidades(empresaRow?.capacidades ?? null),
      ativa: empresaRow ? (empresaRow.ativa == null ? true : Boolean(empresaRow.ativa)) : null,
    }
  }

  private empresaInativa(ativa: boolean | null): boolean {
    return ativa === false
  }

  login = async (req: Request, res: Response) => {
    try {
      const { email, senha } = req.body

      if (!email || !senha) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "E-mail e senha são obrigatórios." })
        return
      }

      const result = await this.loginUseCase.execute({ email, senha })
      const { empresaNome, modulos, capacidades, ativa } = await this.enriquecer(result.usuario)
      if (this.empresaInativa(ativa)) {
        res.status(403).json({ code: "EMPRESA_INATIVA", message: "A empresa está inativa." })
        return
      }
      res.json({ ...result, usuario: { ...result.usuario, empresaNome, modulos, capacidades } })
    } catch (err) {
      if (err instanceof ContaConvidadaError) {
        res.status(403).json({ code: "ACCOUNT_PENDING", message: err.message })
        return
      }
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

      const { empresaNome, modulos, capacidades, ativa } = await this.enriquecer(usuario)
      if (this.empresaInativa(ativa)) {
        res.status(403).json({ code: "EMPRESA_INATIVA", message: "A empresa está inativa." })
        return
      }

      res.json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        empresaId: usuario.empresaId,
        empresaNome,
        modulos,
        capacidades,
        chefeId: usuario.chefeId,
        foto: usuario.foto,
        status: usuario.senhaHash ? "ativo" : "convidado",
      })
    } catch (err) {
      console.error("Erro no me:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Ativação de conta convidada (PLAN-065). Público — valida token de convite. */
  ativar = async (req: Request, res: Response) => {
    const { token, senha } = req.body ?? {}
    if (!token || typeof senha !== "string" || senha.length < 6) {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Token e senha (mín. 6) são obrigatórios." })
      return
    }
    try {
      await this.ativarContaUseCase.execute({ token, senha })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof TokenExpiradoError) {
        res.status(400).json({ code: "TOKEN_EXPIRED", message: err.message })
        return
      }
      if (err instanceof TokenInvalidoError) {
        res.status(400).json({ code: "TOKEN_INVALID", message: err.message })
        return
      }
      console.error("Erro ao ativar conta:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Esqueci a senha (PLAN-065). Público + rate limit — resposta SEMPRE genérica 200. */
  forgot = async (req: Request, res: Response) => {
    const { email } = req.body ?? {}
    if (!email || typeof email !== "string") {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "E-mail é obrigatório." })
      return
    }
    try {
      await this.esquecerSenhaUseCase.execute({ email, lang: resolverLang(req.headers["accept-language"]) })
      res.json({ ok: true })
    } catch (err) {
      console.error("Erro no forgot:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Redefinir senha via token de reset (PLAN-065). Público + rate limit. */
  reset = async (req: Request, res: Response) => {
    const { token, senha } = req.body ?? {}
    if (!token || typeof senha !== "string" || senha.length < 6) {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Token e senha (mín. 6) são obrigatórios." })
      return
    }
    try {
      await this.redefinirSenhaUseCase.execute({ token, senha })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof TokenExpiradoError) {
        res.status(400).json({ code: "TOKEN_EXPIRED", message: err.message })
        return
      }
      if (err instanceof TokenInvalidoError) {
        res.status(400).json({ code: "TOKEN_INVALID", message: err.message })
        return
      }
      console.error("Erro no reset:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  alterarSenha = async (req: Request, res: Response) => {
    try {
      const userId = req.userId
      const { senhaAtual, novaSenha } = req.body ?? {}

      if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }

      if (!senhaAtual || !novaSenha) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Senha atual e nova senha são obrigatórias." })
        return
      }

      if (typeof novaSenha !== "string" || novaSenha.length < 6) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "A nova senha deve ter ao menos 6 caracteres." })
        return
      }

      if (senhaAtual === novaSenha) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "A nova senha deve ser diferente da atual." })
        return
      }

      await this.alterarSenhaUseCase.execute({ userId, senhaAtual, novaSenha })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof SenhaAtualIncorretaError) {
        res.status(422).json({ code: "INVALID_CURRENT_PASSWORD", message: err.message })
        return
      }
      console.error("Erro ao alterar senha:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Foto própria (PLAN-041/WS3): data URL normalizada (≤500KB) ou null para remover. */
  alterarFoto = async (req: Request, res: Response) => {
    try {
      const userId = req.userId
      const { foto } = req.body ?? {}

      if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }

      if (foto !== null && typeof foto !== "undefined") {
        if (typeof foto !== "string") {
          res.status(422).json({ code: "FOTO_TIPO", message: "Foto deve ser uma imagem em data URL." })
          return
        }
        const v = validarFoto(foto)
        if (!v.ok) {
          const ehTamanho = v.motivo === "tamanho"
          res.status(422).json({
            code: ehTamanho ? "FOTO_LIMITE" : "FOTO_TIPO",
            message: ehTamanho ? "Foto muito grande (máx. 1MB)." : "Foto deve ser uma imagem válida (JPEG, PNG, WebP ou GIF).",
          })
          return
        }
      }

      await this.repository.updateFoto(userId, foto ?? null)
      res.json({ ok: true, foto: foto ?? null })
    } catch (err) {
      console.error("Erro ao atualizar foto:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }
}
