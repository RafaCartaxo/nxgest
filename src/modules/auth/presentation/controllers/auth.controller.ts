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
import { TrocarEmailUseCase } from "../../application/use-cases/TrocarEmail/TrocarEmailUseCase.js"
import { VerificarEmailUseCase } from "../../application/use-cases/VerificarEmail/VerificarEmailUseCase.js"
import { CancelarTrocaEmailUseCase } from "../../application/use-cases/CancelarTrocaEmail/CancelarTrocaEmailUseCase.js"
import { AuthTokenRepository } from "../../infrastructure/repositories/auth-token.repository.impl.js"
import { ConviteRepository } from "../../infrastructure/repositories/convite.repository.impl.js"
import { criarMailer } from "../../../../shared/email/mailers.js"
import { resolverLang } from "../../../../shared/email/templates.js"
import { CredenciaisInvalidasError, SenhaAtualIncorretaError, ContaConvidadaError, ContaSuspensaError, TokenInvalidoError, TokenExpiradoError, EmailDuplicadoError } from "../../domain/errors/auth.error.js"
import { EmailEnvioFalhouError } from "../../../../shared/email/errors.js"
import { validarFoto } from "../../../../shared/utils/foto.js"

/** Status computado da conta (PLAN-075 N3/N1.8): suspenso > ativo > convidado. */
function statusDe(usuario: { suspensoEm: string | null; senhaHash: string | null }): "suspenso" | "ativo" | "convidado" {
  if (usuario.suspensoEm) return "suspenso"
  if (usuario.senhaHash) return "ativo"
  return "convidado"
}

export class AuthController {
  private loginUseCase: LoginUseCase
  private alterarSenhaUseCase: AlterarSenhaUseCase
  private ativarContaUseCase: AtivarContaUseCase
  private esquecerSenhaUseCase: EsquecerSenhaUseCase
  private redefinirSenhaUseCase: RedefinirSenhaUseCase
  private trocarEmailUseCase: TrocarEmailUseCase
  private verificarEmailUseCase: VerificarEmailUseCase
  private cancelarTrocaEmailUseCase: CancelarTrocaEmailUseCase
  private repository: IAuthRepository

  constructor(repository: IAuthRepository) {
    this.repository = repository
    this.loginUseCase = new LoginUseCase(repository)
    this.alterarSenhaUseCase = new AlterarSenhaUseCase(repository)
    const tokenRepo = new AuthTokenRepository()
    const mailer = criarMailer()
    this.ativarContaUseCase = new AtivarContaUseCase(repository, new ConviteRepository())
    this.esquecerSenhaUseCase = new EsquecerSenhaUseCase(repository, tokenRepo, mailer)
    this.redefinirSenhaUseCase = new RedefinirSenhaUseCase(repository, tokenRepo)
    this.trocarEmailUseCase = new TrocarEmailUseCase(repository, tokenRepo, mailer)
    this.verificarEmailUseCase = new VerificarEmailUseCase(repository, tokenRepo)
    this.cancelarTrocaEmailUseCase = new CancelarTrocaEmailUseCase(repository, tokenRepo)
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
      if (err instanceof ContaSuspensaError) {
        res.status(403).json({ code: "CONTA_SUSPENSA", message: err.message })
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
        emailPendente: usuario.emailPendente,
        telefone: usuario.telefone,
        role: usuario.role,
        empresaId: usuario.empresaId,
        empresaNome,
        modulos,
        capacidades,
        chefeId: usuario.chefeId,
        foto: usuario.foto,
        status: statusDe(usuario),
        // N1.8: verificado = conta ativou via convite (senha definida) e sem pendência.
        emailVerificado: Boolean(usuario.senhaHash) && !usuario.emailPendente,
      })
    } catch (err) {
      console.error("Erro no me:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Ativação de conta convidada (PLAN-065/075). Público — valida convite da tabela dedicada. */
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
      if (err instanceof EmailEnvioFalhouError) {
        console.error("[EMAIL] Falha no envio do reset:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Serviço de e-mail indisponível no momento. Tente novamente em alguns minutos." })
        return
      }
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

  /** Perfil próprio (F3 — PLAN-075): nome e telefone. Foto/senha têm fluxos próprios. */
  atualizarPerfil = async (req: Request, res: Response) => {
    try {
      const userId = req.userId
      const { nome, telefone } = req.body ?? {}
      if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }
      if (nome !== undefined && (typeof nome !== "string" || nome.trim().length === 0)) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Nome inválido." })
        return
      }
      if (telefone !== undefined && telefone !== null && typeof telefone !== "string") {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Telefone inválido." })
        return
      }
      const usuario = await this.repository.updatePerfil(userId, {
        nome: nome !== undefined ? nome.trim() : undefined,
        telefone: telefone !== undefined ? (telefone ?? null) : undefined,
      })
      res.json({ ok: true, nome: usuario?.nome, telefone: usuario?.telefone })
    } catch (err) {
      console.error("Erro ao atualizar perfil:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Inicia troca de e-mail (F4 — PLAN-075): senha atual + novo e-mail. */
  trocarEmail = async (req: Request, res: Response) => {
    try {
      const userId = req.userId
      const { novoEmail, senhaAtual } = req.body ?? {}
      if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }
      if (typeof novoEmail !== "string" || novoEmail.trim().length === 0) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Informe o novo e-mail." })
        return
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(novoEmail.trim())) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Formato de e-mail inválido." })
        return
      }
      if (typeof senhaAtual !== "string" || senhaAtual.length === 0) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Informe a senha atual." })
        return
      }
      await this.trocarEmailUseCase.execute({ userId, novoEmail, senhaAtual, lang: resolverLang(req.headers["accept-language"]) })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof SenhaAtualIncorretaError) {
        res.status(422).json({ code: "INVALID_CURRENT_PASSWORD", message: err.message })
        return
      }
      if (err instanceof EmailDuplicadoError) {
        res.status(409).json({ code: "EMAIL_DUPLICATED", message: err.message })
        return
      }
      if (err instanceof EmailEnvioFalhouError) {
        console.error("[EMAIL] Falha no envio da verificação:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Pendência registrada, mas o e-mail não foi enviado. Tente novamente em instantes." })
        return
      }
      console.error("Erro ao trocar e-mail:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Confirma a troca de e-mail pelo link (F4). */
  verificarEmail = async (req: Request, res: Response) => {
    try {
      const userId = req.userId
      const { token } = req.body ?? {}
      if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }
      if (!token || typeof token !== "string") {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Token é obrigatório." })
        return
      }
      await this.verificarEmailUseCase.execute({ userId, token })
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
      console.error("Erro ao confirmar e-mail:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  /** Cancela troca de e-mail pendente (P-03/N5): senha atual obrigatória. */
  cancelarTrocaEmail = async (req: Request, res: Response) => {
    try {
      const userId = req.userId
      const { senhaAtual } = req.body ?? {}
      if (!userId) {
        res.status(401).json({ code: "UNAUTHORIZED", message: "Token de autenticação ausente." })
        return
      }
      if (typeof senhaAtual !== "string" || senhaAtual.length === 0) {
        res.status(422).json({ code: "VALIDATION_ERROR", message: "Informe a senha atual." })
        return
      }
      await this.cancelarTrocaEmailUseCase.execute({ userId, senhaAtual })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof SenhaAtualIncorretaError) {
        res.status(422).json({ code: "INVALID_CURRENT_PASSWORD", message: err.message })
        return
      }
      console.error("Erro ao cancelar troca de e-mail:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }
}