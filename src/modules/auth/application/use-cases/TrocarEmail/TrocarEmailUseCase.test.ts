import { describe, expect, it, vi } from "vitest"
import bcrypt from "bcryptjs"
import { TrocarEmailUseCase } from "./TrocarEmailUseCase.js"
import { appUrl } from "../../../../../shared/email/mailers.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { IMailer, EmailMessage } from "../../../../../shared/email/mailer.port.js"
import type { Usuario } from "../../../domain/usuario.entity.js"
import type { AuthToken } from "../../../domain/auth-token.entity.js"
import { SenhaAtualIncorretaError, EmailDuplicadoError } from "../../../domain/errors/auth.error.js"

function makeUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return {
    id: "u-1",
    nome: "Ana",
    email: "ana@x.com",
    senhaHash: bcrypt.hashSync("certa123", 4),
    role: "operator",
    createdAt: new Date().toISOString(),
    deletedAt: null,
    empresaId: null,
    chefeId: null,
    foto: null,
    emailPendente: null,
    telefone: null,
    suspensoEm: null,
    ...overrides,
  }
}

function setup(usuario: Usuario | null) {
  const authRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn().mockResolvedValue(usuario),
    emailEmUso: vi.fn().mockResolvedValue(false),
    setEmailPendente: vi.fn().mockResolvedValue(undefined),
    confirmarEmail: vi.fn(),
    invalidarPorTipo: vi.fn(),
  } as unknown as IAuthRepository
  const tokenRepo = {
    create: vi.fn().mockResolvedValue(undefined),
    findByHashAndTipo: vi.fn(),
    marcarUsado: vi.fn(),
    invalidarPorTipo: vi.fn().mockResolvedValue(undefined),
    removerPorTipo: vi.fn(),
  } as unknown as IAuthTokenRepository & { create: ReturnType<typeof vi.fn> }
  const mailer = { send: vi.fn().mockResolvedValue(undefined) } as unknown as IMailer & { send: ReturnType<typeof vi.fn> }
  const uc = new TrocarEmailUseCase(authRepo, tokenRepo, mailer)
  const sendCalls = mailer.send.mock.calls as [EmailMessage & { html: string }][]
  return { uc, authRepo, tokenRepo, mailer, sendCalls }
}

describe("TrocarEmailUseCase (PLAN-075 F4)", () => {
  it("troca válida → setEmailPendente + token email + link /verificar-email e envio", async () => {
    const { uc, authRepo, tokenRepo, sendCalls } = setup(makeUsuario())
    await uc.execute({ userId: "u-1", novoEmail: "nova@x.com", senhaAtual: "certa123" })

    expect(authRepo.setEmailPendente).toHaveBeenCalledWith("u-1", "nova@x.com")
    expect(tokenRepo.invalidarPorTipo).toHaveBeenCalledWith("u-1", "email")
    expect(tokenRepo.create).toHaveBeenCalledTimes(1)
    const tokenInput = tokenRepo.create.mock.calls[0]![0]
    expect(tokenInput.tipo).toBe("email")
    expect(sendCalls).toHaveLength(1)
    expect(sendCalls[0]![0].to).toBe("nova@x.com")
    expect(sendCalls[0]![0].html).toContain(`${appUrl()}/verificar-email?token=`)
  })

  it("senha atual incorreta → SenhaAtualIncorretaError, sem pendência nem envio", async () => {
    const { uc, authRepo, mailer } = setup(makeUsuario())
    await expect(uc.execute({ userId: "u-1", novoEmail: "nova@x.com", senhaAtual: "errada" }))
      .rejects.toBeInstanceOf(SenhaAtualIncorretaError)
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(mailer.send).not.toHaveBeenCalled()
  })

  it("conta convidada (sem senha) → SenhaAtualIncorretaError (P-04)", async () => {
    const { uc, authRepo, mailer } = setup(makeUsuario({ senhaHash: null }))
    await expect(uc.execute({ userId: "u-1", novoEmail: "nova@x.com", senhaAtual: "qualquer" }))
      .rejects.toBeInstanceOf(SenhaAtualIncorretaError)
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(mailer.send).not.toHaveBeenCalled()
  })

  it("novo e-mail já em uso → EmailDuplicadoError, sem pendência nem envio", async () => {
    const { uc, authRepo, mailer } = setup(makeUsuario())
    authRepo.emailEmUso = vi.fn().mockResolvedValue(true)
    await expect(uc.execute({ userId: "u-1", novoEmail: "outro@x.com", senhaAtual: "certa123" }))
      .rejects.toBeInstanceOf(EmailDuplicadoError)
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(mailer.send).not.toHaveBeenCalled()
  })

  it("troca para o próprio e-mail atual (com case diferente) → no-op (CT-36)", async () => {
    const { uc, authRepo, tokenRepo, mailer } = setup(makeUsuario())
    await uc.execute({ userId: "u-1", novoEmail: "  ANA@X.COM ", senhaAtual: "certa123" })
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(tokenRepo.create).not.toHaveBeenCalled()
    expect(mailer.send).not.toHaveBeenCalled()
  })
})

describe("TrocarEmailUseCase — token antigo com tipo email (reutilização do AuthToken genérico)", () => {
  it("auth-token entity: tipo email (24h) disponível", () => {
    const t: AuthToken = { id: "t-1", subjectId: "u-1", tipo: "email", hash: "h", expiraEm: "2026-01-01", usadoEm: null, createdAt: "2026-01-01" }
    expect(t.tipo).toBe("email")
  })
})