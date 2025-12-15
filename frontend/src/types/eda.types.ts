import type { Timestamps } from './api.types'
import type { DatasetListItem } from './dataset.types'

export type EDAStatus = 'pending' | 'running' | 'completed' | 'error'

export interface SummaryStats {
  count: number
  mean: number | null
  std: number | null
  min: number | null
  max: number | null
  '25%': number | null
  '50%': number | null
  '75%': number | null
}

export interface DistributionData {
  bins: string[]
  counts: number[]
  type: 'numeric' | 'categorical'
}

export interface CorrelationPair {
  column1: string
  column2: string
  correlation: number
  strength: 'weak' | 'moderate' | 'strong'
}

export interface MissingAnalysis {
  count: number
  ratio: number
  pattern?: string
}

export interface OutlierAnalysis {
  method: 'iqr' | 'zscore'
  count: number
  ratio: number
  bounds?: {
    lower: number
    upper: number
  }
}

export interface Insight {
  type: 'info' | 'warning' | 'success' | 'error'
  message: string
  severity: 'low' | 'medium' | 'high'
  column?: string
  value?: number | string
}

export interface EDAResult extends Timestamps {
  id: string
  dataset: DatasetListItem
  version: number
  status: EDAStatus
  summary_stats: Record<string, SummaryStats>
  distributions: Record<string, DistributionData>
  correlation_matrix: Record<string, Record<string, number>>
  top_correlations: CorrelationPair[]
  missing_analysis: Record<string, MissingAnalysis>
  outlier_analysis: Record<string, OutlierAnalysis>
  insights: Insight[]
  ai_insights: string | null
  sampled: boolean
  sample_size: number | null
  computation_time: number | null
  error_message: string
}

export interface EDAResultListItem extends Timestamps {
  id: string
  dataset_id: string
  version: number
  status: EDAStatus
  sampled: boolean
  computation_time: number | null
}

export interface TriggerEDAParams {
  dataset_id: string
  async?: boolean
  force_refresh?: boolean
}
