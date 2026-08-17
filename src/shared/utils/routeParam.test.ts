import type { Request } from "express"
import { describe, expect, it } from "vitest"
import { getParam } from "./routeParam.js"

function makeRequest(params: Record<string, string | string[]>): Request {
  return { params } as unknown as Request
}

describe("getParam", () => {
  it("retorna o param quando é string", () => {
    expect(getParam(makeRequest({ id: "abc-123" }), "id")).toBe("abc-123")
  })

  it("lança TypeError quando o param não existe", () => {
    expect(() => getParam(makeRequest({}), "id")).toThrow(TypeError)
    expect(() => getParam(makeRequest({}), "id")).toThrow(/não é string/)
  })

  it("lança TypeError quando o param é array (Express 5: string | string[])", () => {
    expect(() => getParam(makeRequest({ id: ["a", "b"] }), "id")).toThrow(TypeError)
    expect(() => getParam(makeRequest({ id: ["a", "b"] }), "id")).toThrow(/não é string/)
  })
})
