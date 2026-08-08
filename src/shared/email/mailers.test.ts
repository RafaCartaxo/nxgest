import { describe, expect, it, afterEach, vi } from "vitest"
import { criarMailer, ConsoleMailer, ResendMailer, FailingMailer } from "./mailers.js"
import { EmailEnvioFalhouError } from "./errors.js"

const msg = { to: "a@b.com", subject: "s", html: "h", text: "h" }

describe("criarMailer (fail-closed em produção)", () => {
  const envBackup = { ...process.env }

  afterEach(() => {
    process.env = { ...envBackup }
  })

  it("produção sem RESEND_API_KEY → FailingMailer (nunca mente sucesso)", async () => {
    process.env.NODE_ENV = "production"
    delete process.env.RESEND_API_KEY
    vi.spyOn(console, "error").mockImplementation(() => {})
    const mailer = criarMailer()
    expect(mailer).toBeInstanceOf(FailingMailer)
    await expect(mailer.send(msg)).rejects.toBeInstanceOf(EmailEnvioFalhouError)
  })

  it("dev sem chave → ConsoleMailer (loga o link, não falha)", async () => {
    process.env.NODE_ENV = "development"
    delete process.env.RESEND_API_KEY
    vi.spyOn(console, "log").mockImplementation(() => {})
    const mailer = criarMailer()
    expect(mailer).toBeInstanceOf(ConsoleMailer)
    await expect(mailer.send(msg)).resolves.toBeUndefined()
  })

  it("com chave → ResendMailer", () => {
    process.env.RESEND_API_KEY = "re_123"
    const mailer = criarMailer()
    expect(mailer).toBeInstanceOf(ResendMailer)
  })
})
