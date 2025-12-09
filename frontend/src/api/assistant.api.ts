import { apiClient } from './client'
import type {
  AskQuestionParams,
  AskQuestionResponse,
  ExplainMetricParams,
  ExplainMetricResponse,
  AssistantStatus,
} from '@/types'

export const assistantApi = {
  // POST /assistant/ask/
  ask: async (params: AskQuestionParams): Promise<AskQuestionResponse> => {
    const response = await apiClient.post<AskQuestionResponse>(
      '/assistant/ask/',
      params
    )
    return response.data
  },

  // POST /assistant/explain/
  explainMetric: async (params: ExplainMetricParams): Promise<ExplainMetricResponse> => {
    const response = await apiClient.post<ExplainMetricResponse>(
      '/assistant/explain/',
      params
    )
    return response.data
  },

  // GET /assistant/status/
  getStatus: async (): Promise<AssistantStatus> => {
    const response = await apiClient.get<AssistantStatus>('/assistant/status/')
    return response.data
  },
}

export default assistantApi
