import { Link } from "react-router-dom"
import { Plus } from "lucide-react"
import { useFab } from "./FabContext.js"

/** FAB mobile (PLAN-062) — botão flutuante acima da tab bar; oculto no desktop. */
export function Fab() {
  const { fab } = useFab()
  if (!fab) return null

  return (
    <Link
      to={fab.to}
      aria-label={fab.label}
      className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95 lg:hidden"
      style={{ bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
    >
      <Plus className="size-6" />
    </Link>
  )
}
