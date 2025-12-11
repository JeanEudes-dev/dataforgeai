import { Link } from 'react-router-dom'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PrinterIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui'
import { StatusBadge } from '@/components/shared'
import { formatDateTime } from '@/utils'
import type { EnhancedReport } from '@/types'

interface ReportHeaderProps {
  report: EnhancedReport
  onExport: () => void
  onShare: () => void
  onPrint: () => void
  isExporting?: boolean
}

export function ReportHeader({
  report,
  onExport,
  onShare,
  onPrint,
  isExporting = false,
}: ReportHeaderProps) {
  const reportTypeLabels = {
    full: 'Full Analysis',
    eda: 'EDA',
    model: 'Model',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-5"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-14 -top-16 w-56 h-56 bg-primary-50 dark:bg-primary-900/10 rounded-full blur-3xl" />
        <div className="absolute -left-20 bottom-0 w-48 h-48 bg-gray-100 dark:bg-gray-800/20 rounded-full blur-3xl" />
      </div>

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Back button, title, metadata */}
        <div className="flex items-start gap-4">
          <Link to="/reports">
            <Button variant="ghost" size="sm" className="mt-1">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {report.title}
              </h1>
              <StatusBadge status={report.status} />
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                {reportTypeLabels[report.report_type]}
              </span>
              {report.is_public && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                  Shared
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-primary-500" />
                Generated {formatDateTime(report.created_at)}
              </span>
              {report.dataset && (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                  Dataset: {report.dataset.name}
                </span>
              )}
              {report.report_metadata?.models_count > 0 && (
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600" />
                  {report.report_metadata.models_count} model{report.report_metadata.models_count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrint}
            className="hidden sm:flex"
            title="Print report"
          >
            <PrinterIcon className="w-5 h-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onShare}
            title="Share report"
          >
            <ShareIcon className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Share</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onExport}
            isLoading={isExporting}
            disabled={report.status !== 'completed'}
            leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
          >
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export default ReportHeader
