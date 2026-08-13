import { describe, expect, it, afterEach, vi } from "vitest"
import { criarMailer, ConsoleMailer, ResendMailer, FailingMailer, fromAddress } from "./mailers.js"
import { EmailEnvioFalhouError } from "./errors.js"

const msg = { to: "a@b.com", subject: "s", html: "h", text: "h" }

describe("criarMailer (política de envio dev/staging/prod — PLAN-071)", () => {
  const envBackup = { ...process.env }

  afterEach(() => {
    process.env = { ...envBackup }
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("produção sem MAIL_PROVIDER e sem chave → FailingMailer (nunca mente sucesso)", async () => {
    process.env.NODE_ENV = "production"
    delete process.env.MAIL_PROVIDER
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

  it("dev COM chave → ConsoleMailer (nunca envia real — regra dura)", async () => {
    process.env.NODE_ENV = "development"
    process.env.MAIL_PROVIDER = "resend"
    process.env.RESEND_API_KEY = "re_123"
    vi.spyOn(console, "log").mockImplementation(() => {})
    expect(criarMailer()).toBeInstanceOf(ConsoleMailer)
  })

  it("MAIL_PROVIDER=resend + chave → ResendMailer", () => {
    process.env.NODE_ENV = "production"
    process.env.MAIL_PROVIDER = "resend"
    process.env.RESEND_API_KEY = "re_123"
    expect(criarMailer()).toBeInstanceOf(ResendMailer)
  })

  it("MAIL_PROVIDER=resend sem chave → FailingMailer (fail-closed)", async () => {
    process.env.NODE_ENV = "production"
    process.env.MAIL_PROVIDER = "resend"
    delete process.env.RESEND_API_KEY
    vi.spyOn(console, "error").mockImplementation(() => {})
    const mailer = criarMailer()
    expect(mailer).toBeInstanceOf(FailingMailer)
    await expect(mailer.send(msg)).rejects.toBeInstanceOf(EmailEnvioFalhouError)
  })

  it("MAIL_PROVIDER=console → ConsoleMailer", () => {
    process.env.NODE_ENV = "staging"
    process.env.MAIL_PROVIDER = "console"
    expect(criarMailer()).toBeInstanceOf(ConsoleMailer)
  })

  it("MAIL_PROVIDER=fail → FailingMailer", () => {
    process.env.NODE_ENV = "staging"
    process.env.MAIL_PROVIDER = "fail"
    expect(criarMailer()).toBeInstanceOf(FailingMailer)
  })

  it("fromAddress monta display name", () => {
    process.env.MAIL_FROM_NAME = "NX Gest"
    process.env.MAIL_FROM_ADDRESS = "no-reply@nxgest.com.br"
    expect(fromAddress()).toBe("NX Gest <no-reply@nxgest.com.br>")
  })

  it("fromAddress com MAIL_FROM_ADDRESS vazio cai pro MAIL_FROM legado", () => {
    process.env.MAIL_FROM_NAME = "NX Gest"
    process.env.MAIL_FROM_ADDRESS = ""
    process.env.MAIL_FROM = "no-reply@nxgest.com.br"
    expect(fromAddress()).toBe("NX Gest <no-reply@nxgest.com.br>")
  })

  it("fromAddress sem display name cai pro endereço legado", () => {
    delete process.env.MAIL_FROM_NAME
    delete process.env.MAIL_FROM_ADDRESS
    process.env.MAIL_FROM = "no-reply@nxgest.com.br"
    expect(fromAddress()).toBe("no-reply@nxgest.com.br")
  })

  it("ResendMailer envia payload com display name e reply_to", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal("fetch", fetchMock)
    const mailer = new ResendMailer("re_123", "NX Gest <no-reply@nxgest.com.br>")
    await mailer.send({ ...msg, replyTo: "contato@nxgest.com.br" })
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe("https://api.resend.com/emails")
    expect(JSON.parse(opts.body)).toMatchObject({
      from: "NX Gest <no-reply@nxgest.com.br>",
      to: "a@b.com",
      reply_to: "contato@nxgest.com.br",
      headers: { "List-Unsubscribe": "<mailto:rafael.cartaxo@hotmail.com>" },
    })
  })

  it("ResendMailer falha (HTTP != ok) → EmailEnvioFalhouError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 422 }))
    const mailer = new ResendMailer("re_123", '"NX Gest" <no-reply@nxgest.com.br>')
    await expect(mailer.send(msg)).rejects.toBeInstanceOf(EmailEnvioFalhouError)
  })
})
