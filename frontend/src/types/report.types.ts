import type { Timestamps } from './api.types'
import type { DatasetListItem } from './dataset.types'
import type { TrainedModelListItem } from './ml.types'

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'error'
export type ReportType = 'full' | 'eda' | 'model'

export interface ReportContent {
  dataset_overview?: {
    name: string
    rows: number
    columns: number
    file_type: string
    missingness_summary: string
  }
  eda_summary?: {
    key_statistics: Record<string, unknown>
    notable_correlations: Array<{
      column1: string
      column2: string
      correlation: number
    }>
    missing_values: Record<string, number>
    outliers_detected: number
  }
  model_summary?: {
    algorithm: string
    task_type: string
    metrics: Record<string, number>
    feature_importance: Record<string, number>
  }
  insights: string[]
}

export interface ReportListItem extends Timestamps {
  id: string
  title: string
  report_type: ReportType
  dataset: DatasetListItem
  status: ReportStatus
}

export interface Report extends Timestamps {
  id: string
  title: string
  report_type: ReportType
  dataset: DatasetListItem
  eda_result: string | null
  trained_model: TrainedModelListItem | null
  content: ReportContent
  ai_summary: string | null
  status: ReportStatus
  error_message: string
}

export interface GenerateReportParams {
  dataset_id: string
  title?: string
  report_type?: ReportType
  eda_result_id?: string
  model_id?: string
}
