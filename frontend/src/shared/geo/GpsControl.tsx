import { useTranslation } from "react-i18next"
import { MapPin, LocateFixed, AlertTriangle } from "lucide-react"
import { Button } from "../components/Button.js"
import { StatusBadge } from "../components/StatusBadge/StatusBadge.js"
import { formatarCoords } from "./maps.js"
import type { Localizacao } from "./types.js"

export type GpsEstado = "vazio" | "capturada" | "invalidada"

interface GpsControlProps {
  coords: Localizacao | null
  estado: GpsEstado
  capturando?: boolean
  /** Mensagem de erro já traduzida (permissão/indisponível). */
  erro?: string | null
  /** Aviso já traduzido (ex.: geocode sem endereço). */
  aviso?: string | null
  onCapturar: () => void
  className?: string
}

/**
 * Controle de GPS de um endereço (PLAN-056, port do `gps.tsx` do Lovable).
 * Componente **controlado**: o formulário decide o estado e dispara `onCapturar`.
 * 3 estados: vazio / capturada (badge + coords + Recapturar) / invalidada (texto editado).
 */
export function GpsControl({
  coords,
  estado,
  capturando = false,
  erro,
  aviso,
  onCapturar,
  className = "",
}: GpsControlProps) {
  const { t } = useTranslation()
  const capturada = estado === "capturada" && coords != null

  return (
    <div
      role="group"
      aria-label={t("gps.capturar")}
      className={`rounded-xl border border-border bg-surface p-3 ${
        capturada ? "border-success bg-success-light" : ""
      } ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div aria-live="polite" className="min-w-0">
          {capturada ? (
            <>
              <StatusBadge variant="success" label={t("gps.capturada")} />
              <p className="tabular mt-1.5 text-xs text-text-secondary">{formatarCoords(coords)}</p>
            </>
          ) : (
            <>
              <StatusBadge variant="neutral" label={t("gps.naoCapturada")} />
              {estado === "invalidada" && (
                <p className="mt-1.5 text-xs text-text-secondary">{t("gps.descartada")}</p>
              )}
            </>
          )}
        </div>

        {capturada ? (
          <Button type="button" variant="ghost" size="sm" disabled={capturando} onClick={onCapturar}>
            <LocateFixed className="size-4" aria-hidden />
            {t("gps.recapturar")}
          </Button>
        ) : (
          <Button type="button" variant="soft" size="sm" disabled={capturando} onClick={onCapturar}>
            <MapPin className="size-4" aria-hidden />
            {t("gps.capturar")}
          </Button>
        )}
      </div>

      {capturando && (
        <div className="mt-3 h-1 animate-pulse rounded-full bg-primary-light" aria-hidden />
      )}

      {erro && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-danger-text">
          <AlertTriangle className="size-3.5" aria-hidden />
          {erro}
        </p>
      )}
      {!erro && aviso && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-warning-text">
          <AlertTriangle className="size-3.5" aria-hidden />
          {aviso}
        </p>
      )}
    </div>
  )
}
