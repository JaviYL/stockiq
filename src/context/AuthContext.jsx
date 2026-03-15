import { createContext, useContext, useState, useEffect } from 'react'
import { isSupabaseEnabled, getUser, onAuthStateChange, signOut } from '../services/supabaseClient'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const enabled = isSupabaseEnabled()

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Check current user
    getUser().then(u => {
      setUser(u)
      setLoading(false)
    })

    // Listen for auth changes
    const { data } = onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => data?.subscription?.unsubscribe()
  }, [enabled])

  const logout = async () => {
    await signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, enabled }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
