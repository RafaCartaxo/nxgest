import { describe, expect, it, vi, afterEach } from "vitest"
import bcrypt from "bcryptjs"
import { LoginUseCase } from "./LoginUseCase.js"
import { CredenciaisInvalidasError, ContaConvidadaError } from "../../../domain/errors/auth.error.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { Usuario } from "../../../domain/usuario.entity.js"

const base: Usuario = { id: "u1", nome: "Ana", email: "ana@x.com", senhaHash: null, role: "operator", createdAt: "2026-01-01", deletedAt: null, empresaId: null, chefeId: null, foto: null }

function repo(usuario: Usuario | null): IAuthRepository {
  return { findByEmail: vi.fn().mockResolvedValue(usuario), findById: vi.fn(), create: vi.fn(), updateSenha: vi.fn(), updateFoto: vi.fn() }
}

describe("LoginUseCase (conta)", () => {
  it("usuário inexistente → CredenciaisInvalidasError", async () => {
    await expect(new LoginUseCase(repo(null)).execute({ email: "x@x.com", senha: "123456" })).rejects.toBeInstanceOf(CredenciaisInvalidasError)
  })

  it("conta convidada (sem senha) → ContaConvidadaError (403 ACCOUNT_PENDING)", async () => {
    await expect(new LoginUseCase(repo(base)).execute({ email: "ana@x.com", senha: "123456" })).rejects.toBeInstanceOf(ContaConvidadaError)
  })

  it("senha errada → CredenciaisInvalidasError", async () => {
    const r = repo({ ...base, senhaHash: bcrypt.hashSync("certa123", 10) })
    await expect(new LoginUseCase(r).execute({ email: "ana@x.com", senha: "errada123" })).rejects.toBeInstanceOf(CredenciaisInvalidasError)
  })

  it("sucesso → token + usuário status 'ativo'", async () => {
    const prev = process.env.JWT_SECRET
    process.env.JWT_SECRET = "teste-secret-123"
    try {
      const r = repo({ ...base, senhaHash: bcrypt.hashSync("certa123", 10) })
      const res = await new LoginUseCase(r).execute({ email: "ana@x.com", senha: "certa123" })
      expect(res.token).toBeTruthy()
      expect(res.usuario.status).toBe("ativo")
    } finally {
      if (prev === undefined) delete process.env.JWT_SECRET
      else process.env.JWT_SECRET = prev
    }
  })
})
