import { useMemo } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts'
import { motion } from 'framer-motion'
import type { ModelComparisonEntry } from '@/types'

interface MetricsRadarChartProps {
  models: ModelComparisonEntry[]
  metrics?: string[]
  height?: number
  maxModels?: number
}

const COLORS = [
  'var(--color-primary-500)', // Blue
  'var(--color-success-500)', // Green
  'var(--color-warning-500)', // Amber
  'var(--color-error-500)', // Red
  'var(--color-purple-500)', // Purple
]

export function MetricsRadarChart({
  models,
  metrics,
  height = 350,
  maxModels = 4,
}: MetricsRadarChartProps) {
  // React compiler lint: keep manual memoization here for clarity
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const { chartData, selectedMetrics, displayModels } = useMemo(() => {
    if (!models || models.length === 0) {
      return { chartData: [], selectedMetrics: [], displayModels: [] }
    }

    // Limit models for readability
    const limitedModels = models.slice(0, maxModels)

    // Determine task type
    const taskType = models[0].task_type

    // Select metrics based on task type
    let selectedMetrics = metrics
    if (!selectedMetrics || selectedMetrics.length === 0) {
      if (taskType === 'classification') {
        selectedMetrics = ['accuracy', 'precision', 'recall', 'f1', 'roc_auc']
      } else {
        // For regression, invert error metrics for radar display
        selectedMetrics = ['r2', 'mae', 'rmse']
      }
    }

    // Filter to only available metrics
    const availableMetrics = new Set<string>()
    limitedModels.forEach((m) => {
      if (m.metrics) {
        Object.keys(m.metrics).forEach((k) => {
          if (typeof m.metrics[k as keyof typeof m.metrics] === 'number') {
            availableMetrics.add(k)
          }
        })
      }
    })

    selectedMetrics = selectedMetrics.filter((m) => availableMetrics.has(m))

    // Metrics that are "lower is better" need to be inverted for radar
    const invertedMetrics = ['rmse', 'mae', 'mse', 'mape']

    // Build chart data: one entry per metric
    const chartData = selectedMetrics.map((metricKey) => {
      const entry: Record<string, string | number> = {
        metric: formatMetricLabel(metricKey),
        fullMetric: metricKey,
      }

      limitedModels.forEach((model) => {
        let value = (model.metrics?.[metricKey as keyof typeof model.metrics] as number) || 0

        // Normalize all metrics to 0-100 scale
        if (invertedMetrics.includes(metricKey.toLowerCase())) {
          // For error metrics, invert (assume max reasonable value)
          // This is a simplification; in practice you'd normalize based on data
          value = Math.max(0, 1 - value) * 100
        } else {
          value = value * 100
        }

        entry[model.id] = Math.min(100, Math.max(0, value))
      })

      return entry
    })

    return {
      chartData,
      selectedMetrics,
      displayModels: limitedModels,
    }
  }, [models, metrics, maxModels])

  if (!models || models.length === 0 || chartData.length === 0) {
    return (
      <div className="w-full rounded-xl border border-subtle bg-surface p-4 text-sm text-muted-foreground">
        No metrics data available for radar chart.
      </div>
    )
  }

  function formatMetricLabel(metric: string): string {
    const labels: Record<string, string> = {
      accuracy: 'Accuracy',
      precision: 'Precision',
      recall: 'Recall',
      f1: 'F1 Score',
      f1_score: 'F1 Score',
      f1_weighted: 'F1 (Weighted)',
      roc_auc: 'ROC AUC',
      r2: 'R2',
      r2_score: 'R2',
      rmse: 'RMSE (inv)',
      mae: 'MAE (inv)',
      mse: 'MSE (inv)',
      mape: 'MAPE (inv)',
    }
    return labels[metric] || metric.replace(/_/g, ' ').toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="var(--color-subtle)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fontSize: 9, fill: 'var(--color-muted)' }}
            tickFormatter={(value) => `${value}%`}
          />
          {displayModels.map((model, index) => (
            <Radar
              key={model.id}
              name={model.display_name}
              dataKey={model.id}
              stroke={COLORS[index % COLORS.length]}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{
                r: 3,
                fill: COLORS[index % COLORS.length],
              }}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => {
              const model = displayModels.find((m) => m.display_name === value)
              return (
                <span className={model?.is_best ? 'font-semibold' : ''}>
                  {value} {model?.is_best ? '(Best)' : ''}
                </span>
              )
            }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              return (
                <div className="bg-surface rounded-lg shadow-lg border border-subtle px-3 py-2">
                  <p className="text-sm font-medium text-foreground mb-1">{label}</p>
                  {payload.map((entry, index) => (
                    <p key={index} className="text-xs" style={{ color: entry.color }}>
                      {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}%
                    </p>
                  ))}
                </div>
              )
            }}
          />
        </RadarChart>
      </ResponsiveContainer>

      {/* Note about inverted metrics */}
      {selectedMetrics.some((m) => ['rmse', 'mae', 'mse', 'mape'].includes(m.toLowerCase())) && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Note: Error metrics (RMSE, MAE) are inverted so higher is better on the chart.
        </p>
      )}
    </motion.div>
  )
}

export default MetricsRadarChart
