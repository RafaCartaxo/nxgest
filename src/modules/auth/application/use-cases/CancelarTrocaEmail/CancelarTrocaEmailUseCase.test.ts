import { describe, expect, it, vi } from "vitest"
import bcrypt from "bcryptjs"
import { CancelarTrocaEmailUseCase } from "./CancelarTrocaEmailUseCase.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { IAuthTokenRepository } from "../../ports/auth-token.repository.js"
import type { Usuario } from "../../../domain/usuario.entity.js"
import { SenhaAtualIncorretaError } from "../../../domain/errors/auth.error.js"

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
    emailPendente: "nova@x.com",
    telefone: null,
    suspensoEm: null,
    ...overrides,
  }
}

function setup(usuario: Usuario | null) {
  const authRepo = {
    findByEmail: vi.fn(),
    findById: vi.fn().mockResolvedValue(usuario),
    emailEmUso: vi.fn(),
    setEmailPendente: vi.fn().mockResolvedValue(undefined),
    confirmarEmail: vi.fn(),
    invalidarPorTipo: vi.fn(),
  } as unknown as IAuthRepository
  const tokenRepo = {
    create: vi.fn(),
    findByHashAndTipo: vi.fn(),
    marcarUsado: vi.fn(),
    invalidarPorTipo: vi.fn().mockResolvedValue(undefined),
    removerPorTipo: vi.fn(),
  } as unknown as IAuthTokenRepository
  const uc = new CancelarTrocaEmailUseCase(authRepo, tokenRepo)
  return { uc, authRepo, tokenRepo }
}

describe("CancelarTrocaEmailUseCase (PLAN-075 P-03)", () => {
  it("cancelamento com senha correta → limpa email_pendente + invalida token email", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeUsuario())
    await uc.execute({ userId: "u-1", senhaAtual: "certa123" })
    expect(authRepo.setEmailPendente).toHaveBeenCalledWith("u-1", null)
    expect(tokenRepo.invalidarPorTipo).toHaveBeenCalledWith("u-1", "email")
  })

  it("senha incorreta → SenhaAtualIncorretaError, nada limpo", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeUsuario())
    await expect(uc.execute({ userId: "u-1", senhaAtual: "errada" })).rejects.toBeInstanceOf(SenhaAtualIncorretaError)
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(tokenRepo.invalidarPorTipo).not.toHaveBeenCalled()
  })

  it("conta convidada (sem senha) → SenhaAtualIncorretaError (P-04)", async () => {
    const { uc, authRepo, tokenRepo } = setup(makeUsuario({ senhaHash: null }))
    await expect(uc.execute({ userId: "u-1", senhaAtual: "qualquer" })).rejects.toBeInstanceOf(SenhaAtualIncorretaError)
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(tokenRepo.invalidarPorTipo).not.toHaveBeenCalled()
  })

  it("usuário inexistente → SenhaAtualIncorretaError", async () => {
    const { uc, authRepo, tokenRepo } = setup(null)
    await expect(uc.execute({ userId: "u-x", senhaAtual: "certa123" })).rejects.toBeInstanceOf(SenhaAtualIncorretaError)
    expect(authRepo.setEmailPendente).not.toHaveBeenCalled()
    expect(tokenRepo.invalidarPorTipo).not.toHaveBeenCalled()
  })
})