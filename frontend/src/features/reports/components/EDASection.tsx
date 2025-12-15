import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import {
  DistributionChart,
  CorrelationHeatmap,
  MissingValuesChart,
  OutliersChart,
  SummaryStatsTable,
} from '@/components/charts'
import type { EnhancedReport } from '@/types'

// Interface to handle both current and legacy backend outlier data formats
interface RawOutlierData {
  method?: 'iqr' | 'zscore'
  count: number
  ratio?: number
  bounds?: {
    lower: number
    upper: number
  }
  // Legacy format fields
  lower_bound?: number
  upper_bound?: number
}

interface EDASectionProps {
  report: EnhancedReport
}

export function EDASection({ report }: EDASectionProps) {
  const eda = report.content?.eda
  const [showAllDistributions, setShowAllDistributions] = useState(false)

  if (!eda) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No EDA data available.</p>
        </CardContent>
      </Card>
    )
  }

  const distributions = eda.distributions || {}
  const distributionKeys = Object.keys(distributions)
  const displayedDistributions = showAllDistributions
    ? distributionKeys
    : distributionKeys.slice(0, 6)

  // Transform correlation data for the heatmap
  const correlationData = eda.correlation_matrix || {}
  // Transform missing analysis for the chart
  const missingData = Object.entries(eda.missing_analysis || {}).reduce(
    (acc, [col, data]) => {
      acc[col] = {
        count: data.count,
        ratio: data.ratio,
        pattern: data.pattern,
      }
      return acc
    },
    {} as typeof eda.missing_analysis
  )

  // Transform outlier analysis for the chart
  const outlierData = Object.entries(eda.outlier_analysis || {}).reduce(
    (acc, [col, data]) => {
      const rawData = data as RawOutlierData
      acc[col] = {
        method: rawData.method || 'iqr',
        count: rawData.count,
        ratio: rawData.ratio ?? 0,
        bounds: rawData.bounds ||
          (rawData.lower_bound !== undefined &&
            rawData.upper_bound !== undefined
            ? { lower: rawData.lower_bound, upper: rawData.upper_bound }
            : undefined),
      }
      return acc
    },
    {} as typeof eda.outlier_analysis
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Summary Statistics */}
      {eda.summary_stats && Object.keys(eda.summary_stats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <SummaryStatsTable data={eda.summary_stats} />
          </CardContent>
        </Card>
      )}

      {/* Distribution Charts */}
      {distributionKeys.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Column Distributions</CardTitle>
            {distributionKeys.length > 6 && (
              <button
                onClick={() => setShowAllDistributions(!showAllDistributions)}
                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                {showAllDistributions ? 'Show Less' : `Show All (${distributionKeys.length})`}
              </button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedDistributions.map((col) => (
                <motion.div
                  key={col}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                >
                  <DistributionChart
                    data={distributions[col]}
                    columnName={col}
                    height={180}
                  />
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Correlation Heatmap */}
      {Object.keys(correlationData).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Correlation Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CorrelationHeatmap matrix={correlationData} maxItems={10} />
          </CardContent>
        </Card>
      )}

      {/* Two-column layout for Missing Values and Outliers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Values */}
        {Object.keys(missingData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Missing Values</CardTitle>
            </CardHeader>
            <CardContent>
              <MissingValuesChart
                data={missingData}
                totalRows={report.content?.dataset?.row_count || 0}
              />
            </CardContent>
          </Card>
        )}

        {/* Outliers */}
        {Object.keys(outlierData).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Outliers Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <OutliersChart data={outlierData} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sample info */}
      {eda.sampled && (
        <div className="flex items-center justify-center">
          <div className="px-4 py-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Analysis performed on a sample of {eda.sample_size?.toLocaleString()} rows
              {eda.computation_time && ` (computed in ${eda.computation_time.toFixed(2)}s)`}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default EDASection
