import { apiClient } from './client'
import type {
  PaginatedResponse,
  EDAResult,
  EDAResultListItem,
  TriggerEDAParams,
} from '@/types'

export const edaApi = {
  // POST /eda/
  trigger: async (params: TriggerEDAParams): Promise<EDAResult> => {
    const queryParams = new URLSearchParams()
    if (params.async) queryParams.append('async', 'true')
    if (params.force_refresh) queryParams.append('force_refresh', 'true')

    const url = `/eda/${queryParams.toString() ? `?${queryParams}` : ''}`
    const response = await apiClient.post<EDAResult>(url, {
      dataset_id: params.dataset_id,
    })
    return response.data
  },

  // GET /eda/results/
  listResults: async (page: number = 1): Promise<PaginatedResponse<EDAResultListItem>> => {
    const response = await apiClient.get<PaginatedResponse<EDAResultListItem>>(
      '/eda/results/',
      { params: { page } }
    )
    return response.data
  },

  // GET /eda/results/:id/
  getResult: async (id: string): Promise<EDAResult> => {
    const response = await apiClient.get<EDAResult>(`/eda/results/${id}/`)
    return response.data
  },

  // GET /eda/results/:id/insights/
  getInsights: async (id: string): Promise<{ insights: EDAResult['insights']; ai_insights: string | null }> => {
    const response = await apiClient.get(`/eda/results/${id}/insights/`)
    return response.data
  },

  // GET /eda/results/:id/correlations/
  getCorrelations: async (id: string): Promise<{
    correlation_matrix: EDAResult['correlation_matrix']
    top_correlations: EDAResult['top_correlations']
  }> => {
    const response = await apiClient.get(`/eda/results/${id}/correlations/`)
    return response.data
  },

  // GET /eda/results/:id/distributions/
  getDistributions: async (id: string): Promise<{ distributions: EDAResult['distributions'] }> => {
    const response = await apiClient.get(`/eda/results/${id}/distributions/`)
    return response.data
  },

  // GET /eda/results/:id/stats/
  getStats: async (id: string): Promise<{ summary_stats: EDAResult['summary_stats'] }> => {
    const response = await apiClient.get(`/eda/results/${id}/stats/`)
    return response.data
  },

  // GET /eda/dataset/:datasetId/
  listByDataset: async (datasetId: string): Promise<EDAResultListItem[]> => {
    const response = await apiClient.get<EDAResultListItem[]>(`/eda/dataset/${datasetId}/`)
    return response.data
  },

  // GET /eda/dataset/:datasetId/latest/
  getLatestByDataset: async (datasetId: string): Promise<EDAResult> => {
    const response = await apiClient.get<EDAResult>(`/eda/dataset/${datasetId}/latest/`)
    return response.data
  },
}

export default edaApi
