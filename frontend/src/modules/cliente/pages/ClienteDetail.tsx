import { useState, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { ChevronRight, Plus, Pencil, Navigation, MessageCircle, Phone, User } from "lucide-react"
import { useParams, useNavigate } from "react-router-dom"
import { getCliente, type Cliente } from "../services/cliente.service.js"
import { useAuth } from "../../../shared/auth/AuthContext.js"
import { hasModule } from "../../../shared/modules/modules.js"
import { ApiError } from "../../../api/client.js"
import { Card } from "../../../shared/components/Card/Card.js"
import { EstadoTela } from "../../../shared/components/EstadoTela.js"
import { ButtonLink } from "../../../shared/components/Button.js"
import { PageHeader } from "../../../shared/components/PageHeader/PageHeader.js"
import { QuickActions } from "../../../shared/components/QuickActions/QuickActions.js"
import { ClienteInfo } from "../components/ClienteInfo.js"
import { SituacaoFinanceira } from "../components/SituacaoFinanceira.js"
import { AnexosSection } from "../components/AnexosSection.js"
import { unmask, formatCurrency } from "../../../shared/utils/masks.js"
import { buildMapsUrl, resolveAlvoCliente, alvoNavegavel } from "../../../shared/geo/alvo.js"

export function ClienteDetail() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
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

  function handleNavegar(c: Cliente) {
    const url = buildMapsUrl(resolveAlvoCliente(c))
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
            <PageHeader
              icon={User}
              title={cliente.nome}
              back={{ onClick: () => navigate("/clientes"), title: t("common.back") }}
              action={<ButtonLink to={`/clientes/${cliente.id}/editar`} variant="primary" size="sm"><Pencil className="size-4" /> {t("common.edit")}</ButtonLink>}
            />
            <ClienteInfo cliente={cliente} />
            <QuickActions
              layout="grid"
              actions={[
                { icon: Navigation,    label: t("operacoes.navegar"),  onClick: () => handleNavegar(cliente),  variant: "blue", show: alvoNavegavel(resolveAlvoCliente(cliente)) },
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
                    <ButtonLink to={`/contratos?clienteId=${cliente.id}`} variant="soft" size="sm">
                      <ChevronRight className="size-4" /> {t("cliente.verContratos")}
                    </ButtonLink>
                    <ButtonLink to={`/contratos/novo?clienteId=${cliente.id}`} variant="soft" size="sm">
                      <Plus className="size-4" /> {t("cliente.novoContrato")}
                    </ButtonLink>
                  </div>
                </Card.Body>
              </Card.Root>
            )}
            <SituacaoFinanceira cliente={cliente} />
            <AnexosSection clienteId={cliente.id} />
          </div>
        )}
      </EstadoTela>
    </div>
  )
}
