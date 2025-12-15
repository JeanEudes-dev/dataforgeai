import { motion } from 'framer-motion'
import {
  TableCellsIcon,
  ViewColumnsIcon,
  DocumentIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { DataQualityGauge } from '@/components/charts'
import { formatNumber, cn } from '@/utils'
import type { EnhancedReport } from '@/types'

interface DatasetOverviewSectionProps {
  report: EnhancedReport
}

export function DatasetOverviewSection({ report }: DatasetOverviewSectionProps) {
  const dataset = report.content?.dataset
  const eda = report.content?.eda
  const metadata = report.report_metadata

  if (!dataset) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">No dataset information available.</p>
        </CardContent>
      </Card>
    )
  }

  // Calculate missing values percentage
  const totalMissing = eda?.missing_values_summary?.reduce((sum, m) => sum + m.count, 0) ?? 0
  const totalCells = (dataset.row_count || 0) * (dataset.column_count || 0)
  const missingPercentage = totalCells > 0 ? (totalMissing / totalCells) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TileStat label="Rows" value={formatNumber(dataset.row_count)} icon={<TableCellsIcon className="w-5 h-5 text-primary-600" />} />
        <TileStat label="Columns" value={formatNumber(dataset.column_count)} icon={<ViewColumnsIcon className="w-5 h-5 text-gray-600" />} />
        <TileStat label="File type" value={dataset.file_type?.toUpperCase() || 'N/A'} icon={<DocumentIcon className="w-5 h-5 text-blue-600" />} />
        <TileStat label="File size" value={dataset.file_size_display || 'N/A'} icon={<ClockIcon className="w-5 h-5 text-amber-600" />} />
      </div>

      {/* Data Quality & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Data Quality Gauge */}
        {eda?.data_quality_score !== undefined && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Quality</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center py-4">
              <DataQualityGauge score={eda.data_quality_score} size="lg" />
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <Card className={eda?.data_quality_score !== undefined ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="text-base">Quick statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatTile label="Total cells" value={formatNumber(totalCells)} />
              <StatTile label="Missing values" value={`${missingPercentage.toFixed(1)}%`} tone="warning" />
              <StatTile label="Insights found" value={metadata?.total_insights || 0} />
              <StatTile label="Models trained" value={metadata?.models_count || 0} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Schema */}
      {dataset.columns && dataset.columns.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="text-base">Column schema</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-semibold">Column</th>
                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-semibold">Missing %</th>
                    <th className="px-4 py-3 text-left text-gray-600 dark:text-gray-400 font-semibold">Unique</th>
                  </tr>
                </thead>
                <tbody>
                  {dataset.columns.slice(0, 15).map((col, index) => (
                    <motion.tr
                      key={col.name}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[220px]" title={col.name}>
                        {col.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-semibold',
                          col.dtype === 'numeric'
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : col.dtype === 'categorical'
                            ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                            : col.dtype === 'datetime'
                            ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : col.dtype === 'text'
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        )}>
                          {col.dtype}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        <span className={col.null_ratio > 20 ? 'text-red-500' : col.null_ratio > 5 ? 'text-amber-600 dark:text-amber-500' : 'text-gray-700 dark:text-gray-300'}>
                          {col.null_ratio?.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                        {formatNumber(col.unique_count)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {dataset.columns.length > 15 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3 pb-3">
                  Showing 15 of {dataset.columns.length} columns
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  )
}

function TileStat({
  label,
  value,
  icon,
}: {
  label: string
  value: string | number | undefined
  icon: React.ReactNode
}) {
  return (
    <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value ?? '-'}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatTile({
  label,
  value,
  tone,
}: {
  label: string
  value: string | number
  tone?: 'warning'
}) {
  const toneClass = tone === 'warning' ? 'text-amber-700 dark:text-amber-500' : 'text-gray-900 dark:text-gray-100'
  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.12)]">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</div>
      <div className={cn('text-lg font-semibold', toneClass)}>{value}</div>
    </div>
  )
}

export default DatasetOverviewSection
