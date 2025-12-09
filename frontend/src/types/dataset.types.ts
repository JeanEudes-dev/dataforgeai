import type { Timestamps } from './api.types'

export type DatasetStatus = 'uploading' | 'processing' | 'ready' | 'error'

export type ColumnDataType = 'numeric' | 'categorical' | 'datetime' | 'text' | 'boolean'

export interface DatasetColumn {
  id: string
  name: string
  original_name: string
  position: number
  dtype: ColumnDataType
  pandas_dtype: string
  nullable: boolean
  null_count: number
  null_ratio: number
  unique_count: number
  sample_values: (string | number | null)[]
  min_value: number | null
  max_value: number | null
  mean_value: number | null
}

export interface Dataset extends Timestamps {
  id: string
  name: string
  description: string
  original_filename: string
  file_type: 'csv' | 'xlsx' | 'xls'
  file_size: number
  file_size_display: string
  row_count: number | null
  column_count: number | null
  schema: Record<string, unknown>
  status: DatasetStatus
  error_message: string
  columns: DatasetColumn[]
}

export interface DatasetListItem extends Timestamps {
  id: string
  name: string
  description: string
  original_filename: string
  file_type: 'csv' | 'xlsx' | 'xls'
  file_size: number
  file_size_display: string
  row_count: number | null
  column_count: number | null
  status: DatasetStatus
}

export interface DatasetPreview {
  columns: string[]
  rows: Record<string, unknown>[]
  total_rows: number
}

export interface DatasetSchema {
  columns: DatasetColumn[]
  total_columns: number
}

export interface DatasetUploadData {
  file: File
  name?: string
  description?: string
}

export interface DatasetUpdateData {
  name?: string
  description?: string
}
