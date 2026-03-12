import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'user'
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth token on mount
    const token = localStorage.getItem('adminToken')
    
    if (token) {
      // In a real app, you'd validate the token with the server
      // For now, we'll just set a mock user
      const mockUser = {
        id: 1,
        email: 'admin@drinks.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as const
      }
      setUser(mockUser)
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Mock login - in a real app, this would call your API
      if (email === 'admin@drinks.com' && password === 'admin123') {
        const mockUser: User = {
          id: 1,
          email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin'
        }
        
        const mockToken = 'mock-admin-token'
        localStorage.setItem('adminToken', mockToken)
        setUser(mockUser)
      } else {
        throw new Error('Invalid credentials')
      }
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('adminToken')
    setUser(null)
  }

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
