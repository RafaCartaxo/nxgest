import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext.js"

/** Guard de rota exclusivo do super admin (gestão de empresas/whitelabel). */
export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== "super_admin") {
    return <Navigate to="/admin" replace />
  }

  return <>{children}</>
}
