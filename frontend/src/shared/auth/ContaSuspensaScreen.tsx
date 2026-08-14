import { useTranslation } from "react-i18next"
import { Ban, LogOut, AlertTriangle } from "lucide-react"
import { Logo } from "../components/Logo.js"
import { Button } from "../components/Button.js"
import { useAuth } from "./AuthContext.js"

/**
 * Bloqueio de conta suspensa (PLAN-075 F6): substitui o conteúdo do
 * `ProtectedRoute` quando `user.status === "suspenso"`. A sessão é MANITIDA
 * (token preservado — a suspensão não desloga); o usuário só pode sair.
 * Tone de aviso (warning) — Stitch conta_suspensa.
 */
export function ContaSuspensaScreen() {
  const { t } = useTranslation()
  const { logout } = useAuth()

  return (
    <div className="relative min-h-[100dvh] bg-gradient-page px-4">
      <div aria-hidden className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-5 py-6">
        <Logo variant="lg" className="mx-auto h-20 w-20 text-primary" />
        <div className="relative w-full overflow-hidden rounded-xl border border-warning bg-card p-6 text-center shadow-sm">
          <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-warning" />
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-warning-light">
            <Ban className="size-8 text-warning-text" aria-hidden />
          </div>
          <h2 className="mt-4 font-display text-[22px] font-semibold text-text-primary">{t("auth.contaSuspensaTitle")}</h2>
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning bg-warning-light p-3 text-left">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-warning-text" aria-hidden />
            <p className="text-sm text-warning-text">{t("auth.contaSuspensaDetail")}</p>
          </div>
          <Button onClick={logout} className="mt-5 w-full">
            <LogOut className="size-4" aria-hidden />
            {t("auth.sair")}
          </Button>
        </div>
      </div>
    </div>
  )
}
