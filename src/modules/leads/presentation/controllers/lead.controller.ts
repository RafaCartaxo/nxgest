import type { Request, Response } from "express"
import { LeadRepository } from "../../infrastructure/repositories/lead.repository.impl.js"
import { AuthRepository } from "../../../auth/infrastructure/repositories/auth.repository.impl.js"
import { AuthTokenRepository } from "../../../auth/infrastructure/repositories/auth-token.repository.impl.js"
import { EmpresaRepository } from "../../../admin/infrastructure/repositories/empresa.repository.impl.js"
import { CriarEmpresaUseCase } from "../../../admin/application/use-cases/CriarEmpresa/CriarEmpresaUseCase.js"
import { ConvidarUseCase } from "../../../auth/application/use-cases/Convidar/ConvidarUseCase.js"
import { criarMailer } from "../../../../shared/email/mailers.js"
import { resolverLang } from "../../../../shared/email/templates.js"
import { CriarLeadUseCase } from "../../application/use-cases/CriarLead/CriarLeadUseCase.js"
import { ConfirmarLeadUseCase } from "../../application/use-cases/ConfirmarLead/ConfirmarLeadUseCase.js"
import { ReenviarConfirmacaoUseCase } from "../../application/use-cases/ReenviarConfirmacao/ReenviarConfirmacaoUseCase.js"
import { ListarLeadsUseCase } from "../../application/use-cases/ListarLeads/ListarLeadsUseCase.js"
import { IniciarOnboardingUseCase } from "../../application/use-cases/IniciarOnboarding/IniciarOnboardingUseCase.js"
import { ConverterLeadUseCase } from "../../application/use-cases/ConverterLead/ConverterLeadUseCase.js"
import { DescartarLeadUseCase } from "../../application/use-cases/DescartarLead/DescartarLeadUseCase.js"
import { LeadEmailJaUsuarioError, LeadNaoEncontradoError, LeadStatusInvalidoError } from "../../domain/errors/lead.error.js"
import { EmailDuplicadoError, TokenExpiradoError, TokenInvalidoError } from "../../../auth/domain/errors/auth.error.js"
import { EmailEnvioFalhouError } from "../../../../shared/email/errors.js"

export class LeadController {
  private criarLead: CriarLeadUseCase
  private confirmarLead: ConfirmarLeadUseCase
  private reenviarConfirmacao: ReenviarConfirmacaoUseCase
  private listarLeads: ListarLeadsUseCase
  private iniciarOnboarding: IniciarOnboardingUseCase
  private converterLead: ConverterLeadUseCase
  private descartarLead: DescartarLeadUseCase

  constructor() {
    const repo = new LeadRepository()
    const authRepo = new AuthRepository()
    const tokenRepo = new AuthTokenRepository()
    const mailer = criarMailer()
    const criarEmpresa = new CriarEmpresaUseCase(new EmpresaRepository(authRepo))

    this.criarLead = new CriarLeadUseCase({ repo, authRepo, tokenRepo, mailer })
    this.confirmarLead = new ConfirmarLeadUseCase(tokenRepo, repo)
    this.reenviarConfirmacao = new ReenviarConfirmacaoUseCase(repo, tokenRepo, mailer)
    this.listarLeads = new ListarLeadsUseCase(repo)
    this.iniciarOnboarding = new IniciarOnboardingUseCase(repo)
    this.converterLead = new ConverterLeadUseCase({ repo, criarEmpresa, convidar: new ConvidarUseCase(tokenRepo, mailer) })
    this.descartarLead = new DescartarLeadUseCase(repo)
  }

  /** Ações de administração de leads são exclusivas do super admin (LD-13). */
  private soSuper(req: Request, res: Response): boolean {
    if (req.userRole !== "super_admin") {
      res.status(403).json({ code: "FORBIDDEN", message: "Acesso restrito ao super admin." })
      return false
    }
    return true
  }

