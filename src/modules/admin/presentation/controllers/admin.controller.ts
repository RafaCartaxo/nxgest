import type { Request, Response } from "express"
import bcrypt from "bcryptjs"
import type { IAdminRepository } from "../../application/ports/admin.repository.js"
import { ListOperadoresUseCase } from "../../application/use-cases/ListOperadores/ListOperadoresUseCase.js"
import { ListarEquipeUseCase } from "../../application/use-cases/ListarEquipe/ListarEquipeUseCase.js"
import { CriarOperadorUseCase } from "../../application/use-cases/CriarOperador/CriarOperadorUseCase.js"
import { EditarOperadorUseCase } from "../../application/use-cases/EditarOperador/EditarOperadorUseCase.js"
import { RemoverOperadorUseCase } from "../../application/use-cases/RemoverOperador/RemoverOperadorUseCase.js"
import { OperadorNaoEncontradoError, NaoPodeAutoModificarError, NaoPodeAlterarSuperAdminError, NaoPodeAtribuirSuperAdminError, NaoPodeRebaixarComSubordinadosError } from "../../domain/errors/admin.error.js"
import { validarFoto } from "../../../../shared/utils/foto.js"
import { EmailDuplicadoError } from "../../../../modules/auth/domain/errors/auth.error.js"
import { ConvidarUseCase } from "../../../../modules/auth/application/use-cases/Convidar/ConvidarUseCase.js"
import { AuthTokenRepository } from "../../../../modules/auth/infrastructure/repositories/auth-token.repository.impl.js"
import { criarMailer } from "../../../../shared/email/mailers.js"
import { resolverLang } from "../../../../shared/email/templates.js"
import { EmailEnvioFalhouError } from "../../../../shared/email/errors.js"

const ROLES_ADMIN = ["admin", "socio", "operator"] as const

export class AdminController {
  private repository: IAdminRepository
  private listUseCase: ListOperadoresUseCase
  private listarEquipeUseCase: ListarEquipeUseCase
  private criarUseCase: CriarOperadorUseCase
  private editarUseCase: EditarOperadorUseCase
  private removerUseCase: RemoverOperadorUseCase
  private dashboardGetter: IAdminRepository
  private convidarUseCase: ConvidarUseCase

  constructor(repository: IAdminRepository) {
    this.repository = repository
    this.listUseCase = new ListOperadoresUseCase(repository)
    this.listarEquipeUseCase = new ListarEquipeUseCase(repository)
    this.criarUseCase = new CriarOperadorUseCase(repository)
    this.editarUseCase = new EditarOperadorUseCase(repository)
    this.removerUseCase = new RemoverOperadorUseCase(repository)
    this.dashboardGetter = repository
    this.convidarUseCase = new ConvidarUseCase(new AuthTokenRepository(), criarMailer())
  }

  private resolveEmpresaId(req: Request): string | null | undefined {
    if (req.userRole === "super_admin") {
      return (req.query.empresaId as string) || undefined
    }
    return req.empresaId
  }

  /** Escopo da subárvore para sócio (PLAN-032). Admin/super = empresa inteira. */
  private async resolveScope(req: Request): Promise<string[] | undefined> {
    if (req.userRole === "socio") {
      return this.repository.subarvoreIds(req.userId!)
    }
    return undefined
  }

  /** Valida o chefe: existe, mesma empresa, não-self (em relação ao alvo), role compatível. */
  private async validarChefe(
    chefeId: string | null | undefined,
    empresaId: string | null | undefined,
    targetRole: string,
    targetUserId?: string
  ): Promise<{ ok: true } | { ok: false; message: string }> {
    if (!chefeId) return { ok: true } // null = sob o admin
    if (targetUserId && chefeId === targetUserId) return { ok: false, message: "O usuário não pode ser chefe de si mesmo." }
    const chefe = await this.repository.findById(chefeId, empresaId)
    if (!chefe) return { ok: false, message: "Chefe não encontrado ou de outra empresa." }
    if (targetRole === "socio" && chefe.role !== "admin") return { ok: false, message: "O chefe de um sócio deve ser um administrador." }
    if (targetRole === "operator" && chefe.role !== "admin" && chefe.role !== "socio") return { ok: false, message: "O chefe de um operador deve ser um administrador ou sócio." }
    return { ok: true }
  }

