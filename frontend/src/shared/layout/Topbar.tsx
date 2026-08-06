import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Settings } from "lucide-react"
import { PreferenciasModal } from "../theme/PreferenciasModal.js"

const locales = [
  { code: "pt-BR", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
]

interface TopbarProps {
  className?: string
}

export function Topbar({ className = "" }: TopbarProps) {
  const { t, i18n } = useTranslation()
  const [aberto, setAberto] = useState(false)
  const currentLang = locales.find((l) => l.code === i18n.language)?.label ?? "PT"

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-label={t("nav.configuracoes")}
        className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 text-sidebar-foreground transition-colors hover:bg-surface-hover"
      >
        <Settings className="size-4 shrink-0" />
        <span className="hidden text-xs font-medium text-sidebar-muted sm:inline">{currentLang}</span>
      </button>
      <PreferenciasModal open={aberto} onClose={() => setAberto(false)} />
    </div>
  )
}
