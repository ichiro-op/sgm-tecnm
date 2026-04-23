import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    auth.me()
      .then(r => setUser(r.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const logout = async () => {
    await auth.logout()
    setUser(null)
  }

  const completeProfile = async (numero_control) => {
    const r = await auth.completeProfile(numero_control)
    setUser(r.data.user)
    return r.data.user
  }

  const devLogin = async (email) => {
    const r = await auth.devLogin(email)
    setUser(r.data.user)
    return r.data.user
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, completeProfile, devLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
