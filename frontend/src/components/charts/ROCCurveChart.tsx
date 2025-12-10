import { useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { motion } from 'framer-motion'

interface ROCCurveData {
  fpr: number[]
  tpr: number[]
  thresholds?: (number | null)[]
}

interface ROCCurveChartProps {
  data: ROCCurveData
  auc?: number
  height?: number
}

export function ROCCurveChart({
  data,
  auc,
  height = 300,
}: ROCCurveChartProps) {
  const chartData = useMemo(() => {
    if (!data?.fpr || !data?.tpr) return []

    return data.fpr.map((fpr, i) => ({
      fpr,
      tpr: data.tpr[i],
      threshold: data.thresholds?.[i] ?? null,
    }))
  }, [data])

  // Calculate AUC if not provided (using trapezoidal rule)
  const calculatedAuc = useMemo(() => {
    if (auc !== undefined) return auc
    if (chartData.length < 2) return null

    let area = 0
    for (let i = 1; i < chartData.length; i++) {
      const dx = chartData[i].fpr - chartData[i - 1].fpr
      const avgY = (chartData[i].tpr + chartData[i - 1].tpr) / 2
      area += dx * avgY
    }
    return Math.abs(area)
  }, [chartData, auc])

  if (!data?.fpr || !data?.tpr || chartData.length === 0) {
    return (
      <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
        No ROC curve data available.
      </div>
    )
  }

  // Determine AUC quality
  const getAucQuality = (value: number) => {
    if (value >= 0.9) return { label: 'Excellent', color: 'text-green-600 dark:text-green-400' }
    if (value >= 0.8) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' }
    if (value >= 0.7) return { label: 'Fair', color: 'text-yellow-600 dark:text-yellow-400' }
    if (value >= 0.6) return { label: 'Poor', color: 'text-orange-600 dark:text-orange-400' }
    return { label: 'Fail', color: 'text-red-600 dark:text-red-400' }
  }

  const aucQuality = calculatedAuc !== null ? getAucQuality(calculatedAuc) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
          <defs>
            <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis
            dataKey="fpr"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={{ stroke: '#e4e4e7' }}
            tickFormatter={(value) => value.toFixed(1)}
            label={{
              value: 'False Positive Rate',
              position: 'bottom',
              offset: 10,
              style: { fontSize: 12, fill: '#71717a' },
            }}
          />
          <YAxis
            dataKey="tpr"
            type="number"
            domain={[0, 1]}
            tick={{ fontSize: 11, fill: '#71717a' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toFixed(1)}
            label={{
              value: 'True Positive Rate',
              angle: -90,
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 12, fill: '#71717a' },
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const item = payload[0].payload
              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    FPR: {item.fpr.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    TPR: {item.tpr.toFixed(3)}
                  </p>
                  {item.threshold !== null && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Threshold: {item.threshold.toFixed(3)}
                    </p>
                  )}
                </div>
              )
            }}
          />
          {/* Random classifier reference line (diagonal) */}
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke="#9ca3af"
            strokeDasharray="5 5"
            strokeWidth={1}
          />
          {/* ROC Curve */}
          <Area
            type="monotone"
            dataKey="tpr"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#rocGradient)"
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* AUC Display */}
      {calculatedAuc !== null && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">AUC Score: </span>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {calculatedAuc.toFixed(4)}
            </span>
            {aucQuality && (
              <span className={`ml-2 text-sm font-medium ${aucQuality.color}`}>
                ({aucQuality.label})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500" />
          <span>ROC Curve</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-gray-400 border-dashed border-t-2 border-gray-400" style={{ height: 0 }} />
          <span>Random Classifier</span>
        </div>
      </div>
    </motion.div>
  )
}

export default ROCCurveChart
