// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import { LoginPage } from "./LoginPage.js"

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }))

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
vi.mock("../../../shared/auth/AuthContext.js", () => ({
  useAuth: () => ({ login: loginMock, user: null, token: null, logout: vi.fn(), loading: false, refreshUser: vi.fn() }),
}))
// LoginPage importa ApiError de api/client (que puxa o i18n real) — mockamos para isolar.
vi.mock("../../../api/client.js", () => ({
  ApiError: class ApiError extends Error {
    status: number
    code: string
    constructor(status: number, code: string, message: string) {
      super(message)
      this.status = status
      this.code = code
    }
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  )
}

describe("LoginPage (P022 — destrava testes de UI)", () => {
  beforeEach(() => loginMock.mockReset())

  it("renderiza e-mail, senha e botão Entrar", () => {
    const { container } = renderLogin()
    expect(container.querySelector('input[type="email"]')).not.toBeNull()
    expect(container.querySelector('input[type="password"]')).not.toBeNull()
    expect(screen.getByRole("button", { name: "auth.entrar" })).toBeInTheDocument()
  })

  it("toggle mostra/oculta a senha (UC-041)", async () => {
    const user = userEvent.setup()
    const { container } = renderLogin()
    const senha = container.querySelector('input[type="password"]')!
    expect(senha).toHaveAttribute("type", "password")
    await user.click(screen.getByRole("button", { name: "auth.mostrarSenha" }))
    expect(container.querySelector('input[type="password"]')).toBeNull()
    expect(container.querySelector('input[type="text"]')).not.toBeNull()
  })

  it("submit chama login com as credenciais", async () => {
    const user = userEvent.setup()
    loginMock.mockResolvedValue({ token: "t", usuario: { role: "operator", id: "u1", nome: "A", email: "ana@x.com" } })
    const { container } = renderLogin()
    await user.type(container.querySelector('input[type="email"]')!, "ana@x.com")
    await user.type(container.querySelector('input[type="password"]')!, "123456")
    await user.click(screen.getByRole("button", { name: "auth.entrar" }))
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith("ana@x.com", "123456"))
  })
})
