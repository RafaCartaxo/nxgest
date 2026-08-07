import { describe, expect, it, vi } from "vitest"
import { CriarLeadUseCase } from "./CriarLeadUseCase.js"
import { EmailEnvioFalhouError } from "../../../../../shared/email/errors.js"
import type { ILeadRepository } from "../../ports/lead.repository.js"
import type { IAuthRepository } from "../../../../auth/application/ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../../../auth/application/ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import type { Lead } from "../../../domain/lead.entity.js"

const leadBase: Lead = {
  id: "lead-1",
  nomeResponsavel: "Maria",
  empresa: "Comercial",
  email: "maria@x.com",
  telefone: null,
  origem: "Site",
  status: "NOVO",
  convertidoEmpresaId: null,
  convertidoEm: null,
  convertidoPor: null,
  descartadoEm: null,
  descartadoPor: null,
  descarteMotivo: null,
  createdAt: new Date().toISOString(),
}

function setup(mailer: IMailer) {
  const repo: ILeadRepository = {
    create: vi.fn().mockResolvedValue(leadBase),
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn().mockResolvedValue(null),
    list: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn(),
    marcarConfirmado: vi.fn(),
    marcarConvertido: vi.fn(),
    descartar: vi.fn(),
    deleteById: vi.fn().mockResolvedValue(undefined),
  }
  const authRepo: IAuthRepository = {
    findByEmail: vi.fn().mockResolvedValue(null),
    findById: vi.fn(),
    create: vi.fn(),
    updateSenha: vi.fn(),
    updateFoto: vi.fn(),
  }
  const tokenRepo: IAuthTokenRepository = {
    create: vi.fn().mockResolvedValue(undefined),
    findByHashAndTipo: vi.fn(),
    marcarUsado: vi.fn(),
    invalidarPorTipo: vi.fn().mockResolvedValue(undefined),
    removerPorTipo: vi.fn().mockResolvedValue(undefined),
  }
  const uc = new CriarLeadUseCase({ repo, authRepo, tokenRepo, mailer })
  return { uc, repo, tokenRepo }
}

describe("CriarLeadUseCase (rollback de e-mail)", () => {
  it("envio ok → lead criado, token gerado, sem rollback", async () => {
    const mailer: IMailer = { send: vi.fn().mockResolvedValue(undefined) }
    const { uc, repo, tokenRepo } = setup(mailer)
    const result = await uc.execute({ nomeResponsavel: "Maria", empresa: "Comercial", email: "maria@x.com" })
    expect(result.criado).toBe(true)
    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(tokenRepo.create).toHaveBeenCalledTimes(1)
    expect(tokenRepo.removerPorTipo).not.toHaveBeenCalled()
    expect(repo.deleteById).not.toHaveBeenCalled()
  })

  it("envio falha → rollback (token removido + lead apagado) + rethrow EmailEnvioFalhouError", async () => {
    const mailer: IMailer = { send: vi.fn().mockRejectedValue(new EmailEnvioFalhouError("Resend HTTP 403")) }
    const { uc, repo, tokenRepo } = setup(mailer)
    await expect(uc.execute({ nomeResponsavel: "Maria", empresa: "Comercial", email: "maria@x.com" }))
      .rejects.toBeInstanceOf(EmailEnvioFalhouError)
    expect(tokenRepo.removerPorTipo).toHaveBeenCalledWith("lead-1", "lead")
    expect(repo.deleteById).toHaveBeenCalledWith("lead-1")
  })
})
