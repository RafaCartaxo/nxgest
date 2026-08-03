import { Navigate } from "react-router-dom"
import { useAuth } from "./AuthContext.js"

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== "admin" && user?.role !== "super_admin" && user?.role !== "socio") {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
