// Common API response types

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail: string
  code: string
  meta?: Record<string, unknown>
}

export interface ApiErrorResponse {
  response?: {
    data?: ApiError
    status?: number
  }
  message?: string
}

// Job status types used across features
export type JobStatus = 'pending' | 'running' | 'completed' | 'error' | 'cancelled'

// Common timestamp fields
export interface Timestamps {
  created_at: string
  updated_at: string
}
