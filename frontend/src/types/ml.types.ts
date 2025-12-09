import type { Timestamps } from './api.types'
import type { DatasetListItem } from './dataset.types'

export type TaskType = 'classification' | 'regression'

export type AlgorithmType =
  | 'logistic_regression'
  | 'linear_regression'
  | 'random_forest'
  | 'gradient_boosting'
  | 'svm'

export type TrainingStatus = 'pending' | 'running' | 'completed' | 'error' | 'cancelled'

export interface TrainingJobMetrics {
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  f1_weighted?: number
  roc_auc?: number
  rmse?: number
  mae?: number
  r2?: number
  r2_score?: number
  mse?: number
}

export interface FeatureImportance {
  [feature: string]: number
}

export interface TrainedModelListItem {
  id: string
  name: string
  display_name: string
  algorithm: string
  algorithm_type: AlgorithmType
  task_type: TaskType
  target_column: string
  metrics: TrainingJobMetrics
  primary_metric: number
  is_best: boolean
  created_at: string
}

export interface TrainedModel extends Timestamps {
  id: string
  training_job: string
  dataset: DatasetListItem
  name: string
  display_name: string
  algorithm: string
  algorithm_type: AlgorithmType
  task_type: TaskType
  feature_columns: string[]
  target_column: string
  input_schema: Record<string, unknown>
  preprocessing_params: Record<string, unknown>
  metrics: TrainingJobMetrics
  primary_metric: number
  feature_importance: FeatureImportance
  cross_val_scores: number[]
  hyperparameters: Record<string, unknown>
  shap_values: Record<string, unknown> | null
  has_shap: boolean
  model_size: number | null
  model_size_display: string
  is_best: boolean
}

export interface TrainingJobListItem extends Timestamps {
  id: string
  dataset: DatasetListItem
  dataset_name: string
  target_column: string
  feature_columns: string[]
  task_type: TaskType
  status: TrainingStatus
  progress: number
  current_step: string
  duration: number | null
  best_model: TrainedModelListItem | null
}

export interface TrainingJob extends Timestamps {
  id: string
  dataset: DatasetListItem
  dataset_name: string
  target_column: string
  feature_columns: string[]
  task_type: TaskType
  task_type_auto_detected: boolean
  status: TrainingStatus
  progress: number
  current_step: string
  duration: number | null
  best_model: TrainedModelListItem | null
  trained_models: TrainedModelListItem[]
  models: TrainedModelListItem[]
  started_at: string | null
  completed_at: string | null
  error_message: string
}

export interface StartTrainingParams {
  dataset_id: string
  target_column: string
  feature_columns?: string[]
  task_type?: TaskType
  async?: boolean
}

export interface SHAPExplanation {
  base_value: number
  shap_values: Record<string, number[]>
  feature_names: string[]
  expected_value: number
}
