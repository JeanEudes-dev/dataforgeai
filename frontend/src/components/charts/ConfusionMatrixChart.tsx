import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface ConfusionMatrixChartProps {
  matrix: number[][]
  labels?: string[]
  height?: number
  showMetrics?: boolean
}

interface CellData {
  x: number
  y: number
  value: number
  isCorrect: boolean
}

export function ConfusionMatrixChart({
  matrix,
  labels,
  height = 350,
  showMetrics = true,
}: ConfusionMatrixChartProps) {
  // Generate cell data and calculate metrics
  const { cells, maxValue, classMetrics, totalAccuracy } = useMemo(() => {
    if (!matrix || matrix.length === 0) {
      return { cells: [], maxValue: 0, classMetrics: [], totalAccuracy: 0 }
    }

    const cells: CellData[] = []
    let maxVal = 0
    let totalCorrect = 0
    let totalSamples = 0

    matrix.forEach((row, i) => {
      row.forEach((value, j) => {
        cells.push({
          x: j,
          y: i,
          value,
          isCorrect: i === j,
        })
        maxVal = Math.max(maxVal, value)
        totalSamples += value
        if (i === j) totalCorrect += value
      })
    })

    // Calculate per-class metrics
    const n = matrix.length
    const classMetrics = matrix.map((row, i) => {
      const tp = matrix[i][i]
      const fp = matrix.reduce((sum, r, j) => (j !== i ? sum + r[i] : sum), 0)
      const fn = row.reduce((sum, v, j) => (j !== i ? sum + v : sum), 0)
      const precision = tp + fp > 0 ? tp / (tp + fp) : 0
      const recall = tp + fn > 0 ? tp / (tp + fn) : 0

      return {
        label: labels?.[i] || `Class ${i}`,
        precision,
        recall,
        f1: precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0,
      }
    })

    return {
      cells,
      maxValue: maxVal,
      classMetrics,
      totalAccuracy: totalSamples > 0 ? totalCorrect / totalSamples : 0,
    }
  }, [matrix, labels])

  if (!matrix || matrix.length === 0) {
    return (
      <div className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-sm text-gray-500 dark:text-gray-400">
        No confusion matrix data available.
      </div>
    )
  }

  const n = matrix.length
  const cellSize = Math.min(60, (height - 80) / n)

  // Color scale function (blue gradient)
  const getColor = (value: number, isCorrect: boolean) => {
    if (maxValue === 0) return 'bg-gray-100 dark:bg-gray-700'

    const intensity = value / maxValue

    if (isCorrect) {
      // Green for correct predictions (diagonal)
      if (intensity > 0.7) return 'bg-green-500 text-white'
      if (intensity > 0.4) return 'bg-green-400 text-white'
      if (intensity > 0.1) return 'bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100'
      return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
    } else {
      // Red for incorrect predictions (off-diagonal)
      if (intensity > 0.7) return 'bg-red-500 text-white'
      if (intensity > 0.4) return 'bg-red-400 text-white'
      if (intensity > 0.1) return 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
      if (intensity > 0) return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      return 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Matrix */}
        <div className="flex-1">
          <div className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
            Predicted Label
          </div>
          <div className="flex">
            {/* Y-axis label */}
            <div
              className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 -rotate-90 w-6"
              style={{ minHeight: n * cellSize + 20 }}
            >
              Actual Label
            </div>

            <div className="flex flex-col items-center">
              {/* X-axis labels */}
              <div className="flex gap-1 mb-1">
                <div style={{ width: cellSize }} />
                {(labels || Array.from({ length: n }, (_, i) => `${i}`)).map((label, i) => (
                  <div
                    key={i}
                    style={{ width: cellSize }}
                    className="text-xs text-center text-gray-600 dark:text-gray-400 truncate"
                    title={label}
                  >
                    {label.length > 8 ? `${label.slice(0, 8)}...` : label}
                  </div>
                ))}
              </div>

              {/* Matrix rows */}
              {matrix.map((row, i) => (
                <div key={i} className="flex gap-1 mb-1">
                  {/* Y-axis label for this row */}
                  <div
                    style={{ width: cellSize }}
                    className="text-xs flex items-center justify-end pr-2 text-gray-600 dark:text-gray-400 truncate"
                    title={labels?.[i] || `${i}`}
                  >
                    {(labels?.[i] || `${i}`).slice(0, 8)}
                  </div>

                  {/* Cells */}
                  {row.map((value, j) => (
                    <motion.div
                      key={`${i}-${j}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: (i * n + j) * 0.02 }}
                      style={{ width: cellSize, height: cellSize }}
                      className={`
                        flex items-center justify-center rounded-md text-xs font-medium
                        transition-all hover:ring-2 hover:ring-primary-400 hover:z-10
                        ${getColor(value, i === j)}
                      `}
                      title={`Actual: ${labels?.[i] || i}, Predicted: ${labels?.[j] || j}, Count: ${value}`}
                    >
                      {value > 0 ? value.toLocaleString() : '-'}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-400" />
              <span>Correct (diagonal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-400" />
              <span>Incorrect (off-diagonal)</span>
            </div>
          </div>
        </div>

        {/* Per-class metrics */}
        {showMetrics && classMetrics.length > 0 && (
          <div className="lg:w-64">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Per-Class Metrics
            </h4>

            {/* Overall accuracy */}
            <div className="mb-4 p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800">
              <div className="text-xs text-primary-600 dark:text-primary-400">Overall Accuracy</div>
              <div className="text-xl font-bold text-primary-700 dark:text-primary-300">
                {(totalAccuracy * 100).toFixed(1)}%
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {classMetrics.map(({ label, precision, recall, f1 }) => (
                <div
                  key={label}
                  className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                >
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate mb-1" title={label}>
                    {label}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">P: </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {(precision * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">R: </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {(recall * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">F1: </span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {(f1 * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ConfusionMatrixChart
