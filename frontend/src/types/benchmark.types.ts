import type { TaskType } from './ml.types'

export interface ManualStep {
  name: string
  description: string
  baseMinutes: number
  estimatedMinutes: number
}

export interface BenchmarkData {
  actualDuration: number | null // in seconds
  manualEstimate: number // in seconds
  timeSaved: number // in seconds
  efficiencyGain: number // percentage (0-100)
  breakdown: ManualStep[]
}

export interface BenchmarkCalculationParams {
  rowCount: number
  columnCount: number
  taskType: TaskType
  featureCount?: number
}
