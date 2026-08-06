import { useTranslation } from "react-i18next"
import { MapPin } from "lucide-react"
import { Button } from "../components/Button.js"
import { StatusBadge } from "../components/StatusBadge/StatusBadge.js"

interface CapturaLocalizacaoProps {
  /** Captura em andamento. */
  capturando: boolean
  /** Endereço já tem coordenadas válidas. */
  capturada: boolean
  onCapturar: () => void
  onRecapturar: () => void
  erro?: string | null
}

/**
 * Controle de GPS/localização (PLAN-055). 3 estados:
 * - Capturando: botão desabilitado;
 * - Capturada: badge "Localização capturada" + botão Recapturar;
 * - Não capturada (padrão): botão "Capturar localização" (+ erro se houver).
 * Design final virá do briefing Lovable (Lovable-Cadastro-Rota-NXGestao.md).
 */
export function CapturaLocalizacao({
  capturando,
  capturada,
  onCapturar,
  onRecapturar,
  erro,
}: CapturaLocalizacaoProps) {
  const { t } = useTranslation()

  if (capturando) {
    return (
      <Button type="button" variant="secondary" disabled className="w-full sm:w-auto">
        {t("geo.capturando")}
      </Button>
    )
  }

  if (capturada) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge variant="success" label={t("geo.localizacaoCapturada")} />
        <Button type="button" variant="secondary" onClick={onRecapturar}>
          {t("geo.recapturar")}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="secondary" onClick={onCapturar} className="w-full sm:w-auto">
        <MapPin className="size-4" aria-hidden />
        {t("geo.capturarLocalizacao")}
      </Button>
      {erro && <p className="text-xs text-danger-text">{t(erro)}</p>}
    </div>
  )
}
