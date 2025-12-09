import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { authApi } from '@/api'
import {
  getRefreshToken,
  setTokens,
  clearTokens,
  hasTokens,
} from '@/utils/storage'
import type {
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
} from '@/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (data: UpdateProfileData) => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      if (!hasTokens()) {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
        return
      }

      try {
        const user = await authApi.getMe()
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch {
        // Token invalid or expired
        clearTokens()
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials)
    setTokens(response.access, response.refresh)
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    const response = await authApi.register(data)
    setTokens(response.access, response.refresh)
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken()
      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens()
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const user = await authApi.updateProfile(data)
    setState(prev => ({
      ...prev,
      user,
    }))
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const user = await authApi.getMe()
      setState(prev => ({
        ...prev,
        user,
      }))
    } catch {
      // Ignore refresh errors
    }
  }, [])

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
