import { describe, expect, it, afterEach } from "vitest"
import { envNumber } from "./env.js"

const envBackup = { ...process.env }

afterEach(() => {
  process.env = { ...envBackup }
})

describe("envNumber (proteção contra string vazia → 0)", () => {
  it("ausente → fallback", () => {
    delete process.env.TEST_NUM
    expect(envNumber("TEST_NUM", 10)).toBe(10)
  })

  it("string vazia (compose sem chave no .env) → fallback — o bug do login", () => {
    process.env.TEST_NUM = ""
    expect(envNumber("TEST_NUM", 10)).toBe(10)
    expect(Number(process.env.TEST_NUM ?? 10)).toBe(0) // prova do bug antigo
  })

  it("número válido → valor", () => {
    process.env.TEST_NUM = "600"
    expect(envNumber("TEST_NUM", 10)).toBe(600)
  })

  it("não numérico → fallback", () => {
    process.env.TEST_NUM = "abc"
    expect(envNumber("TEST_NUM", 10)).toBe(10)
  })
})
