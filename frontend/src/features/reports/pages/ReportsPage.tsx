import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardContent,
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

  // Fetch reports
  const { data, isLoading, error } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
  })

  // Fetch datasets for dropdown
  const { data: datasetsData } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list(),
  })

  // Fetch models for dropdown
  const { data: modelsData } = useQuery({
    queryKey: ['trained-models'],
    queryFn: () => mlApi.listModels(),
  })

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: (params: GenerateReportParams) => reportsApi.generate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report generating', 'Your report is being generated.')
      closeGenerateModal()
    },
    onError: (error) => {
      toast.error('Generation failed', getErrorMessage(error))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] })
      toast.success('Report deleted', 'The report has been removed.')
    },
    onError: (error) => {
      toast.error('Delete failed', getErrorMessage(error))
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Reports</h1>
          <p className="text-secondary mt-1">Generate and view analysis reports</p>
        </div>
        <Button
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsGenerateModalOpen(true)}
        >
          Generate Report
        </Button>
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
            label: 'Generate Report',
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card hoverable className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                          <DocumentTextIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary truncate">
                            {report.title}
                          </h3>
                          <p className="text-xs text-muted">
                            {formatRelativeTime(report.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Dataset</span>
                        <span className="text-primary truncate max-w-32">{report.dataset.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Type</span>
                        <span className="text-primary capitalize">{report.report_type}</span>
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
        title="Generate Report"
        description="Create a comprehensive analysis report"
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
        <div className="space-y-4">
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
            label="Report Type"
            value={selectedReportType}
            onChange={(value) => setSelectedReportType(value as 'eda' | 'model' | 'full')}
            options={[
              { value: 'eda', label: 'EDA Only - Data analysis summary' },
              { value: 'model', label: 'Model Only - Model performance report' },
              { value: 'full', label: 'Full Report - Complete analysis + model' },
            ]}
          />

          {(selectedReportType === 'model' || selectedReportType === 'full') && (
            <Select
              label="Model (Optional)"
              value={selectedModelId}
              onChange={setSelectedModelId}
              options={models.map((m) => ({
                value: m.id,
                label: `${m.algorithm} - ${m.target_column}`,
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
