import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Card,
  CardContent,
  Skeleton,
  Button,
} from '@/components/ui'
import { reportsApi } from '@/api'
import { useToastActions } from '@/contexts'
import { downloadFile } from '@/utils'
import type { ReportSection, EnhancedReport } from '@/types'

// Import report section components
import {
  ReportHeader,
  ReportNavigation,
  DatasetOverviewSection,
  EDASection,
  ModelPerformanceSection,
  ModelComparisonSection,
  InsightsSection,
  ShareModal,
} from '../components'

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const toast = useToastActions()

  const [activeSection, setActiveSection] = useState<ReportSection>('overview')
  const [shareModalOpen, setShareModalOpen] = useState(false)

  const { data: report, isLoading, error, refetch } = useQuery({
    queryKey: ['reports', reportId],
    queryFn: () => reportsApi.get(reportId!),
    enabled: !!reportId,
  })

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.export(reportId!, 'pdf'),
    onSuccess: (blob) => {
      downloadFile(blob, `${report?.title || 'report'}.pdf`)
      toast.success('Export started', 'Your PDF is downloading.')
    },
    onError: () => {
      toast.error('Export failed', 'Could not export the report.')
    },
  })

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return <ReportDetailSkeleton />
  }

  if (error || !report) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Report not found or failed to load.</p>
          <Button variant="secondary" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </CardContent>
      </Card>
    )
  }

  // For incomplete reports, show a simple status card
  if (report.status !== 'completed') {
    return (
      <div className="space-y-6">
        <ReportHeader
          report={report as EnhancedReport}
          onExport={() => {}}
          onShare={() => {}}
          onPrint={() => {}}
          isExporting={false}
        />
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mb-4">
              {report.status === 'generating' && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin" />
              )}
              {report.status === 'pending' && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <span className="text-2xl">⏳</span>
                </div>
              )}
              {report.status === 'error' && (
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
              )}
            </div>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
              {report.status === 'generating'
                ? 'Report is being generated...'
                : report.status === 'pending'
                ? 'Report is queued for generation...'
                : 'Report generation failed.'}
            </p>
            {report.error_message && (
              <p className="text-sm text-red-500 mt-2">{report.error_message}</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <ReportHeader
        report={report as EnhancedReport}
        onExport={() => exportMutation.mutate()}
        onShare={() => setShareModalOpen(true)}
        onPrint={handlePrint}
        isExporting={exportMutation.isPending}
      />

      {/* Navigation */}
      <ReportNavigation
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        report={report as EnhancedReport}
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
            <DatasetOverviewSection report={report as EnhancedReport} />
          )}
          {activeSection === 'eda' && (
            <EDASection report={report as EnhancedReport} />
          )}
          {activeSection === 'model' && (
            <ModelPerformanceSection report={report as EnhancedReport} />
          )}
          {activeSection === 'comparison' && (
            <ModelComparisonSection report={report as EnhancedReport} />
          )}
          {activeSection === 'insights' && (
            <InsightsSection report={report as EnhancedReport} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        reportId={reportId!}
        currentShareUrl={report.share_url}
        isPublic={report.is_public}
        onShareToggle={refetch}
      />
    </div>
  )
}

// Loading skeleton
function ReportDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <div>
            <Skeleton className="w-64 h-8 mb-2" />
            <Skeleton className="w-48 h-4" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-24 h-9" />
          <Skeleton className="w-32 h-9" />
        </div>
      </div>

      {/* Navigation skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-24 h-10 rounded-lg" />
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="w-full h-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <Skeleton className="w-full h-64" />
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportDetailPage
