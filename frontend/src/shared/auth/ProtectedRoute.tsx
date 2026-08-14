import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext.js"
import { ContaSuspensaScreen } from "./ContaSuspensaScreen.js"

const TOKEN_KEY = "nxgest_token"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!token && !localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // PLAN-075 F6: conta suspensa bloqueia o app mas mantém a sessão.
  if (user?.status === "suspenso") {
    return <ContaSuspensaScreen />
  }

  return <>{children}</>
}
