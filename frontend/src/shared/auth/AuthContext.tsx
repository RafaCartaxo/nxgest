import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { login as loginService, getMe, type LoginResponse } from "../../modules/auth/services/auth.service.js"

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: "admin" | "operator"
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = "nexus_token"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    getMe()
      .then((me) => {
        setUser({ id: me.id, nome: me.nome, email: me.email, role: me.role })
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [token])

  const login = useCallback(async (email: string, senha: string) => {
    const response: LoginResponse = await loginService(email, senha)
    localStorage.setItem(TOKEN_KEY, response.token)
    setToken(response.token)
    setUser(response.usuario)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return ctx
}
