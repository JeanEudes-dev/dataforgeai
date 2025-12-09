import { apiClient } from './client'
import type {
  PaginatedResponse,
  PredictionJob,
  PredictionJobListItem,
  SinglePredictionParams,
  SinglePredictionResponse,
  BatchPredictionParams,
} from '@/types'

export const predictionsApi = {
  // POST /predictions/predict/
  predict: async (params: SinglePredictionParams): Promise<SinglePredictionResponse> => {
    const response = await apiClient.post<SinglePredictionResponse>(
      '/predictions/predict/',
      {
        model_id: params.model_id,
        data: params.data,
        include_probabilities: params.include_probabilities ?? false,
      }
    )
    return response.data
  },

  // POST /predictions/batch/
  batchPredict: async (params: BatchPredictionParams): Promise<PredictionJob> => {
    const queryParams = new URLSearchParams()
    if (params.async) queryParams.append('async', 'true')

    const formData = new FormData()
    formData.append('model_id', params.model_id)
    formData.append('file', params.file)

    const url = `/predictions/batch/${queryParams.toString() ? `?${queryParams}` : ''}`
    const response = await apiClient.post<PredictionJob>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // GET /predictions/jobs/
  listJobs: async (page: number = 1): Promise<PaginatedResponse<PredictionJobListItem>> => {
    const response = await apiClient.get<PaginatedResponse<PredictionJobListItem>>(
      '/predictions/jobs/',
      { params: { page } }
    )
    return response.data
  },

  // GET /predictions/jobs/:jobId/
  getJob: async (jobId: string): Promise<PredictionJob> => {
    const response = await apiClient.get<PredictionJob>(`/predictions/jobs/${jobId}/`)
    return response.data
  },

  // GET /predictions/jobs/:jobId/download/
  downloadResults: async (jobId: string): Promise<Blob> => {
    const response = await apiClient.get(`/predictions/jobs/${jobId}/download/`, {
      responseType: 'blob',
    })
    return response.data
  },

  // GET /predictions/model/:modelId/
  listByModel: async (modelId: string): Promise<PredictionJobListItem[]> => {
    const response = await apiClient.get<PredictionJobListItem[]>(
      `/predictions/model/${modelId}/`
    )
    return response.data
  },
}

export default predictionsApi
