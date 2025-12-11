import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils'

interface CorrelationHeatmapProps {
  matrix: Record<string, Record<string, number>>
  maxItems?: number
}

function getCorrelationColor(value: number): string {
  const absValue = Math.abs(value)

  if (value > 0) {
    // Positive correlations - blue
    if (absValue >= 0.7) return 'bg-primary-500 text-white'
    if (absValue >= 0.5) return 'bg-primary-400 text-white'
    if (absValue >= 0.3)
      return 'bg-primary-300 text-primary-800 dark:bg-primary-700 dark:text-primary-100'
    return 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200'
  } else if (value < 0) {
    // Negative correlations - red/orange
    if (absValue >= 0.7) return 'bg-error-500 text-white'
    if (absValue >= 0.5) return 'bg-error-400 text-white'
    if (absValue >= 0.3)
      return 'bg-warning-400 text-warning-900 dark:bg-warning-700 dark:text-warning-100'
    return 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-200'
  }

  return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
}

function getStrengthLabel(value: number): string {
  const absValue = Math.abs(value)
  if (absValue >= 0.7) return 'Strong'
  if (absValue >= 0.5) return 'Moderate'
  if (absValue >= 0.3) return 'Weak'
  return 'Very weak'
}

export function CorrelationHeatmap({ matrix, maxItems = 8 }: CorrelationHeatmapProps) {
  const columns = useMemo(() => {
    return Object.keys(matrix).slice(0, maxItems)
  }, [matrix, maxItems])

  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No correlation data available
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="overflow-x-auto"
    >
      <div className="inline-block min-w-full">
        {/* Header row */}
        <div className="flex">
          <div className="w-24 shrink-0" /> {/* Empty corner */}
          {columns.map((col, i) => (
            <motion.div
              key={col}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-16 h-24 flex items-end justify-center pb-2"
            >
              <span
                className="text-xs text-muted-foreground font-medium transform -rotate-45 origin-bottom-left whitespace-nowrap truncate max-w-[80px]"
                title={col}
              >
                {col.length > 10 ? `${col.slice(0, 10)}...` : col}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Data rows */}
        {columns.map((row, rowIndex) => (
          <motion.div
            key={row}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rowIndex * 0.05 }}
            className="flex items-center"
          >
            {/* Row label */}
            <div className="w-24 shrink-0 pr-2 text-right">
              <span
                className="text-xs text-muted-foreground font-medium truncate block"
                title={row}
              >
                {row.length > 12 ? `${row.slice(0, 12)}...` : row}
              </span>
            </div>

            {/* Cells */}
            {columns.map((col, colIndex) => {
              const value = matrix[row]?.[col] ?? 0
              const isDiagonal = row === col

              return (
                <motion.div
                  key={`${row}-${col}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: (rowIndex + colIndex) * 0.02 }}
                  whileHover={{ scale: 1.1, zIndex: 10 }}
                  className={cn(
                    'w-16 h-12 flex items-center justify-center m-0.5 rounded-md cursor-pointer transition-all',
                    isDiagonal ? 'bg-muted text-muted-foreground' : getCorrelationColor(value)
                  )}
                  title={`${row} × ${col}: ${value.toFixed(3)} (${getStrengthLabel(value)})`}
                >
                  <span className="text-xs font-medium">
                    {isDiagonal ? '1.00' : value.toFixed(2)}
                  </span>
                </motion.div>
              )
            })}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Negative</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-error-500" />
            <div className="w-4 h-4 rounded bg-error-400" />
            <div className="w-4 h-4 rounded bg-warning-400" />
            <div className="w-4 h-4 rounded bg-warning-100" />
          </div>
        </div>
        <div className="w-px h-4 bg-subtle" />
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded bg-primary-100" />
            <div className="w-4 h-4 rounded bg-primary-300" />
            <div className="w-4 h-4 rounded bg-primary-400" />
            <div className="w-4 h-4 rounded bg-primary-500" />
          </div>
          <span className="text-xs text-muted-foreground">Positive</span>
        </div>
      </div>
    </motion.div>
  )
}

export default CorrelationHeatmap
