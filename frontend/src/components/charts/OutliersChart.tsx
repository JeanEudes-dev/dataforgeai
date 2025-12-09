import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'
import type { OutlierAnalysis } from '@/types'

interface OutliersChartProps {
  data: Record<string, OutlierAnalysis>
}

function getSeverityColor(ratio: number): string {
  if (ratio >= 0.1) return 'bg-error-500'
  if (ratio >= 0.05) return 'bg-warning-500'
  if (ratio >= 0.01) return 'bg-primary-400'
  return 'bg-success-500'
}

function getSeverityDotColor(ratio: number): string {
  if (ratio >= 0.1) return 'bg-error-400'
  if (ratio >= 0.05) return 'bg-warning-400'
  if (ratio >= 0.01) return 'bg-primary-300'
  return 'bg-success-400'
}

export function OutliersChart({ data }: OutliersChartProps) {
  const sortedData = useMemo(() => {
    return Object.entries(data)
      .map(([column, analysis]) => ({
        column,
        ...analysis,
      }))
      .filter((d) => d.count > 0)
      .sort((a, b) => b.ratio - a.ratio)
  }, [data])

  const totalOutliers = sortedData.reduce((sum, d) => sum + d.count, 0)

  if (sortedData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-100 mb-3">
          <svg className="w-6 h-6 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">No outliers detected</p>
        <p className="text-sm text-gray-500 mt-1">Your data looks clean!</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm text-gray-500">Total Outliers Detected</p>
          <p className="text-2xl font-bold text-gray-900">{totalOutliers.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Columns Affected</p>
          <p className="text-2xl font-bold text-gray-900">{sortedData.length}</p>
        </div>
      </div>

      {/* Outlier cards */}
      <div className="grid gap-3">
        {sortedData.map((item, index) => (
          <motion.div
            key={item.column}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-2 h-2 rounded-full', getSeverityDotColor(item.ratio))} />
                <span className="font-medium text-gray-900">{item.column}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                  {item.method}
                </span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {(item.ratio * 100).toFixed(2)}%
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Mini bar */}
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(item.ratio * 100 * 5, 100)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className={cn('h-full rounded-full', getSeverityColor(item.ratio))}
                />
              </div>
              <span className="text-sm text-gray-500 shrink-0">
                {item.count.toLocaleString()} outliers
              </span>
            </div>

            {/* Bounds if available */}
            {item.bounds && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                <span>
                  Lower bound: <span className="font-mono text-gray-700">{item.bounds.lower.toFixed(2)}</span>
                </span>
                <span>
                  Upper bound: <span className="font-mono text-gray-700">{item.bounds.upper.toFixed(2)}</span>
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

export default OutliersChart
