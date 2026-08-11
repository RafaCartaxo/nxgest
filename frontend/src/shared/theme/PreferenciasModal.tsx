import { useTranslation } from "react-i18next"
import { Check, Languages, Monitor, Moon, Palette, SunMedium } from "lucide-react"
import { Modal } from "../components/Modal/Modal.js"
import { Button } from "../components/Button.js"
import { SegmentedControl } from "../components/SegmentedControl/SegmentedControl.js"
import { useTheme, type ThemeMode } from "./useTheme.js"
import { THEMES } from "./themes.js"

const SWATCH: Record<string, [string, string]> = {
  default: ["#2763d7", "#1649ae"],
  aurora: ["oklch(0.55 0.22 295)", "oklch(0.46 0.2 295)"],
  ocean: ["oklch(0.55 0.13 215)", "oklch(0.46 0.12 215)"],
  grape: ["oklch(0.5 0.21 305)", "oklch(0.42 0.19 305)"],
  sunset: ["oklch(0.62 0.18 42)", "oklch(0.53 0.17 38)"],
}

const LANGS = [
  { code: "pt-BR", sigla: "PT", nomeKey: "prefs.langPt" },
  { code: "en", sigla: "EN", nomeKey: "prefs.langEn" },
  { code: "es", sigla: "ES", nomeKey: "prefs.langEs" },
]

/** Swatch circular com anel de seleção (port do Lovable — PLAN-069). */
function ThemeSwatch({ nome, ativo, onClick, label }: { nome: string; ativo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex min-h-11 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
        ativo ? "bg-primary-light" : "hover:bg-surface-hover"
      }`}
    >
      <span
        aria-hidden
        className={`grid size-9 place-items-center rounded-full ring-offset-2 ring-offset-card transition-shadow ${ativo ? "ring-2 ring-primary" : ""}`}
        style={{ backgroundImage: `linear-gradient(135deg, ${SWATCH[nome]?.[0]}, ${SWATCH[nome]?.[1]})` }}
      >
        {ativo && <Check className="size-4 text-primary-foreground" />}
      </span>
      <span className={`w-full truncate text-xs font-semibold ${ativo ? "text-primary-text" : "text-text-muted"}`}>{label}</span>
    </button>
  )
}

/** Preferências (tema/claro-escuro-sistema + paletas + idioma) — port do Lovable (PLAN-069). */
export function PreferenciasModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation()
  const { palette, mode, setPalette, setMode } = useTheme()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("prefs.titulo")}
      footer={
        <Button variant="primary" onClick={onClose} className="w-full">
          {t("prefs.concluido")}
        </Button>
      }
    >
      <p className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-medium text-text-secondary">
        <SunMedium className="size-4" aria-hidden />
        {t("prefs.modo")}
      </p>
      <SegmentedControl<ThemeMode>
        value={mode}
        onChange={setMode}
        label={t("prefs.modo")}
        items={[
          { value: "light", label: t("prefs.claro"), icon: <SunMedium className="size-4" aria-hidden /> },
          { value: "dark", label: t("prefs.escuro"), icon: <Moon className="size-4" aria-hidden /> },
          { value: "system", label: t("prefs.sistema"), icon: <Monitor className="size-4" aria-hidden /> },
        ]}
      />

      <p className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-medium text-text-secondary">
        <Palette className="size-4" aria-hidden />
        {t("prefs.cor")}
      </p>
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        {THEMES.map((th) => (
          <ThemeSwatch key={th.id} nome={th.id} ativo={palette === th.id} onClick={() => setPalette(th.id)} label={t(th.labelKey)} />
        ))}
      </div>

      <p className="mt-5 mb-2 flex items-center gap-1.5 text-sm font-medium text-text-secondary">
        <Languages className="size-4" aria-hidden />
        {t("prefs.idioma")}
      </p>
      <div className="space-y-2">
        {LANGS.map((l) => {
          const ativo = i18n.language === l.code
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => i18n.changeLanguage(l.code)}
              aria-pressed={ativo}
              className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 text-left text-sm font-medium transition-colors active:scale-[0.99] ${
                ativo ? "border-primary bg-primary-light text-primary-text" : "border-border-strong bg-surface hover:bg-surface-hover"
              }`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">{l.sigla}</span>
              <span className="min-w-0 flex-1 truncate">{t(l.nomeKey)}</span>
              {ativo && <Check className="size-4 shrink-0" aria-hidden />}
            </button>
          )
        })}
      </div>
    </Modal>
  )
}
