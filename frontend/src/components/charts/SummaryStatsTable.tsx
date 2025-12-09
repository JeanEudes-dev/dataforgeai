import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils'
import type { SummaryStats } from '@/types'

interface SummaryStatsTableProps {
  data: Record<string, SummaryStats>
}

type SortKey = 'column' | 'count' | 'mean' | 'std' | 'min' | 'max'
type SortOrder = 'asc' | 'desc'

export function SummaryStatsTable({ data }: SummaryStatsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('column')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null)

  const columns = useMemo(() => {
    const entries = Object.entries(data).map(([column, stats]) => ({
      column,
      ...stats,
    }))

    return entries.sort((a, b) => {
      const aVal = sortKey === 'column' ? a.column : a[sortKey]
      const bVal = sortKey === 'column' ? b.column : b[sortKey]

      if (aVal === null) return 1
      if (bVal === null) return -1

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortOrder === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [data, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const formatValue = (value: number | null, decimals = 2): string => {
    if (value === null) return '-'
    if (Math.abs(value) >= 1000000) return (value / 1000000).toFixed(1) + 'M'
    if (Math.abs(value) >= 1000) return (value / 1000).toFixed(1) + 'K'
    return value.toFixed(decimals)
  }

  const SortIcon = ({ column }: { column: SortKey }) => (
    <span className="ml-1 inline-flex flex-col text-[8px] leading-none">
      <span className={cn(sortKey === column && sortOrder === 'asc' ? 'text-primary-500' : 'text-gray-300')}>▲</span>
      <span className={cn(sortKey === column && sortOrder === 'desc' ? 'text-primary-500' : 'text-gray-300')}>▼</span>
    </span>
  )

  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No summary statistics available
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="overflow-hidden rounded-xl border border-gray-200"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {(['column', 'count', 'mean', 'std', 'min', 'max'] as SortKey[]).map((key) => (
                <th
                  key={key}
                  onClick={() => handleSort(key)}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-gray-600 cursor-pointer hover:bg-gray-100 transition-colors',
                    key === 'column' ? 'sticky left-0 bg-gray-50 z-10' : ''
                  )}
                >
                  <div className="flex items-center">
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                    <SortIcon column={key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {columns.map((row, index) => (
              <motion.tr
                key={row.column}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                onClick={() => setExpandedColumn(expandedColumn === row.column ? null : row.column)}
                className={cn(
                  'cursor-pointer transition-colors',
                  expandedColumn === row.column ? 'bg-primary-50' : 'hover:bg-gray-50'
                )}
              >
                <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-inherit">
                  <div className="flex items-center gap-2">
                    <motion.span
                      animate={{ rotate: expandedColumn === row.column ? 90 : 0 }}
                      className="text-gray-400"
                    >
                      ›
                    </motion.span>
                    <span className="truncate max-w-[150px]" title={row.column}>
                      {row.column}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600 font-mono">{row.count.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{formatValue(row.mean)}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{formatValue(row.std)}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{formatValue(row.min)}</td>
                <td className="px-4 py-3 text-gray-600 font-mono">{formatValue(row.max)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expandedColumn && data[expandedColumn] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-200 bg-gray-50"
          >
            <div className="p-4 grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">25th Percentile</p>
                <p className="font-mono font-medium text-gray-900">
                  {formatValue(data[expandedColumn]['25%'])}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Median (50%)</p>
                <p className="font-mono font-medium text-gray-900">
                  {formatValue(data[expandedColumn]['50%'])}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">75th Percentile</p>
                <p className="font-mono font-medium text-gray-900">
                  {formatValue(data[expandedColumn]['75%'])}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Range</p>
                <p className="font-mono font-medium text-gray-900">
                  {data[expandedColumn].min !== null && data[expandedColumn].max !== null
                    ? formatValue(data[expandedColumn].max! - data[expandedColumn].min!)
                    : '-'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default SummaryStatsTable
