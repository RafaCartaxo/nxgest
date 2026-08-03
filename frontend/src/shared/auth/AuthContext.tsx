import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { login as loginService, getMe, type LoginResponse } from "../../modules/auth/services/auth.service.js"

export interface AuthUser {
  id: string
  nome: string
  email: string
  role: "super_admin" | "admin" | "socio" | "operator"
  empresaId?: string | null
  empresaNome?: string | null
  modulos?: string[] | null
  chefeId?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  login: (email: string, senha: string) => Promise<LoginResponse>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const TOKEN_KEY = "nxgestao_token"

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
        setUser({ id: me.id, nome: me.nome, email: me.email, role: me.role, empresaId: me.empresaId, empresaNome: me.empresaNome, modulos: me.modulos ?? null, chefeId: me.chefeId ?? null })
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
    setUser({ ...response.usuario, modulos: response.usuario.modulos ?? null })
    return response
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
