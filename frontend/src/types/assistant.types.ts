import type { TaskType } from './ml.types'

export interface AskQuestionParams {
  question: string
  dataset_id?: string
  model_id?: string
  eda_result_id?: string
}

export interface AskQuestionResponse {
  answer: string
  sources: string[]
}

export interface ExplainMetricParams {
  metric_name: string
  metric_value: number
  task_type: TaskType
}

export interface ExplainMetricResponse {
  explanation: string
  interpretation: string
  recommendations?: string[]
}

export interface AssistantStatus {
  available: boolean
  model: string | null
}

export interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  sources?: string[]
}

export interface ChatContext {
  dataset_id?: string
  model_id?: string
  eda_result_id?: string
}
