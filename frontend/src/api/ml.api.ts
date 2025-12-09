import { apiClient } from './client'
import type {
  PaginatedResponse,
  TrainingJob,
  TrainingJobListItem,
  TrainedModel,
  TrainedModelListItem,
  StartTrainingParams,
  SHAPExplanation,
} from '@/types'

export const mlApi = {
  // POST /ml/train/
  startTraining: async (params: StartTrainingParams): Promise<TrainingJob> => {
    const queryParams = new URLSearchParams()
    if (params.async) queryParams.append('async', 'true')

    const url = `/ml/train/${queryParams.toString() ? `?${queryParams}` : ''}`
    const response = await apiClient.post<TrainingJob>(url, {
      dataset_id: params.dataset_id,
      target_column: params.target_column,
      feature_columns: params.feature_columns || [],
      task_type: params.task_type,
    })
    return response.data
  },

  // GET /ml/jobs/
  listJobs: async (page: number = 1): Promise<PaginatedResponse<TrainingJobListItem>> => {
    const response = await apiClient.get<PaginatedResponse<TrainingJobListItem>>(
      '/ml/jobs/',
      { params: { page } }
    )
    return response.data
  },

  // GET /ml/jobs/:jobId/
  getJob: async (jobId: string): Promise<TrainingJob> => {
    const response = await apiClient.get<TrainingJob>(`/ml/jobs/${jobId}/`)
    return response.data
  },

  // GET /ml/models/
  listModels: async (page: number = 1): Promise<PaginatedResponse<TrainedModelListItem>> => {
    const response = await apiClient.get<PaginatedResponse<TrainedModelListItem>>(
      '/ml/models/',
      { params: { page } }
    )
    return response.data
  },

  // GET /ml/models/:modelId/
  getModel: async (modelId: string): Promise<TrainedModel> => {
    const response = await apiClient.get<TrainedModel>(`/ml/models/${modelId}/`)
    return response.data
  },

  // DELETE /ml/models/:modelId/
  deleteModel: async (modelId: string): Promise<void> => {
    await apiClient.delete(`/ml/models/${modelId}/`)
  },

  // GET /ml/models/:modelId/download/
  downloadModel: async (modelId: string): Promise<Blob> => {
    const response = await apiClient.get(`/ml/models/${modelId}/download/`, {
      responseType: 'blob',
    })
    return response.data
  },

  // GET /ml/models/:modelId/shap/
  getShapExplanation: async (modelId: string): Promise<SHAPExplanation> => {
    const response = await apiClient.get<SHAPExplanation>(`/ml/models/${modelId}/shap/`)
    return response.data
  },

  // GET /ml/dataset/:datasetId/models/
  getModelsByDataset: async (datasetId: string): Promise<TrainedModelListItem[]> => {
    const response = await apiClient.get<TrainedModelListItem[]>(
      `/ml/dataset/${datasetId}/models/`
    )
    return response.data
  },
}

export default mlApi
