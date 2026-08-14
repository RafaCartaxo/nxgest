import { describe, expect, it, vi, afterEach } from "vitest"
import bcrypt from "bcryptjs"
import { LoginUseCase } from "./LoginUseCase.js"
import { CredenciaisInvalidasError, ContaConvidadaError, ContaSuspensaError } from "../../../domain/errors/auth.error.js"
import type { IAuthRepository } from "../../ports/auth.repository.js"
import type { Usuario } from "../../../domain/usuario.entity.js"

const base: Usuario = { id: "u1", nome: "Ana", email: "ana@x.com", senhaHash: null, role: "operator", createdAt: "2026-01-01", deletedAt: null, empresaId: null, chefeId: null, foto: null, emailPendente: null, telefone: null, suspensoEm: null }

function repo(usuario: Usuario | null): IAuthRepository {
  return { findByEmail: vi.fn().mockResolvedValue(usuario), findById: vi.fn(), create: vi.fn(), updateSenha: vi.fn(), updateFoto: vi.fn(), emailEmUso: vi.fn(), updatePerfil: vi.fn(), setEmailPendente: vi.fn(), confirmarEmail: vi.fn(), updateEmail: vi.fn(), setSuspenso: vi.fn() }
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

  it("conta suspensa → ContaSuspensaError mesmo com senha correta (N3)", async () => {
    const r = repo({ ...base, senhaHash: bcrypt.hashSync("certa123", 10), suspensoEm: "2026-08-01T10:00:00.000Z" })
    await expect(new LoginUseCase(r).execute({ email: "ana@x.com", senha: "certa123" })).rejects.toBeInstanceOf(ContaSuspensaError)
  })

  it("sucesso → token + usuário status 'ativo'", async () => {
    const prev = process.env.JWT_SECRET
    process.env.JWT_SECRET = "teste-secret-123"
    try {
      const r = repo({ ...base, senhaHash: bcrypt.hashSync("certa123", 10) })
      const res = await new LoginUseCase(r).execute({ email: "ana@x.com", senha: "certa123" })
      expect(res.token).toBeTruthy()
      expect(res.usuario.status).toBe("ativo")
      expect(res.usuario.emailVerificado).toBe(true)
      expect(res.usuario.emailPendente).toBeNull()
    } finally {
      if (prev === undefined) delete process.env.JWT_SECRET
      else process.env.JWT_SECRET = prev
    }
  })

  it("login com troca de e-mail pendente → emailVerificado false (espelha /me — PLAN-075)", async () => {
    const prev = process.env.JWT_SECRET
    process.env.JWT_SECRET = "teste-secret-123"
    try {
      const r = repo({ ...base, senhaHash: bcrypt.hashSync("certa123", 10), emailPendente: "nova@x.com", telefone: "11999999999" })
      const res = await new LoginUseCase(r).execute({ email: "ana@x.com", senha: "certa123" })
      expect(res.usuario.status).toBe("ativo")
      expect(res.usuario.emailVerificado).toBe(false)
      expect(res.usuario.emailPendente).toBe("nova@x.com")
      expect(res.usuario.telefone).toBe("11999999999")
    } finally {
      if (prev === undefined) delete process.env.JWT_SECRET
      else process.env.JWT_SECRET = prev
    }
  })
})
