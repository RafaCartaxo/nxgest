import { describe, expect, it } from "vitest"
import { clientIp } from "./clientIp.js"

describe("clientIp (PLAN-068 coordenação PLAN-066)", () => {
  it("prioriza CF-Connecting-IP (Cloudflare) quando presente", () => {
    expect(clientIp({ headers: { "cf-connecting-ip": "200.1.2.3" }, ip: "172.67.0.1" })).toBe("200.1.2.3")
  })

  it("cai para req.ip (trust proxy) sem CF-Connecting-IP", () => {
    expect(clientIp({ headers: {}, ip: "177.1.2.3" })).toBe("177.1.2.3")
  })

  it("sem nada → string vazia (não quebra)", () => {
    expect(clientIp({ headers: {} })).toBe("")
  })
})
