import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ChevronLeft, ChevronRight, Navigation, MessageCircle, Phone } from "lucide-react"
import { useParams, Link } from "react-router-dom"
import { getCliente, type Cliente } from "../services/cliente.service.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { hasModule } from "../../../shared/modules/modules.js"
import { ApiError } from "../../../api/client.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { ButtonLink } from "../../../shared/components/Button.js"
import { QuickActions } from "../../../shared/components/QuickActions/QuickActions.js"
import { ClienteInfo } from "../components/ClienteInfo.js"
import { SaldoInfo } from "../components/SaldoInfo.js"
import { unmask, formatCurrency } from "../../../shared/utils/masks.js"
import { buildMapsUrl } from "../../../shared/utils/maps.js"

export function ClienteDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const contratosAtivo = hasModule(user?.modulos, "contratos")
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      const result = await getCliente(id)
      setCliente(result)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(t("cliente.erroCarregar"))
      }
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetch()
  }, [fetch])

  function handleWhatsApp(c: Cliente) {
    const tel = unmask(c.telefone)
    const msg = encodeURIComponent(
      t("operacoes.whatsappTemplate", { nome: c.nome, valor: formatCurrency(c.saldoDevedor ?? 0) })
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank")
  }

  function handleLigar(c: Cliente) {
    window.location.href = `tel:+55${unmask(c.telefone)}`
  }

  function getMapsTarget(c: Cliente) {
    const endCom = c.enderecoComercio
    return {
      clienteLat: c.localizacaoComercio?.lat ?? null,
      clienteLng: c.localizacaoComercio?.lng ?? null,
      clienteLogradouro: endCom?.logradouro ?? c.endereco.logradouro,
      clienteNumero: endCom?.numero ?? c.endereco.numero ?? null,
      clienteBairro: endCom?.bairro ?? c.endereco.bairro ?? null,
      clienteCidade: endCom?.cidade ?? c.endereco.cidade ?? null,
      clienteEstado: endCom?.estado ?? c.endereco.estado ?? null,
    }
  }

  function handleNavegar(c: Cliente) {
    const url = buildMapsUrl(getMapsTarget(c))
    if (url) window.open(url, "_blank")
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <EstadoTela
        loading={loading}
        error={error}
        empty={!cliente}
        emptyMessage={t("cliente.naoEncontrado")}
        onRetry={fetch}
      >
          {cliente && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Link to="/clientes" className="text-text-muted hover:text-text-primary">
            <ChevronLeft className="h-5 w-5" />
              </Link>
              <h1 className="flex-1 text-3xl font-semibold">{cliente.nome}</h1>
              <ButtonLink to={`/clientes/${cliente.id}/editar`}>
                {t("common.edit")}
              </ButtonLink>
            </div>
            <ClienteInfo cliente={cliente} />
            <QuickActions
              layout="vertical"
              actions={[
                { icon: Navigation,    label: t("operacoes.navegar"),  onClick: () => handleNavegar(cliente),  variant: "blue", show: !!buildMapsUrl(getMapsTarget(cliente)) },
                { icon: MessageCircle, label: t("operacoes.whatsapp"), onClick: () => handleWhatsApp(cliente), variant: "green" },
                { icon: Phone,         label: t("operacoes.ligar"),    onClick: () => handleLigar(cliente),    variant: "blue" },
              ]}
            />
            {contratosAtivo && (
              <Card.Root variant="detail">
                <Card.Header>
                  <Card.Title className="text-lg font-semibold">{t("cliente.contratos")}</Card.Title>
                </Card.Header>
                <Card.Body>
                  <p className="text-3xl font-bold text-center">
                    {cliente.totalContratos ?? 0}
                  </p>
                  <div className="mt-3 flex justify-center gap-2">
                    <Link
                      to={`/contratos?clienteId=${cliente.id}`}
                      className="inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {t("cliente.verContratos")} <ChevronRight className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/contratos/novo?clienteId=${cliente.id}`}
                      className="inline-flex items-center gap-0.5 text-sm font-medium text-blue-600 hover:underline"
                    >
                      {t("cliente.novoContrato")} <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </Card.Body>
              </Card.Root>
            )}
            <SaldoInfo saldoDevedor={cliente.saldoDevedor ?? 0} />
          </div>
        )}
      </EstadoTela>
    </div>
  )
}
