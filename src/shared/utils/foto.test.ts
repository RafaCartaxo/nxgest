import { describe, expect, it } from "vitest"
import { validarFoto, MAX_FOTO_BYTES } from "./foto.js"

describe("validarFoto (PLAN-058 — segurança by-design)", () => {
  it("JPEG válido → ok", () => {
    const data = `data:image/jpeg;base64,${Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x01]).toString("base64")}`
    expect(validarFoto(data)).toEqual({ ok: true })
  })

  it("PNG válido → ok", () => {
    const data = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]).toString("base64")}`
    expect(validarFoto(data)).toEqual({ ok: true })
  })

  it("SVG (vetor de XSS) → tipo", () => {
    expect(validarFoto("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toEqual({ ok: false, motivo: "tipo" })
  })

  it("mime imagem mas conteúdo arbitrário → tipo (magic bytes)", () => {
    const data = `data:image/jpeg;base64,${Buffer.from("<html>").toString("base64")}`
    expect(validarFoto(data)).toEqual({ ok: false, motivo: "tipo" })
  })

  it("tamanho > 1MB → tamanho", () => {
    const big = Buffer.alloc(MAX_FOTO_BYTES + 10, 0xff)
    const data = `data:image/jpeg;base64,${big.toString("base64")}`
    expect(validarFoto(data)).toEqual({ ok: false, motivo: "tamanho" })
  })
})
