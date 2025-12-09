import { apiClient } from './client'
import type {
  User,
  LoginCredentials,
  RegisterData,
  LoginResponse,
  ChangePasswordData,
  UpdateProfileData,
} from '@/types'

export const authApi = {
  // POST /auth/register/
  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register/', data)
    return response.data
  },

  // POST /auth/login/
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login/', credentials)
    return response.data
  },

  // POST /auth/logout/
  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout/', { refresh: refreshToken })
  },

  // POST /auth/token/refresh/
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post<{ access: string }>(
      '/auth/token/refresh/',
      { refresh: refreshToken }
    )
    return response.data
  },

  // GET /auth/me/
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me/')
    return response.data
  },

  // PATCH /auth/me/
  updateProfile: async (data: UpdateProfileData): Promise<User> => {
    const response = await apiClient.patch<User>('/auth/me/', data)
    return response.data
  },

  // POST /auth/change-password/
  changePassword: async (data: ChangePasswordData): Promise<void> => {
    await apiClient.post('/auth/change-password/', data)
  },
}

export default authApi
