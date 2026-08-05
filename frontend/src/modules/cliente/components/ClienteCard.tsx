import { useTranslation } from "react-i18next"
import { Phone, Store, MapPin } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { maskCpf, maskPhone } from "../../../shared/utils/masks.js"
import type { Cliente } from "../services/cliente.service.js"

interface ClienteCardProps {
  cliente: Cliente
  variant: "list-item" | "detail"
}

function iniciais(nome: string): string {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function montarEndereco(endereco: Cliente["endereco"]): string {
  const rua = [endereco.logradouro, endereco.numero, endereco.complemento, endereco.bairro]
    .filter(Boolean)
    .join(", ")
  const cidade = [endereco.cidade, endereco.estado].filter(Boolean).join(" - ")
  return [rua, cidade].filter(Boolean).join(" — ")
}

function ClienteCard({ cliente, variant }: ClienteCardProps) {
  const { t } = useTranslation()

  if (variant === "list-item") {
    return (
      <Card.Root variant="list-item">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-light text-sm font-semibold text-primary-text">
            {iniciais(cliente.nome)}
          </span>
          <Card.Body>
            <Card.Title className="mb-0.5">{cliente.nome}</Card.Title>
            {cliente.comercio && (
              <p className="flex items-center gap-1 text-sm text-text-secondary">
                <Store className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                {cliente.comercio}
              </p>
            )}
            <p className="flex items-center gap-1 text-sm text-text-secondary">
              <Phone className="size-3.5 shrink-0 text-text-muted" aria-hidden />
              {maskPhone(cliente.telefone)}
            </p>
            {cliente.telefoneComercio && (
              <p className="flex items-center gap-1 text-sm text-text-secondary">
                <Phone className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                {maskPhone(cliente.telefoneComercio)}
              </p>
            )}
            {cliente.endereco.cidade && (
              <p className="flex items-center gap-1 text-sm text-text-secondary">
                <MapPin className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                {cliente.endereco.cidade}
                {cliente.endereco.estado ? ` - ${cliente.endereco.estado}` : ""}
              </p>
            )}
          </Card.Body>
        </div>
      </Card.Root>
    )
  }

  return (
    <Card.Root variant="detail">
      <Card.Header>
        <Card.Title className="text-lg font-semibold">
          {t("cliente.dadosCliente")}
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="flex items-start gap-3">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-primary-light text-lg font-semibold text-primary-text">
            {iniciais(cliente.nome)}
          </span>
          <div className="min-w-0 space-y-1">
            {cliente.comercio && (
              <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Store className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                {cliente.comercio}
              </p>
            )}
            {cliente.cpf && (
              <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                <span className="text-text-muted">{t("cliente.cpf")}:</span> {maskCpf(cliente.cpf)}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-sm text-text-secondary">
              <Phone className="size-3.5 shrink-0 text-text-muted" aria-hidden />
              {maskPhone(cliente.telefone)}
            </p>
            {cliente.telefoneComercio && (
              <p className="flex items-center gap-1.5 text-sm text-text-secondary">
                <Phone className="size-3.5 shrink-0 text-text-muted" aria-hidden />
                {maskPhone(cliente.telefoneComercio)}
              </p>
            )}
            {cliente.enderecoComercio?.logradouro && (
              <p className="flex items-start gap-1.5 text-sm text-text-secondary">
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
                <span className="min-w-0">
                  {[cliente.enderecoComercio.logradouro, cliente.enderecoComercio.numero, cliente.enderecoComercio.bairro]
                    .filter(Boolean).join(", ")}
                  {" — "}
                  {[cliente.enderecoComercio.cidade, cliente.enderecoComercio.estado].filter(Boolean).join(" - ")}
                </span>
              </p>
            )}
            <p className="flex items-start gap-1.5 text-sm text-text-secondary">
              <MapPin className="mt-0.5 size-3.5 shrink-0 text-text-muted" aria-hidden />
              <span className="min-w-0">{montarEndereco(cliente.endereco)}</span>
            </p>
          </div>
        </div>
      </Card.Body>
    </Card.Root>
  )
}

export { ClienteCard, type ClienteCardProps }
