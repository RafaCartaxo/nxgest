import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext.js"
import { hasModule, type ModuleId } from "../modules/modules.js"

interface Props {
  mod: ModuleId
  children: ReactNode
}

/** Bloqueia a rota quando o módulo está desativado na empresa (whitelabel, BR-093). */
export function RequireModule({ mod, children }: Props) {
  const { user } = useAuth()

  if (!hasModule(user?.modulos, mod)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