  criar = async (req: Request, res: Response) => {
    const { nomeResponsavel, empresa, email, telefone, origem } = req.body ?? {}
    if (!nomeResponsavel || !empresa || !email || typeof email !== "string" || !email.includes("@")) {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Nome, empresa e e-mail válido são obrigatórios." })
      return
    }
    if (typeof nomeResponsavel !== "string" || nomeResponsavel.trim().length < 2 || typeof empresa !== "string" || empresa.trim().length < 2) {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Nome e empresa devem ter ao menos 2 caracteres." })
      return
    }
    try {
      const result = await this.criarLead.execute({
        nomeResponsavel,
        empresa,
        email,
        telefone,
        origem,
        lang: resolverLang(req.headers["accept-language"]),
      })
      // Dedup (LD-02): 200 com flag — o front mostra a mensagem amigável.
      if (!result.criado) {
        res.json({ ok: true, jaExistia: true })
        return
      }
      res.status(201).json({ ok: true, lead: result.lead })
    } catch (err) {
      if (err instanceof LeadEmailJaUsuarioError) {
        res.status(409).json({ code: "LEAD_EMAIL_JA_USUARIO", message: err.message })
        return
      }
      if (err instanceof EmailEnvioFalhouError) {
        // Use case já fez rollback (lead + token removidos) — retry limpo.
        console.error("[EMAIL] Falha no envio da confirmação de lead:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Serviço de e-mail indisponível no momento. Tente novamente em alguns minutos." })
        return
      }
      console.error("Erro ao criar lead:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  confirmar = async (req: Request, res: Response) => {
    const { token } = req.body ?? {}
    if (!token || typeof token !== "string") {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Token é obrigatório." })
      return
    }
    try {
      const lead = await this.confirmarLead.execute({ token })
      res.json({ ok: true, lead })
    } catch (err) {
      if (err instanceof TokenExpiradoError) {
        res.status(400).json({ code: "TOKEN_EXPIRED", message: err.message })
        return
      }
      if (err instanceof TokenInvalidoError) {
        res.status(400).json({ code: "TOKEN_INVALID", message: err.message })
        return
      }
      console.error("Erro ao confirmar lead:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  reenviar = async (req: Request, res: Response) => {
    const { email } = req.body ?? {}
    if (!email || typeof email !== "string") {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "E-mail é obrigatório." })
      return
    }
    try {
      // Resposta sempre genérica (não vaza se o lead existe).
      await this.reenviarConfirmacao.execute({ email, lang: resolverLang(req.headers["accept-language"]) })
      res.json({ ok: true })
    } catch (err) {
      if (err instanceof EmailEnvioFalhouError) {
        console.error("[EMAIL] Falha no reenvio de confirmação de lead:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Serviço de e-mail indisponível no momento. Tente novamente em alguns minutos." })
        return
      }
      console.error("Erro ao reenviar confirmação de lead:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  listar = async (req: Request, res: Response) => {
    if (!this.soSuper(req, res)) return
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined
      res.json(await this.listarLeads.execute(status))
    } catch (err) {
      console.error("Erro ao listar leads:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  onboarding = async (req: Request, res: Response) => {
    if (!this.soSuper(req, res)) return
    try {
      const lead = await this.iniciarOnboarding.execute(req.params.id)
      res.json(lead)
    } catch (err) {
      if (err instanceof LeadNaoEncontradoError) {
        res.status(404).json({ code: "LEAD_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof LeadStatusInvalidoError) {
        res.status(422).json({ code: "LEAD_STATUS_INVALIDO", message: err.message })
        return
      }
      console.error("Erro ao iniciar onboarding:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  converter = async (req: Request, res: Response) => {
    if (!this.soSuper(req, res)) return
    try {
      const result = await this.converterLead.execute({
        id: req.params.id,
        por: req.userId!,
        lang: resolverLang(req.headers["accept-language"]),
      })
      res.json({ ok: true, ...result })
    } catch (err) {
      if (err instanceof LeadNaoEncontradoError) {
        res.status(404).json({ code: "LEAD_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof LeadStatusInvalidoError) {
        res.status(422).json({ code: "LEAD_STATUS_INVALIDO", message: err.message })
        return
      }
      if (err instanceof EmailDuplicadoError) {
        res.status(409).json({ code: "EMAIL_DUPLICATED", message: err.message })
        return
      }
      if (err instanceof EmailEnvioFalhouError) {
        // Empresa + admin criados, mas o convite não saiu — super reenvia na lista de operadores da empresa.
        console.error("[EMAIL] Falha no convite do admin na conversão:", err.message)
        res.status(503).json({ code: "EMAIL_UNAVAILABLE", message: "Empresa criada, mas o convite do administrador não foi enviado (serviço de e-mail indisponível). Reenvie o convite na empresa." })
        return
      }
      console.error("Erro ao converter lead:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }

  descartar = async (req: Request, res: Response) => {
    if (!this.soSuper(req, res)) return
    const { motivo } = req.body ?? {}
    if (typeof motivo !== "string" || !motivo.trim()) {
      res.status(422).json({ code: "VALIDATION_ERROR", message: "Motivo é obrigatório." })
      return
    }
    try {
      const lead = await this.descartarLead.execute({ id: req.params.id, por: req.userId!, motivo: motivo.trim() })
      res.json(lead)
    } catch (err) {
      if (err instanceof LeadNaoEncontradoError) {
        res.status(404).json({ code: "LEAD_NOT_FOUND", message: err.message })
        return
      }
      if (err instanceof LeadStatusInvalidoError) {
        res.status(422).json({ code: "LEAD_STATUS_INVALIDO", message: err.message })
        return
      }
      console.error("Erro ao descartar lead:", err)
      res.status(500).json({ code: "INTERNAL_ERROR", message: "Erro interno do servidor." })
    }
  }
}
