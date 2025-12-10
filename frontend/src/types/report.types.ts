import type { Timestamps } from './api.types'
import type { DatasetListItem } from './dataset.types'
import type { TrainedModelListItem, TrainedModel, TaskType, AlgorithmType, TrainingJobMetrics, FeatureImportance } from './ml.types'

export type ReportStatus = 'pending' | 'generating' | 'completed' | 'error'
export type ReportType = 'full' | 'eda' | 'model'

// Section types for navigation
export type ReportSection = 'overview' | 'eda' | 'model' | 'comparison' | 'insights'

// Distribution data for charts
export interface DistributionData {
  bins?: number[]
  counts?: number[]
  labels?: string[]
  type?: 'numeric' | 'categorical'
}

// Correlation pair
export interface CorrelationPair {
  col1: string
  col2: string
  correlation: number
  strength?: string
}

// Missing value analysis
export interface MissingAnalysis {
  count: number
  ratio: number
  pattern?: string
}

// Outlier analysis
export interface OutlierAnalysis {
  count: number
  ratio?: number
  method: string
  lower_bound?: number
  upper_bound?: number
}

// Insight from EDA
export interface EDAInsight {
  type: 'info' | 'warning' | 'success' | 'error'
  message: string
  severity?: 'low' | 'medium' | 'high'
  column?: string
  value?: number | string
}

// Summary stats for a column
export interface ColumnSummaryStats {
  count?: number
  mean?: number
  std?: number
  min?: number
  max?: number
  '25%'?: number
  '50%'?: number
  '75%'?: number
  skewness?: number
  kurtosis?: number
  unique?: number
  top?: string
  freq?: number
}

// Model comparison entry
export interface ModelComparisonEntry {
  id: string
  name: string
  display_name: string
  algorithm_type: AlgorithmType
  task_type: TaskType
  is_best: boolean
  metrics: TrainingJobMetrics
  primary_metric: number
  feature_importance: Array<{ name: string; importance: number }>
  cross_val_scores: number[]
  hyperparameters: Record<string, unknown>
  model_size_display?: string
  created_at?: string
}

// Report metadata for UI display
export interface ReportMetadata {
  data_quality_score: number | null
  total_insights: number
  computation_time: number | null
  chart_types_included: string[]
  models_count: number
  has_ai_insights: boolean
  has_model: boolean
  has_eda: boolean
}

// Enhanced EDA content
export interface EnhancedEDAContent {
  // Summary statistics
  summary_stats: Record<string, ColumnSummaryStats>
  summary_stats_formatted?: {
    numeric_columns: Array<{ name: string; mean: number; std: number; min: number; max: number }>
    categorical_columns: Array<{ name: string; unique: number; top: string }>
  }

  // Distributions (for charts)
  distributions: Record<string, DistributionData>

  // Correlations
  correlation_matrix: Record<string, Record<string, number>>
  top_correlations: CorrelationPair[]

  // Missing values
  missing_analysis: Record<string, MissingAnalysis>
  missing_values_summary?: Array<{ column: string; count: number; ratio: number }>

  // Outliers
  outlier_analysis: Record<string, OutlierAnalysis>
  outliers_summary?: Array<{ column: string; count: number; method: string }>

  // Data quality
  data_quality_score: number | null

  // Insights
  insights: EDAInsight[]
  ai_insights: string | null

  // Additional analysis
  datetime_analysis?: Record<string, unknown>
  text_analysis?: Record<string, unknown>
  associations?: Record<string, unknown>

  // Metadata
  sampled: boolean
  sample_size: number | null
  computation_time: number | null
}

// Enhanced model content
export interface EnhancedModelContent {
  id?: string
  name: string
  display_name: string
  algorithm_type: AlgorithmType
  task_type: TaskType
  metrics: TrainingJobMetrics
  primary_metric: number
  feature_importance: Array<{ name: string; importance: number }>
  hyperparameters: Record<string, unknown>
  cross_val_scores: number[]
  is_best: boolean
  model_size?: number
  model_size_display?: string
}

// Enhanced dataset content
export interface EnhancedDatasetContent {
  name: string
  description?: string
  file_type: string
  file_size?: number
  file_size_display?: string
  row_count: number
  column_count: number
  created_at?: string
  schema?: Record<string, unknown>
  columns?: Array<{
    name: string
    dtype: string
    null_ratio: number
    unique_count: number
  }>
}

// Legacy content structure (for backwards compatibility)
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

// Enhanced report content
export interface EnhancedReportContent {
  dataset: EnhancedDatasetContent
  eda?: EnhancedEDAContent
  model?: EnhancedModelContent
}

export interface ReportListItem extends Timestamps {
  id: string
  title: string
  report_type: ReportType
  dataset: DatasetListItem
  status: ReportStatus
  is_public?: boolean
}

// Legacy Report interface (for backwards compatibility)
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

// Enhanced Report interface
export interface EnhancedReport extends Timestamps {
  id: string
  title: string
  report_type: ReportType
  dataset: DatasetListItem
  eda_result: string | null
  trained_model: TrainedModel | null
  all_models: TrainedModelListItem[]
  content: EnhancedReportContent
  model_comparison: ModelComparisonEntry[]
  ai_summary: string | null
  status: ReportStatus
  error_message: string
  share_token: string | null
  share_url: string | null
  is_public: boolean
  report_metadata: ReportMetadata
}

// Shared report (public, limited data)
export interface SharedReport {
  id: string
  title: string
  report_type: ReportType
  dataset_name: string
  dataset_row_count: number
  dataset_column_count: number
  content: EnhancedReportContent
  model_comparison: ModelComparisonEntry[]
  ai_summary: string | null
  report_metadata: ReportMetadata
  created_at: string
}

export interface GenerateReportParams {
  dataset_id: string
  title?: string
  report_type?: ReportType
  eda_result_id?: string
  model_id?: string
}

export interface ShareReportParams {
  enable: boolean
}

export interface ShareReportResponse {
  share_token: string | null
  share_url: string | null
  is_public: boolean
  detail: string
}
