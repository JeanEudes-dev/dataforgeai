import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts'
import { motion } from 'framer-motion'
import type { ModelComparisonEntry } from '@/types'

interface ModelComparisonChartProps {
  models: ModelComparisonEntry[]
  metric?: string
  height?: number
}

const COLORS = {
  best: '#22c55e', // Green for best model
  default: '#3b82f6', // Blue for other models
  hover: '#2563eb',
}

export function ModelComparisonChart({
  models,
  metric,
  height = 300,
}: ModelComparisonChartProps) {
  const { chartData, selectedMetric, isPercentageMetric } = useMemo(() => {
    if (!models || models.length === 0) {
      return { chartData: [], selectedMetric: '', isPercentageMetric: false }
    }

    // Determine task type from first model
    const taskType = models[0].task_type

    // Select appropriate metric
    let metricKey = metric
    if (!metricKey) {
      metricKey = taskType === 'classification' ? 'f1' : 'r2'
    }

    // Check available metrics across models
    const availableMetrics = new Set<string>()
    models.forEach((m) => {
      if (m.metrics) {
        Object.keys(m.metrics).forEach((k) => {
          // Filter out array/object metrics
          if (typeof m.metrics[k as keyof typeof m.metrics] === 'number') {
            availableMetrics.add(k)
          }
        })
      }
    })

    // Fallback metric if selected not available
    if (!availableMetrics.has(metricKey)) {
      const fallbacks = taskType === 'classification'
        ? ['f1_score', 'f1', 'accuracy', 'roc_auc']
        : ['r2_score', 'r2', 'rmse', 'mae']
      metricKey = fallbacks.find((f) => availableMetrics.has(f)) || Array.from(availableMetrics)[0] || 'accuracy'
    }

    // Determine if metric is typically shown as percentage
    const percentageMetrics = ['accuracy', 'precision', 'recall', 'f1', 'f1_score', 'f1_weighted', 'roc_auc', 'r2', 'r2_score']
    const isPct = percentageMetrics.includes(metricKey)

    // Prepare chart data
    const data = models.map((model) => {
      const rawValue = model.metrics?.[metricKey as keyof typeof model.metrics] as number | undefined
      const value = rawValue !== undefined ? (isPct ? rawValue * 100 : rawValue) : 0

      return {
        id: model.id,
        name: model.display_name.length > 20 ? `${model.display_name.slice(0, 20)}...` : model.display_name,
        fullName: model.display_name,
        algorithm: model.algorithm_type,
        value,
        rawValue: rawValue ?? 0,
        is_best: model.is_best,
      }
    })

    // Sort by value descending (or ascending for error metrics like RMSE, MAE)
    const errorMetrics = ['rmse', 'mae', 'mse', 'mape']
    if (errorMetrics.includes(metricKey.toLowerCase())) {
      data.sort((a, b) => a.value - b.value)
    } else {
      data.sort((a, b) => b.value - a.value)
    }

    return {
      chartData: data,
      selectedMetric: metricKey,
      isPercentageMetric: isPct,
    }
  }, [models, metric])

  if (!models || models.length === 0) {
    return (
      <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
        No model comparison data available.
      </div>
    )
  }

  const formatMetricName = (name: string) => {
    return name
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="text-sm text-center text-gray-600 dark:text-gray-400 mb-4">
        Comparing by: <span className="font-medium text-gray-900 dark:text-gray-100">{formatMetricName(selectedMetric)}</span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={true} vertical={false} />
          <XAxis
            type="number"
            domain={isPercentageMetric ? [0, 100] : ['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={{ stroke: '#e4e4e7' }}
            tickFormatter={(value) => (isPercentageMetric ? `${value.toFixed(0)}%` : value.toFixed(3))}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            width={150}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload
              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.fullName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Algorithm: {item.algorithm.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatMetricName(selectedMetric)}: {isPercentageMetric ? `${item.value.toFixed(2)}%` : item.rawValue.toFixed(4)}
                  </p>
                  {item.is_best && (
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                      Best Model
                    </p>
                  )}
                </div>
              )
            }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={40}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.is_best ? COLORS.best : COLORS.default}
                opacity={entry.is_best ? 1 : 0.7}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500" />
          <span>Best Model</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500" />
          <span>Other Models</span>
        </div>
      </div>
    </motion.div>
  )
}

export default ModelComparisonChart
