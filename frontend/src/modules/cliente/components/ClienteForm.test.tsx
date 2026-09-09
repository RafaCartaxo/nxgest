// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FeedbackProvider } from "../../../shared/feedback/FeedbackProvider.js"
import { ClienteForm } from "./ClienteForm.js"

vi.mock("react-i18next", () => ({ useTranslation: () => ({ t: (k: string) => k }) }))
// ClienteForm importa ApiError de api/client (que puxa o i18n real) — mockamos para isolar.
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
// masks.js importa i18n/config (inicializa i18next real com initReactI18next) — stub para isolar.
vi.mock("../../../i18n/config.js", () => ({ default: { language: "pt-BR" } }))

const clienteComLocalizacao = {
  id: "cli-1",
  nome: "Maria Silva",
  telefone: "83988887777",
  comercio: "Padaria Central",
  endereco: { logradouro: "Rua das Flores", numero: "100", bairro: "Centro", cidade: "João Pessoa", estado: "PB" },
  enderecoComercio: { logradouro: "Av. Principal", numero: "10", bairro: "Bairro", cidade: "JP", estado: "PB" },
  localizacao: { lat: -7.11, lng: -34.86 },
  localizacaoComercio: null,
  createdAt: "2026-08-01T12:00:00.000Z",
  updatedAt: "2026-08-01T12:00:00.000Z",
}

function renderForm() {
  return render(
    <FeedbackProvider>
      <ClienteForm initial={clienteComLocalizacao} onSubmit={vi.fn()} onCancel={vi.fn()} />
    </FeedbackProvider>,
  )
}

describe("ClienteForm — regressão do teclado/foco ao editar endereço (fix 12/08)", () => {
  it("editar o logradouro invalida a localização E mantém o foco no campo editado", async () => {
    const user = userEvent.setup()
    renderForm()

    const logradouro = screen.getByDisplayValue("Rua das Flores") as HTMLInputElement
    expect(logradouro).toHaveValue("Rua das Flores")

    await user.clear(logradouro)
    await user.type(logradouro, "Rua Nova")

    expect(logradouro).toHaveFocus()
    expect(logradouro).toHaveValue("Rua Nova")
    // Localização descartada: o GpsControl do bloco principal exibe o aviso.
    expect(screen.getByText("gps.descartada")).toBeInTheDocument()
    expect(screen.queryByText("gps.capturada")).not.toBeInTheDocument()
  })

  it("editar o logradouro do comércio mantém o foco (sem coords salvas → sem aviso de descarte)", async () => {
    const user = userEvent.setup()
    renderForm()

    const logradouroComercio = screen.getByDisplayValue("Av. Principal") as HTMLInputElement
    expect(logradouroComercio).toHaveValue("Av. Principal")

    await user.clear(logradouroComercio)
    await user.type(logradouroComercio, "Av. Nova")

    expect(logradouroComercio).toHaveFocus()
    expect(logradouroComercio).toHaveValue("Av. Nova")
    // Comércio não tem coords salvas (localizacaoComercio: null) → editar não descarta nada.
    expect(screen.queryByText("gps.descartada")).not.toBeInTheDocument()
  })

  it("editar o número (principal) mantém a localização capturada (fix 13/08)", async () => {
    const user = userEvent.setup()
    renderForm()

    const numero = screen.getByDisplayValue("100") as HTMLInputElement
    expect(numero).toHaveValue("100")

    await user.clear(numero)
    await user.type(numero, "250")

    expect(numero).toHaveValue("250")
    // Número não descarta coords: badge "capturada" do principal permanece, sem aviso de descarte.
    expect(screen.getByText("gps.capturada")).toBeInTheDocument()
    expect(screen.queryByText("gps.descartada")).not.toBeInTheDocument()
  })

  it("editar o número do comércio mantém a localização capturada (fix 13/08)", async () => {
    const user = userEvent.setup()
    render(
      <FeedbackProvider>
        <ClienteForm
          initial={{ ...clienteComLocalizacao, localizacaoComercio: { lat: -7.12, lng: -34.87 } }}
          onSubmit={vi.fn()}
          onCancel={vi.fn()}
        />
      </FeedbackProvider>,
    )

    const numeroComercio = screen.getByDisplayValue("10") as HTMLInputElement
    expect(numeroComercio).toHaveValue("10")

    await user.clear(numeroComercio)
    await user.type(numeroComercio, "320")

    expect(numeroComercio).toHaveValue("320")
    // Comércio + principal capturados → 2 badges "capturada"; sem descarte.
    expect(screen.getAllByText("gps.capturada")).toHaveLength(2)
    expect(screen.queryByText("gps.descartada")).not.toBeInTheDocument()
  })
})

describe("ClienteForm — foco no campo com erro ao salvar (NXG-026)", () => {
  function renderCreate() {
    const onSubmit = vi.fn()
    render(
      <FeedbackProvider>
        <ClienteForm onSubmit={onSubmit} onCancel={vi.fn()} />
      </FeedbackProvider>,
    )
    return onSubmit
  }

  function campo(name: string): HTMLInputElement {
    return document.querySelector(`input[name="${name}"]`) as HTMLInputElement
  }

  async function preencherObrigatoriosValidos(user: ReturnType<typeof userEvent.setup>) {
    // telefone/comercio usam o mesmo placeholder → seletor por name
    await user.type(campo("nome"), "Maria Silva")
    await user.type(campo("telefone"), "83988887777")
    await user.type(campo("comercio"), "Padaria")
  }

  it("CPF inválido → foco vai para o campo CPF e onSubmit não é chamado", async () => {
    const user = userEvent.setup()
    const onSubmit = renderCreate()
    await preencherObrigatoriosValidos(user)

    const cpf = campo("cpf")
    await user.type(cpf, "11111111111")
    expect(cpf).toHaveValue("111.111.111-11")

    await user.click(screen.getByRole("button", { name: "common.save" }))

    await waitFor(() => expect(document.activeElement).toBe(cpf))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText("cliente.validacao.cpfInvalido")).toBeInTheDocument()
  })

  it("Telefone inválido → foco vai para o campo telefone", async () => {
    const user = userEvent.setup()
    const onSubmit = renderCreate()

    await user.type(campo("nome"), "Maria Silva")
    await user.type(campo("telefone"), "123")
    await user.type(campo("comercio"), "Padaria")

    await user.click(screen.getByRole("button", { name: "common.save" }))

    const telefone = campo("telefone")
    await waitFor(() => expect(document.activeElement).toBe(telefone))
    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText("cliente.validacao.telefoneInvalido")).toBeInTheDocument()
  })
})
