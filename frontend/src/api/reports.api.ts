import { apiClient } from './client'
import type {
  PaginatedResponse,
  Report,
  ReportListItem,
  GenerateReportParams,
} from '@/types'

export const reportsApi = {
  // POST /reports/generate/
  generate: async (params: GenerateReportParams): Promise<Report> => {
    const response = await apiClient.post<Report>('/reports/generate/', params)
    return response.data
  },

  // GET /reports/
  list: async (page: number = 1): Promise<PaginatedResponse<ReportListItem>> => {
    const response = await apiClient.get<PaginatedResponse<ReportListItem>>(
      '/reports/',
      { params: { page } }
    )
    return response.data
  },

  // GET /reports/:id/
  get: async (id: string): Promise<Report> => {
    const response = await apiClient.get<Report>(`/reports/${id}/`)
    return response.data
  },

  // DELETE /reports/:id/
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/reports/${id}/`)
  },

  // GET /reports/:id/export/
  export: async (id: string, format: 'pdf' = 'pdf'): Promise<Blob> => {
    const response = await apiClient.get(`/reports/${id}/export/`, {
      params: { format },
      responseType: 'blob',
    })
    return response.data
  },

  // GET /reports/dataset/:datasetId/
  listByDataset: async (datasetId: string): Promise<ReportListItem[]> => {
    const response = await apiClient.get<ReportListItem[]>(
      `/reports/dataset/${datasetId}/`
    )
    return response.data
  },
}

export default reportsApi
