import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Card,
  CardContent,
  Skeleton,
} from '@/components/ui'
import { reportsApi } from '@/api'
import type { ReportSection, EnhancedReport } from '@/types'

// Import report section components
import {
  ReportNavigation,
  DatasetOverviewSection,
  EDASection,
  ModelPerformanceSection,
  ModelComparisonSection,
  InsightsSection,
} from '../components'

export function SharedReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>()

  const [activeSection, setActiveSection] = useState<ReportSection>('overview')

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['shared-reports', shareToken],
    queryFn: () => reportsApi.getShared(shareToken!),
    enabled: !!shareToken,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })

  if (isLoading) {
    return <SharedReportSkeleton />
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span className="text-2xl">404</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Report Not Found
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              This report may have been removed, set to private, or the link is incorrect.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Go to Homepage
            </a>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Convert SharedReport to EnhancedReport shape for components
  const enhancedReport: EnhancedReport = {
    id: report.id,
    title: report.title,
    status: 'completed',
    created_at: report.created_at,
    updated_at: report.created_at,
    content: report.content as EnhancedReport['content'],
    ai_summary: report.ai_summary,
    model_comparison: report.model_comparison,
    report_metadata: report.report_metadata,
    is_public: true,
    share_url: null,
    share_token: null,
    error_message: '',
    dataset: {
      id: '',
      name: report.dataset_name || 'Dataset',
      description: '',
      original_filename: '',
      file_type: 'csv',
      file_size: 0,
      file_size_display: '',
      row_count: report.content?.dataset?.row_count || report.dataset_row_count || 0,
      column_count: report.content?.dataset?.column_count || report.dataset_column_count || 0,
      status: 'ready',
      created_at: report.created_at,
      updated_at: report.created_at,
    },
    trained_model: null,
    eda_result: null,
    report_type: 'full',
    all_models: [],
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <a href="/" className="text-xl font-bold text-primary-600 dark:text-primary-400">
                DataForge AI
              </a>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">Shared Report</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                Public Report
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Report Title Card */}
          <Card>
            <CardContent className="py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {report.title}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {report.dataset_name && (
                      <span>Dataset: {report.dataset_name}</span>
                    )}
                    <span>
                      Generated: {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    Shared via DataForge AI
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <ReportNavigation
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            report={enhancedReport}
          />

          {/* Content Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'overview' && (
                <DatasetOverviewSection report={enhancedReport} />
              )}
              {activeSection === 'eda' && (
                <EDASection report={enhancedReport} />
              )}
              {activeSection === 'model' && (
                <ModelPerformanceSection report={enhancedReport} />
              )}
              {activeSection === 'comparison' && (
                <ModelComparisonSection report={enhancedReport} />
              )}
              {activeSection === 'insights' && (
                <InsightsSection report={enhancedReport} />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer Notice */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This is a publicly shared report. Some data has been limited for privacy.
                    Want to create your own reports?{' '}
                    <a href="/" className="font-medium underline hover:text-blue-800 dark:hover:text-blue-200">
                      Get started with DataForge AI
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Report generated by DataForge AI - Automated Data Analytics & Machine Learning
          </div>
        </div>
      </footer>
    </div>
  )
}

// Loading skeleton
function SharedReportSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Skeleton className="w-48 h-8" />
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="py-6">
              <Skeleton className="w-96 h-8 mb-2" />
              <Skeleton className="w-64 h-4" />
            </CardContent>
          </Card>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="w-24 h-10 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="w-full h-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default SharedReportPage
