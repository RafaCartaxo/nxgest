import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "./AuthContext.js"

const TOKEN_KEY = "nexus_token"

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!token && !localStorage.getItem(TOKEN_KEY)) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
