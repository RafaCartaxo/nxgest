import { useTranslation } from "react-i18next"
import { Navigation, MessageCircle, Phone, FileText } from "lucide-react"
import { Card } from "../../../shared/components/Card/Card.js"
import { StatusBadge } from "../../../shared/components/StatusBadge/StatusBadge.js"
import { formatCurrency } from "../../../shared/utils/masks.js"
import { ResultadoOperacional } from "../../operacoes/services/operacoes.service.js"

interface CobrancaCardProps {
  clienteNome: string
  totalPendente: number
  quantidadeParcelas: number
  situacao: string
  resultadoOperacional?: string
  distancia?: number | null
  variant: "compact" | "detail"
  onCardClick?: () => void
  onNavigate?: () => void
  onWhatsApp?: () => void
  onLigar?: () => void
  onAbrir?: () => void
}

function CobrancaCard({
  clienteNome,
  totalPendente,
  quantidadeParcelas,
  situacao,
  resultadoOperacional = ResultadoOperacional.PENDENTE,
  distancia,
  variant,
  onCardClick,
  onNavigate,
  onWhatsApp,
  onLigar,
  onAbrir,
}: CobrancaCardProps) {
  const { t } = useTranslation()

  const situacaoLabel = situacao === "atrasado" ? t("status.atrasado") : t("status.venceHoje")
  const situacaoVariant = situacao === "atrasado" ? "danger" : "info"

  const resultadoVariant = resultadoOperacional === ResultadoOperacional.VISITADO ? "neutral"
    : resultadoOperacional === ResultadoOperacional.NAO_ENCONTRADO ? "warning"
    : "info"

  const resultadoLabelKey = resultadoOperacional === ResultadoOperacional.VISITADO ? "operacoes.resultado.visitado"
    : resultadoOperacional === ResultadoOperacional.NAO_ENCONTRADO ? "operacoes.resultado.naoEncontrado"
    : resultadoOperacional === ResultadoOperacional.PROMESSA ? "operacoes.resultado.promessa"
    : ""

  if (variant === "compact") {
    return (
      <Card.Root variant="collection" tone={situacao === "atrasado" ? "danger" : "info"} className="p-4">
        <div className="flex items-start gap-4">
          <Card.Dot color={situacao === "atrasado" ? "red" : "blue"} size="md" />
          <Card.Body>
            <div
              onClick={onCardClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && onCardClick) { e.preventDefault(); onCardClick() } }}
              className={`${onCardClick ? "cursor-pointer" : ""}`}
            >
              <Card.Header className="justify-between">
                <Card.Title className="truncate text-text-primary">{clienteNome}</Card.Title>
                {resultadoOperacional !== ResultadoOperacional.PENDENTE && (
                  <Card.Badge variant={resultadoVariant} label={t(resultadoLabelKey)} />
                )}
              </Card.Header>
              <p className="mt-1 text-2xl font-bold text-text-primary">
                R$ {formatCurrency(totalPendente)}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                {quantidadeParcelas} {t("operacoes.parcelas")}
                {distancia != null && <span> &middot; ~{distancia} {t("operacoes.distancia")}</span>}
              </p>
              <StatusBadge
                variant={situacaoVariant}
                label={situacaoLabel}
                size="md"
                className="mt-2 mb-3"
              />
            </div>
            <Card.Actions
              layout="horizontal"
              size="md"
              actions={[
                { icon: Navigation, label: t("operacoes.navegar"), onClick: () => onNavigate?.(), variant: "blue", show: !!onNavigate },
                { icon: MessageCircle, label: t("operacoes.whatsapp"), onClick: () => onWhatsApp?.(), variant: "green" },
                { icon: Phone, label: t("operacoes.ligar"), onClick: () => onLigar?.(), variant: "blue" },
                { icon: FileText, label: t("operacoes.abrir"), onClick: () => onAbrir?.(), variant: "gray" },
              ]}
            />
          </Card.Body>
        </div>
      </Card.Root>
    )
  }

  return (
    <div className={`border-b border-border-light border-l-4 p-6 ${situacao === "atrasado" ? "border-l-danger" : "border-l-info"}`}>
      <div className="flex items-start gap-4">
        <Card.Dot color={situacao === "atrasado" ? "red" : "blue"} size="md" />
        <Card.Body>
          <Card.Header className="justify-between">
            <Card.Title className="text-xl font-bold text-text-primary">{clienteNome}</Card.Title>
            {resultadoOperacional !== ResultadoOperacional.PENDENTE && (
              <Card.Badge variant={resultadoVariant} label={t(resultadoLabelKey)} />
            )}
          </Card.Header>
          <p className="mt-1 text-2xl font-bold text-text-primary">
            R$ {formatCurrency(totalPendente)}
          </p>
          <p className="mt-1 text-sm text-text-secondary">
            {quantidadeParcelas} {t("operacoes.parcelas")}
            {distancia != null && <span> &middot; ~{distancia} {t("operacoes.distancia")}</span>}
          </p>
          <StatusBadge
            variant={situacaoVariant}
            label={situacaoLabel}
            size="md"
            className="mt-2"
          />
        </Card.Body>
      </div>
    </div>
  )
}

export { CobrancaCard, type CobrancaCardProps }
