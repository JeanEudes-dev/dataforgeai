import { apiClient } from './client'
import type {
  PaginatedResponse,
  Dataset,
  DatasetListItem,
  DatasetPreview,
  DatasetSchema,
  DatasetUploadData,
  DatasetUpdateData,
} from '@/types'

export const datasetsApi = {
  // GET /datasets/
  list: async (page: number = 1): Promise<PaginatedResponse<DatasetListItem>> => {
    const response = await apiClient.get<PaginatedResponse<DatasetListItem>>(
      '/datasets/',
      { params: { page } }
    )
    return response.data
  },

  // POST /datasets/
  upload: async (data: DatasetUploadData): Promise<Dataset> => {
    const formData = new FormData()
    formData.append('file', data.file)
    if (data.name) formData.append('name', data.name)
    if (data.description) formData.append('description', data.description)

    const response = await apiClient.post<Dataset>('/datasets/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // GET /datasets/:id/
  get: async (id: string): Promise<Dataset> => {
    const response = await apiClient.get<Dataset>(`/datasets/${id}/`)
    return response.data
  },

  // PATCH /datasets/:id/
  update: async (id: string, data: DatasetUpdateData): Promise<Dataset> => {
    const response = await apiClient.patch<Dataset>(`/datasets/${id}/`, data)
    return response.data
  },

  // DELETE /datasets/:id/
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/datasets/${id}/`)
  },

  // GET /datasets/:id/preview/
  preview: async (id: string, rows: number = 10): Promise<DatasetPreview> => {
    const response = await apiClient.get<DatasetPreview>(
      `/datasets/${id}/preview/`,
      { params: { rows } }
    )
    return response.data
  },

  // GET /datasets/:id/schema/
  schema: async (id: string): Promise<DatasetSchema> => {
    const response = await apiClient.get<DatasetSchema>(`/datasets/${id}/schema/`)
    return response.data
  },

  // GET /datasets/:id/download/
  download: async (id: string): Promise<Blob> => {
    const response = await apiClient.get(`/datasets/${id}/download/`, {
      responseType: 'blob',
    })
    return response.data
  },
}

export default datasetsApi
