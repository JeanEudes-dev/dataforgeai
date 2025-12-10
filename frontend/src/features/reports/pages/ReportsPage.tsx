import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Modal,
  Select,
  SkeletonCard,
} from '@/components/ui'
import { StatusBadge, EmptyState } from '@/components/shared'
import { reportsApi, datasetsApi, mlApi, getErrorMessage } from '@/api'
import { useToastActions } from '@/contexts'
import { formatRelativeTime } from '@/utils'
import type { ReportListItem, GenerateReportParams } from '@/types'

export function ReportsPage() {
  const queryClient = useQueryClient()
  const toast = useToastActions()
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [selectedDatasetId, setSelectedDatasetId] = useState('')
  const [selectedReportType, setSelectedReportType] = useState<'eda' | 'model' | 'full'>('full')
  const [selectedModelId, setSelectedModelId] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
  })

  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list(),
  })

  const { data: modelsData } = useQuery({
    queryKey: ['trained-models'],
    queryFn: () => mlApi.listModels(),
  })

  const generateMutation = useMutation({
    mutationFn: (params: GenerateReportParams) => reportsApi.generate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report generating', 'Your report is being generated in the background.')
      closeGenerateModal()
    },
    onError: (err) => {
      toast.error('Generation failed', getErrorMessage(err))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report deleted', 'The report has been removed.')
    },
    onError: (err) => {
      toast.error('Delete failed', getErrorMessage(err))
    },
  })

  const closeGenerateModal = () => {
    setIsGenerateModalOpen(false)
    setSelectedDatasetId('')
    setSelectedReportType('full')
    setSelectedModelId('')
  }

  const handleGenerate = () => {
    if (!selectedDatasetId) {
      toast.error('Missing dataset', 'Please select a dataset.')
      return
    }
    generateMutation.mutate({
      dataset_id: selectedDatasetId,
      report_type: selectedReportType,
      model_id: selectedReportType === 'model' || selectedReportType === 'full' ? selectedModelId || undefined : undefined,
    })
  }

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const reports = data?.results || []
  const datasets = datasetsData?.results || []
  const models = modelsData?.results || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50" />
        <div className="relative px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.08em] text-gray-500">Insights</p>
            <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
            <p className="text-sm text-gray-500 max-w-2xl">
              Generate EDA summaries or model performance packs; cards show status and freshness.
            </p>
          </div>
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setIsGenerateModalOpen(true)}
          >
            Generate report
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-error-500">Failed to load reports. Please try again.</p>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-8 h-8" />}
          title="No reports yet"
          description="Generate your first report to get a comprehensive summary of your data analysis."
          action={{
            label: 'Generate report',
            onClick: () => setIsGenerateModalOpen(true),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {reports.map((report: ReportListItem) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                layout
              >
                <Card hoverable className="h-full border border-gray-200 shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-700">
                          <DocumentTextIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {report.title}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatRelativeTime(report.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 truncate max-w-[180px]">
                        {report.dataset.name}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 capitalize">
                        {report.report_type} report
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-gray-200 bg-white">
                        <p className="text-xs text-gray-500 mb-1">Status</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{report.status}</p>
                      </div>
                      <div className="p-3 rounded-xl border border-gray-200 bg-white">
                        <p className="text-xs text-gray-500 mb-1">Updated</p>
                        <p className="text-sm font-semibold text-gray-900">
                          {formatRelativeTime(report.updated_at || report.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/reports/${report.id}`} className="flex-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                          disabled={report.status !== 'completed'}
                        >
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id, report.title)}
                        disabled={deleteMutation.isPending}
                      >
                        <TrashIcon className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Generate Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={closeGenerateModal}
        title="Generate report"
        description="Select a dataset and report type. Generation runs in the background."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeGenerateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedDatasetId}
              isLoading={generateMutation.isPending}
            >
              Generate
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4 flex items-start gap-3 text-sm text-gray-600">
            <SparklesIcon className="w-5 h-5 text-primary-500 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Background generation</p>
              <p>We’ll notify you and update the list when the report is ready. You can navigate away safely.</p>
            </div>
          </div>

          <Select
            label="Dataset"
            value={selectedDatasetId}
            onChange={setSelectedDatasetId}
            options={datasets
              .filter((d) => d.status === 'ready')
              .map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select a dataset..."
          />

          <Select
            label="Report type"
            value={selectedReportType}
            onChange={(value) => setSelectedReportType(value as 'eda' | 'model' | 'full')}
            options={[
              { value: 'eda', label: 'EDA only — data analysis summary' },
              { value: 'model', label: 'Model only — performance report' },
              { value: 'full', label: 'Full report — analysis + model' },
            ]}
          />

          {(selectedReportType === 'model' || selectedReportType === 'full') && (
            <Select
              label="Model (optional)"
              value={selectedModelId}
              onChange={setSelectedModelId}
              options={models.map((m) => ({
                value: m.id,
                label: `${m.display_name} — ${m.target_column}`,
              }))}
              placeholder="Select a model..."
            />
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ReportsPage
