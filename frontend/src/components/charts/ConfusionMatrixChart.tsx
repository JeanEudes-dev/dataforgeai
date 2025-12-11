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
      <div className="w-full rounded-xl border border-subtle bg-surface p-4 text-sm text-muted-foreground">
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
      if (intensity > 0.7) return 'bg-success-500 text-white'
      if (intensity > 0.4) return 'bg-success-400 text-white'
      if (intensity > 0.1) return 'bg-success-200 dark:bg-success-800 text-success-900 dark:text-success-100'
      return 'bg-success-50 dark:bg-success-900/30 text-success-700 dark:text-success-300'
    } else {
      // Red for incorrect predictions (off-diagonal)
      if (intensity > 0.7) return 'bg-error-500 text-white'
      if (intensity > 0.4) return 'bg-error-400 text-white'
      if (intensity > 0.1) return 'bg-error-200 dark:bg-error-800 text-error-900 dark:text-error-100'
      if (intensity > 0) return 'bg-error-50 dark:bg-error-900/30 text-error-700 dark:text-error-300'
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
          <div className="text-xs text-center text-muted-foreground mb-2">
            Predicted Label
          </div>
          <div className="flex">
            {/* Y-axis label */}
            <div
              className="flex items-center justify-center text-xs text-muted-foreground -rotate-90 w-6"
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
                    className="text-xs text-center text-foreground truncate"
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
                    className="text-xs flex items-center justify-end pr-2 text-foreground truncate"
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
          <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-success-400" />
              <span>Correct (diagonal)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-error-400" />
              <span>Incorrect (off-diagonal)</span>
            </div>
          </div>
        </div>

        {/* Per-class metrics */}
        {showMetrics && classMetrics.length > 0 && (
          <div className="lg:w-64">
            <h4 className="text-sm font-medium text-foreground mb-3">
              Per-Class Metrics
            </h4>

            {/* Overall accuracy */}
            <div className="mb-4 p-3 rounded-lg bg-primary-muted border border-primary-subtle">
              <div className="text-xs text-primary">Overall Accuracy</div>
              <div className="text-xl font-bold text-primary">
                {(totalAccuracy * 100).toFixed(1)}%
              </div>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {classMetrics.map(({ label, precision, recall, f1 }) => (
                <div
                  key={label}
                  className="p-2 rounded-lg bg-surface border border-subtle"
                >
                  <div className="font-medium text-sm text-foreground truncate mb-1" title={label}>
                    {label}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">P: </span>
                      <span className="font-medium text-foreground">
                        {(precision * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">R: </span>
                      <span className="font-medium text-foreground">
                        {(recall * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">F1: </span>
                      <span className="font-medium text-foreground">
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
