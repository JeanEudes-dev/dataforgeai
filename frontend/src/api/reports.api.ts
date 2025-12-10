import { apiClient } from './client'
import axios from 'axios'
import type {
  PaginatedResponse,
  Report,
  ReportListItem,
  GenerateReportParams,
  EnhancedReport,
  SharedReport,
  ShareReportParams,
  ShareReportResponse,
} from '@/types'

export const reportsApi = {
  // POST /reports/generate/
  generate: async (params: GenerateReportParams): Promise<EnhancedReport> => {
    const response = await apiClient.post<EnhancedReport>('/reports/generate/', params)
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
  get: async (id: string): Promise<EnhancedReport> => {
    const response = await apiClient.get<EnhancedReport>(`/reports/${id}/`)
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

  // POST /reports/:id/share/
  share: async (id: string, params: ShareReportParams): Promise<ShareReportResponse> => {
    const response = await apiClient.post<ShareReportResponse>(
      `/reports/${id}/share/`,
      params
    )
    return response.data
  },

  // GET /reports/shared/:shareToken/ (public, no auth required)
  getShared: async (shareToken: string): Promise<SharedReport> => {
    // Use a separate axios instance without auth for public endpoint
    const baseURL = apiClient.defaults.baseURL || '/api/v1'
    const response = await axios.get<SharedReport>(
      `${baseURL}/reports/shared/${shareToken}/`
    )
    return response.data
  },
}

export default reportsApi
