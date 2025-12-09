import type { Timestamps } from './api.types'

export interface User extends Timestamps {
  id: string
  email: string
  first_name: string
  last_name: string
  full_name: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  password_confirm: string
  first_name?: string
  last_name?: string
}

export interface AuthTokens {
  access: string
  refresh: string
}

export interface LoginResponse extends AuthTokens {
  user: User
}

export interface ChangePasswordData {
  old_password: string
  new_password: string
  new_password_confirm: string
}

export interface UpdateProfileData {
  first_name?: string
  last_name?: string
}
