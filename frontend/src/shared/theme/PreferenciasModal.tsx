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

/** Mini-mock da UI que reflete a paleta/modo GLOBAIS (o ThemeProvider aplica na hora — PLAN-069). */
function PreviewAoVivo() {
  const { t } = useTranslation()
  return (
    <div className="rounded-xl border border-border bg-gradient-page p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-muted">{t("prefs.preview")}</p>
      <div className="rounded-xl border border-border bg-card p-3">
        <p className="font-display truncate text-[15px] font-semibold">{t("prefs.previewTitulo")}</p>
        <div className="mt-2.5 flex items-end gap-2">
          <div className="relative min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface p-2.5 pl-3">
            <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-success" />
            <p className="truncate text-[11px] text-text-muted">{t("prefs.previewKpi")}</p>
            <p className="font-display truncate text-sm font-semibold tabular-nums">R$ 4.820,50</p>
          </div>
          <span
            className="inline-flex min-h-9 shrink-0 items-center rounded-lg px-3 text-xs font-semibold text-primary-foreground"
            style={{ backgroundImage: "linear-gradient(135deg, var(--brand-1), var(--brand-2))" }}
          >
            {t("prefs.previewBotao")}
          </span>
        </div>
      </div>
    </div>
  )
}

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
      <PreviewAoVivo />

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
