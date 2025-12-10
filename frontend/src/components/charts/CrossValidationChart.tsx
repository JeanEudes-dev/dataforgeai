import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { motion } from 'framer-motion'

interface CrossValidationChartProps {
  scores: number[]
  height?: number
  metricName?: string
}

export function CrossValidationChart({
  scores,
  height = 250,
  metricName = 'Score',
}: CrossValidationChartProps) {
  const { chartData, stats } = useMemo(() => {
    if (!scores || scores.length === 0) {
      return { chartData: [], stats: null }
    }

    const chartData = scores.map((score, index) => ({
      fold: `Fold ${index + 1}`,
      score: score * 100, // Convert to percentage
      rawScore: score,
    }))

    // Calculate statistics
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length
    const std = Math.sqrt(variance)
    const min = Math.min(...scores)
    const max = Math.max(...scores)

    return {
      chartData,
      stats: {
        mean: mean * 100,
        std: std * 100,
        min: min * 100,
        max: max * 100,
        cv: (std / mean) * 100, // Coefficient of variation
      },
    }
  }, [scores])

  if (!scores || scores.length === 0) {
    return (
      <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
        No cross-validation scores available.
      </div>
    )
  }

  // Determine bar color based on deviation from mean
  const getBarColor = (score: number, mean: number, std: number) => {
    const deviation = Math.abs(score - mean)
    if (deviation < std * 0.5) return '#22c55e' // Green - within 0.5 std
    if (deviation < std) return '#3b82f6' // Blue - within 1 std
    if (deviation < std * 1.5) return '#f59e0b' // Amber - within 1.5 std
    return '#ef4444' // Red - beyond 1.5 std
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-4 gap-3 mb-4">
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Mean</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.mean.toFixed(1)}%
            </div>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Std Dev</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.std.toFixed(2)}%
            </div>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Min</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.min.toFixed(1)}%
            </div>
          </div>
          <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
            <div className="text-xs text-gray-500 dark:text-gray-400">Max</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.max.toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
          <XAxis
            dataKey="fold"
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={{ stroke: '#e4e4e7' }}
          />
          <YAxis
            domain={['auto', 'auto']}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(0)}%`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload
              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.fold}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {metricName}: {item.rawScore.toFixed(4)} ({item.score.toFixed(2)}%)
                  </p>
                  {stats && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Deviation: {(item.score - stats.mean).toFixed(2)}%
                    </p>
                  )}
                </div>
              )
            }}
          />
          {/* Mean reference line */}
          {stats && (
            <ReferenceLine
              y={stats.mean}
              stroke="#6b7280"
              strokeDasharray="5 5"
              label={{
                value: `Mean: ${stats.mean.toFixed(1)}%`,
                position: 'right',
                fontSize: 10,
                fill: '#6b7280',
              }}
            />
          )}
          {/* Standard deviation bands */}
          {stats && (
            <>
              <ReferenceLine
                y={stats.mean + stats.std}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
              <ReferenceLine
                y={stats.mean - stats.std}
                stroke="#9ca3af"
                strokeDasharray="3 3"
                strokeOpacity={0.5}
              />
            </>
          )}
          <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={stats ? getBarColor(entry.score, stats.mean, stats.std) : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Consistency indicator */}
      {stats && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Model Consistency:</span>
          <span
            className={`text-xs font-medium ${
              stats.cv < 5
                ? 'text-green-600 dark:text-green-400'
                : stats.cv < 10
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {stats.cv < 5 ? 'Highly Stable' : stats.cv < 10 ? 'Moderately Stable' : 'Variable'}
          </span>
          <span className="text-xs text-gray-400 dark:text-gray-500">(CV: {stats.cv.toFixed(1)}%)</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>&lt;0.5 std</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-500" />
          <span>&lt;1 std</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>&lt;1.5 std</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>&gt;1.5 std</span>
        </div>
      </div>
    </motion.div>
  )
}

export default CrossValidationChart
