import { describe, expect, it, vi } from "vitest"
import { EsquecerSenhaUseCase } from "./EsquecerSenhaUseCase.js"
import { EmailEnvioFalhouError } from "../../../../../shared/email/errors.js"
import type { IAuthRepository } from "../../../../auth/application/ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../../../auth/application/ports/auth-token.repository.js"
import type { IMailer } from "../../../../../shared/email/mailer.port.js"
import type { Usuario } from "../../../domain/usuario.entity.js"

const usuario: Usuario = {
  id: "u-1",
  nome: "Ana",
  email: "ana@x.com",
  senhaHash: "hash",
  role: "operator",
  createdAt: new Date().toISOString(),
  deletedAt: null,
  empresaId: null,
  chefeId: null,
  foto: null,
}

function setup(findByEmail: () => Promise<Usuario | null>) {
  const authRepo: IAuthRepository = {
    findByEmail: vi.fn().mockImplementation(findByEmail),
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
    removerPorTipo: vi.fn(),
  }
  const mailer: IMailer = { send: vi.fn() }
  const uc = new EsquecerSenhaUseCase(authRepo, tokenRepo, mailer)
  return { uc, tokenRepo, mailer }
}

describe("EsquecerSenhaUseCase (503 tratado)", () => {
  it("envio falha → rethrow EmailEnvioFalhouError (controller responde 503)", async () => {
    const { uc, mailer } = setup(async () => usuario)
    mailer.send = vi.fn().mockRejectedValue(new EmailEnvioFalhouError("Resend HTTP 403"))
    await expect(uc.execute({ email: "ana@x.com" })).rejects.toBeInstanceOf(EmailEnvioFalhouError)
  })

  it("e-mail inexistente → sem envio e sem erro (200 genérico)", async () => {
    const { uc, mailer } = setup(async () => null)
    await expect(uc.execute({ email: "nao@x.com" })).resolves.toBeUndefined()
    expect(mailer.send).not.toHaveBeenCalled()
  })
})
