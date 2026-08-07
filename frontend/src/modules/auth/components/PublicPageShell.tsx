import type { ReactNode } from "react"
import { Logo } from "../../../shared/components/Logo.js"

/** Shell das páginas públicas de conta (recuperar/resetar senha, ativar) — mesmo estilo do Login (tokens). */
export function PublicPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] bg-gradient-page px-4">
      <div aria-hidden className="bg-mesh pointer-events-none absolute inset-0 opacity-70" />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-5 px-5 py-6">
        <Logo variant="lg" className="mx-auto h-20 w-20 text-primary" />
        <div className="w-full max-w-sm rounded-lg border border-border-light bg-surface p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
