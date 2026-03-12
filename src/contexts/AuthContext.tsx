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
      // Validate token with server
      const validateToken = async () => {
        try {
          const { adminApiService } = await import('../services/api')
          adminApiService.setAuthToken(token)
          
          // Try to get current user info
          const response = await fetch('/api/auth/admin/me', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          })
          
          if (response.ok) {
            const staff = await response.json()
            const user: User = {
              id: staff.id,
              email: staff.email,
              firstName: staff.firstName,
              lastName: staff.lastName,
              role: staff.role === 'admin' ? 'admin' : 'user'
            }
            setUser(user)
          } else {
            // Token invalid, remove it
            localStorage.removeItem('adminToken')
          }
        } catch (error) {
          // Token validation failed, remove it
          localStorage.removeItem('adminToken')
        } finally {
          setLoading(false)
        }
      }
      
      validateToken()
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // Import adminApiService dynamically to avoid circular dependencies
      const { adminApiService } = await import('../services/api')
      
      const response = await adminApiService.login(email, password)
      
      if (response.token && response.staff) {
        const user: User = {
          id: response.staff.id,
          email: response.staff.email,
          firstName: response.staff.firstName,
          lastName: response.staff.lastName,
          role: response.staff.role === 'admin' ? 'admin' : 'user'
        }
        
        localStorage.setItem('adminToken', response.token)
        setUser(user)
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      // Extract error message from API response
      let errorMessage = 'Login failed. Please check your credentials.'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      // Clean up error message if it contains JSON
      if (errorMessage.includes('{') && errorMessage.includes('}')) {
        try {
          const jsonMatch = errorMessage.match(/\{.*\}/)
          if (jsonMatch) {
            const errorJson = JSON.parse(jsonMatch[0])
            errorMessage = errorJson.message || errorJson.error || errorMessage
          }
        } catch {
          // If parsing fails, use the original message
        }
      }
      
      throw new Error(errorMessage)
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