  list = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const scope = await this.resolveScope(req)
      const operadores = await this.listUseCase.execute(targetEmpresaId, scope)
      res.json(operadores)
    } catch (err) {
      console.error("Erro ao listar operadores:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao listar operadores." })
    }
  }

  getOperador = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const scope = await this.resolveScope(req)
      const operador = await this.dashboardGetter.findById(req.params.id, targetEmpresaId, scope)
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
      const { nome, email, senha, role, chefeId } = req.body
      if (!nome || !email || !role) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Nome, email e role são obrigatórios." })
        return
      }
      if (!(ROLES_ADMIN as readonly string[]).includes(role)) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Role deve ser 'admin', 'socio' ou 'operator'." })
        return
      }
      if (senha !== undefined && senha !== null && (typeof senha !== "string" || senha.length < 6)) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "A senha deve ter ao menos 6 caracteres." })
        return
      }

      let finalChefeId = chefeId ?? null
      if (req.userRole === "socio") {
        if (role !== "operator") {
          res.status(403).json({ code: "FORBIDDEN", message: "Sócio só pode criar operadores." })
          return
        }
        finalChefeId = req.userId!
      } else {
        if (role === "socio" && !finalChefeId) finalChefeId = req.userId!
        const chefeOk = await this.validarChefe(finalChefeId, targetEmpresaId, role)
        if (!chefeOk.ok) {
          res.status(422).json({ code: "VALIDATION_ERROR", message: chefeOk.message })
          return
        }
      }

      // Senha opcional (PLAN-065): sem senha → convidado (recebe convite por e-mail).
      const senhaHash = senha ? await bcrypt.hash(senha, 10) : null
      const operador = await this.criarUseCase.execute({ nome, email, senhaHash, role, empresaId: targetEmpresaId, chefeId: finalChefeId })
      if (senhaHash === null) {
        await this.convidarUseCase.execute({ subjectId: operador.id, nome: operador.nome, email: operador.email, lang: resolverLang(req.headers["accept-language"]) })
      }
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
      if (err instanceof EmailEnvioFalhouError) {
        // Operador já foi criado (ficou "convidado") — o admin resolve com "reenviar convite".
        console.error("[EMAIL] Falha no envio do convite:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Operador criado, mas o convite não foi enviado (serviço de e-mail indisponível). Use 'Reenviar convite'." })
        return
      }
      console.error("Erro ao criar operador:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao criar operador." })
    }
  }

  reenviarConvite = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const scope = await this.resolveScope(req)
      const operador = await this.repository.findById(req.params.id, targetEmpresaId, scope)
      if (!operador) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: "Operador não encontrado." })
        return
      }
      if (operador.status !== "convidado") {
        res.status(409).json({ code: "VALIDATION_ERROR", message: "Conta já ativa — convite não se aplica." })
        return
      }
      await this.convidarUseCase.execute({
        subjectId: operador.id,
        nome: operador.nome,
        email: operador.email,
        lang: resolverLang(req.headers["accept-language"]),
      })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof EmailEnvioFalhouError) {
        console.error("[EMAIL] Falha no reenvio do convite:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Serviço de e-mail indisponível no momento. Tente novamente em alguns minutos." })
        return
      }
      console.error("Erro ao reenviar convite:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao reenviar convite." })
    }
  }

  update = async (req: Request, res: Response) => {
    try {
      const targetEmpresaId = this.resolveEmpresaId(req)
      const scope = await this.resolveScope(req)
      const userId = req.userId!
      const { nome, email, role, senha, chefeId, foto, reatribuirParaChefeId } = req.body

      const existing = await this.repository.findById(req.params.id, targetEmpresaId, scope)
      if (!existing) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: "Operador não encontrado." })
        return
      }
      if (role !== undefined && !(ROLES_ADMIN as readonly string[]).includes(role)) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "Role deve ser 'admin', 'socio' ou 'operator'." })
        return
      }
      if (senha !== undefined && (typeof senha !== "string" || senha.length < 6)) {
        res.status(400).json({ code: "VALIDATION_ERROR", message: "A senha deve ter ao menos 6 caracteres." })
        return
      }
      if (foto !== null && foto !== undefined) {
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
      // Sócio gerencia apenas operadores (mesma regra do create — WS7).
      if (req.userRole === "socio" && role !== undefined && role !== "operator") {
        res.status(403).json({ code: "FORBIDDEN", message: "Sócio só pode gerenciar operadores." })
        return
      }
      const targetRole = role ?? existing.role
      if (chefeId !== undefined) {
        const chefeOk = await this.validarChefe(chefeId, targetEmpresaId, targetRole, req.params.id)
        if (!chefeOk.ok) {
          res.status(422).json({ code: "VALIDATION_ERROR", message: chefeOk.message })
          return
        }
      }
      // Reassign atômico (PLAN-061): o novo chefe dos subordinados deve ser um ADMIN
      // da mesma empresa (vale para operadores e sócios reatribuídos).
      if (reatribuirParaChefeId !== undefined && reatribuirParaChefeId !== null) {
        const chefeOk = await this.validarChefe(reatribuirParaChefeId, targetEmpresaId, "socio", req.params.id)
        if (!chefeOk.ok) {
          res.status(422).json({ code: "VALIDATION_ERROR", message: chefeOk.message })
          return
        }
      }

      const data: { nome?: string; email?: string; role?: "admin" | "socio" | "operator"; senhaHash?: string; chefeId?: string | null; foto?: string | null; reatribuirParaChefeId?: string | null } = {}
      if (nome !== undefined) data.nome = nome
      if (email !== undefined) data.email = email
      if (role !== undefined) data.role = role
      if (senha !== undefined) data.senhaHash = await bcrypt.hash(senha, 10)
      // Higiene (WS7): admin não tem chefe — zera mesmo quando o body não envia.
      if (role === "admin" || targetRole === "admin") data.chefeId = null
      else if (chefeId !== undefined) data.chefeId = chefeId
      if (foto !== undefined) data.foto = foto
      if (reatribuirParaChefeId !== undefined) data.reatribuirParaChefeId = reatribuirParaChefeId ?? null

      const operador = await this.editarUseCase.execute(req.params.id, data, userId, targetEmpresaId, scope)
      res.json(operador)
    } catch (err) {
      if (err instanceof OperadorNaoEncontradoError) {
        res.status(404).json({ code: "OPERATOR_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof NaoPodeRebaixarComSubordinadosError) {
        res.status(422).json({ code: "OPERATOR_HAS_SUBORDINATES", message: err.message, subordinados: err.subordinados })
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
      const scope = await this.resolveScope(req)
      const userId = req.userId!
      await this.removerUseCase.execute(req.params.id, userId, targetEmpresaId, scope)
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
      const scope = await this.resolveScope(req)
      const targetEmpresaId = this.resolveEmpresaId(req)
      const stats = scope
        ? await this.dashboardGetter.getDashboardStats(targetEmpresaId ?? null, null, scope)
        : await this.dashboardGetter.getDashboardStats(targetEmpresaId)
      res.json(stats)
    } catch (err) {
      console.error("Erro ao carregar dashboard admin:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao carregar dashboard." })
    }
  }

  equipe = async (req: Request, res: Response) => {
    try {
      let targetEmpresaId: string
      if (req.userRole === "super_admin") {
        const q = req.query.empresaId as string | undefined
        if (!q) {
          res.status(400).json({ code: "VALIDATION_ERROR", message: "Informe a empresa (empresaId)." })
          return
        }
        targetEmpresaId = q
      } else {
        targetEmpresaId = req.empresaId!
      }

      const scope = await this.resolveScope(req)
      const result = await this.listarEquipeUseCase.execute(targetEmpresaId, scope)
      res.json(result)
    } catch (err) {
      console.error("Erro ao carregar equipe:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro ao carregar equipe." })
    }
  }
}
