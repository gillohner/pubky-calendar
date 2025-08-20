'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  pubkey: string
}

interface AuthContextType {
  isAuthenticated: boolean
  pubkey: string | null
  user: User | null
  login: (session: any) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [pubkey, setPubkey] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    const storedPubkey = localStorage.getItem('pubky_pubkey')
    const storedAuth = localStorage.getItem('pubky_authenticated')
    
    if (storedPubkey && storedAuth === 'true') {
      setPubkey(storedPubkey)
      setUser({ pubkey: storedPubkey })
      setIsAuthenticated(true)
    }
  }, [])

  const login = (session: any) => {
    try {
      const pubkey = session.pubkey || session.user?.pubkey
      if (pubkey) {
        setPubkey(pubkey)
        setUser({ pubkey })
        setIsAuthenticated(true)
        
        // Store in localStorage
        localStorage.setItem('pubky_pubkey', pubkey)
        localStorage.setItem('pubky_authenticated', 'true')
      }
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const logout = () => {
    setPubkey(null)
    setUser(null)
    setIsAuthenticated(false)
    
    // Clear localStorage
    localStorage.removeItem('pubky_pubkey')
    localStorage.removeItem('pubky_authenticated')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, pubkey, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
