import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { CobrancaCard } from "./CobrancaCard.js"
import { unmask, formatCurrency } from "../../../shared/utils/masks.js"
import { calcularDistancia } from "../../../shared/utils/distance.js"
import { buildMapsUrl } from "../../../shared/utils/maps.js"
import { ResultadoOperacional, type CobrancaItem } from "../services/operacoes.service.js"

interface CobrancaListProps {
  items: CobrancaItem[]
  operadorLat?: number | null
  operadorLng?: number | null
  onCardClick?: (item: CobrancaItem) => void
  emptyMessageKey?: string
}

export function CobrancaList({ items, operadorLat, operadorLng, onCardClick, emptyMessageKey }: CobrancaListProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border p-8 text-center text-sm text-text-muted">
        {t(emptyMessageKey ?? "operacoes.nenhumaCobranca")}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <CobrancaCard
          key={`${item.clienteId}-${item.contratoId}`}
          variant="compact"
          clienteNome={item.clienteNome}
          totalPendente={item.totalPendente}
          quantidadeParcelas={item.quantidadeParcelas}
          situacao={item.situacao}
          resultadoOperacional={item.resultadoOperacional}
          distancia={calcularDistanciaParaItem(item)}
          onCardClick={() => onCardClick?.(item)}
          onNavigate={() => handleNavegar(item)}
          onWhatsApp={() => handleWhatsApp(item)}
          onLigar={() => handleLigar(item)}
          onAbrir={() => handleAbrirContrato(item)}
        />
      ))}
    </div>
  )

  function calcularDistanciaParaItem(item: CobrancaItem): number | null {
    return operadorLat && operadorLng && item.clienteLat && item.clienteLng
      ? calcularDistancia(operadorLat, operadorLng, item.clienteLat, item.clienteLng)
      : null
  }

  function handleWhatsApp(item: CobrancaItem) {
    const tel = unmask(item.clienteTelefone)
    const msg = encodeURIComponent(
      t("operacoes.whatsappTemplate", { nome: item.clienteNome, valor: formatCurrency(item.totalPendente) })
    )
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank")
  }

  function handleLigar(item: CobrancaItem) {
    window.location.href = `tel:+55${unmask(item.clienteTelefone)}`
  }

  function handleAbrirContrato(item: CobrancaItem) {
    navigate(`/contratos/${item.contratoId}`)
  }

  function handleNavegar(item: CobrancaItem) {
    const url = buildMapsUrl(item)
    if (url) window.open(url, "_blank")
  }
}
