import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Modal } from "../components/Modal/Modal.js"
import { Button } from "../components/Button.js"
import { Tabs } from "../components/Tabs/Tabs.js"
import { useTheme, type ThemeMode } from "./useTheme.js"
import { THEMES } from "./themes.js"

const SWATCHES: Record<string, string> = {
  default: "linear-gradient(135deg,#2563EB,#7C3AED)",
  aurora: "linear-gradient(135deg,#4F46E5,#DB2777)",
  ocean: "linear-gradient(135deg,#0EA5E9,#14B8A6)",
  grape: "linear-gradient(135deg,#7C3AED,#C026D3)",
  sunset: "linear-gradient(135deg,#F97316,#EC4899)",
}

const locales = [
  { code: "pt-BR", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
]

interface PreferenciasModalProps {
  open: boolean
  onClose: () => void
}

/** Preferências do app (tema/claro-escuro-sistema + paletas + idioma) — port do Lovable. */
export function PreferenciasModal({ open, onClose }: PreferenciasModalProps) {
  const { t, i18n } = useTranslation()
  const { palette, mode, setPalette, setMode } = useTheme()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("prefs.titulo")}
      footer={
        <Button variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      }
    >
      <p className="mb-2 text-sm font-medium text-text-secondary">{t("prefs.modo")}</p>
      <Tabs
        value={mode}
        onChange={(m) => setMode(m as ThemeMode)}
        items={[
          { value: "light", label: t("prefs.claro") },
          { value: "dark", label: t("prefs.escuro") },
          { value: "system", label: t("prefs.sistema") },
        ]}
      />

      <p className="mb-2 mt-5 text-sm font-medium text-text-secondary">{t("prefs.cor")}</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {THEMES.map((th) => (
          <button
            key={th.id}
            type="button"
            onClick={() => setPalette(th.id)}
            aria-pressed={palette === th.id}
            className={`flex min-h-11 items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors ${
              palette === th.id
                ? "border-primary bg-primary-light text-primary-text"
                : "border-border-strong bg-surface hover:bg-surface-hover"
            }`}
          >
            <span
              aria-hidden
              className="size-6 shrink-0 rounded-full"
              style={{ backgroundImage: SWATCHES[th.id] }}
            />
            <span className="min-w-0 flex-1 truncate">{t(th.labelKey)}</span>
            {palette === th.id && <Check className="size-4 shrink-0" aria-hidden />}
          </button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-sm font-medium text-text-secondary">{t("prefs.idioma")}</p>
      <div className="grid grid-cols-3 gap-2">
        {locales.map((loc) => (
          <button
            key={loc.code}
            type="button"
            onClick={() => i18n.changeLanguage(loc.code)}
            aria-pressed={i18n.language === loc.code}
            className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
              i18n.language === loc.code
                ? "border-primary bg-primary-light text-primary-text"
                : "border-border-strong bg-surface hover:bg-surface-hover"
            }`}
          >
            {loc.label}
            {i18n.language === loc.code && <Check className="size-4" aria-hidden />}
          </button>
        ))}
      </div>
    </Modal>
  )
}
