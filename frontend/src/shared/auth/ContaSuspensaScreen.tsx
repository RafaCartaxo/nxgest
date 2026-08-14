import { useTranslation } from "react-i18next"
import { Ban } from "lucide-react"
import { Logo } from "../components/Logo.js"
import { Button } from "../components/Button.js"
import { useAuth } from "./AuthContext.js"

/**
 * Bloqueio de conta suspensa (PLAN-075 F6): substitui o conteúdo do
 * `ProtectedRoute` quando `user.status === "suspenso"`. A sessão é MANITIDA
 * (token preservado — a suspensão não desloga); o usuário só pode sair.
 */
export function ContaSuspensaScreen() {
  const { t } = useTranslation()
  const { logout } = useAuth()

  return (
    <div className="relative min-h-[100dvh] bg-gradient-page px-4">
      <div aria-hidden className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-5 py-6">
        <Logo variant="lg" className="mx-auto h-20 w-20 text-primary" />
        <div className="w-full rounded-lg border border-warning bg-warning-light p-6 text-center shadow-sm">
          <Ban className="mx-auto mb-2 h-8 w-8 text-warning" />
          <h2 className="font-display text-[22px] font-semibold">{t("auth.contaSuspensaTitle")}</h2>
          <p className="mt-1 mb-5 text-sm text-text-secondary">{t("auth.contaSuspensaDetail")}</p>

          <Button onClick={logout} className="w-full">
            {t("auth.sair")}
          </Button>
        </div>
      </div>
    </div>
  )
}