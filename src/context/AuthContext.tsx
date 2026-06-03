import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { AuthUser } from '../types'
import api from '../services/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'lm_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    api.get<AuthUser>('/auth/me')
      .then(res => setUser({ ...res.data, token }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        delete api.defaults.headers.common['Authorization']
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (username: string, password: string) => {
    const res = await api.post<AuthUser>('/auth/login', { username, password })
    const data = res.data
    localStorage.setItem(TOKEN_KEY, data.token)
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    setUser(data)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
