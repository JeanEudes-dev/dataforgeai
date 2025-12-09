import type { Timestamps } from './api.types'
import type { TrainedModelListItem, TaskType } from './ml.types'

export type PredictionStatus = 'pending' | 'running' | 'completed' | 'error'
export type PredictionInputType = 'json' | 'file'

export interface PredictionJobListItem extends Timestamps {
  id: string
  model: TrainedModelListItem
  input_type: PredictionInputType
  input_row_count: number | null
  status: PredictionStatus
}

export interface PredictionJob extends Timestamps {
  id: string
  model: TrainedModelListItem
  input_type: PredictionInputType
  input_data: Record<string, unknown>[] | null
  input_row_count: number | null
  predictions: (string | number)[]
  probabilities?: Record<string, number>[]
  status: PredictionStatus
  error_message: string
  completed_at: string | null
}

export interface SinglePredictionParams {
  model_id: string
  data: Record<string, unknown>[]
  include_probabilities?: boolean
}

export interface SinglePredictionResponse {
  job_id: string
  predictions: (string | number)[]
  probabilities?: Record<string, number>[]
  row_count: number
  model_id: string
  task_type: TaskType
}

export interface BatchPredictionParams {
  model_id: string
  file: File
  async?: boolean
}
