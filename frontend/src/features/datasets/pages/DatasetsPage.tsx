import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PlusIcon,
  DocumentIcon,
  TrashIcon,
  ArrowRightIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardContent,
  Button,
  Modal,
  Input,
  SkeletonCard,
} from '@/components/ui'
import { StatusBadge, EmptyState } from '@/components/shared'
import { FileUpload } from '@/components/forms'
import { datasetsApi, getErrorMessage } from '@/api'
import { useToastActions } from '@/contexts'
import { formatRelativeTime } from '@/utils'
import type { DatasetListItem } from '@/types'

export function DatasetsPage() {
  const queryClient = useQueryClient()
  const toast = useToastActions()
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [uploadName, setUploadName] = useState('')
  const [uploadDescription, setUploadDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Fetch datasets
  const { data, isLoading, error } = useQuery({
    queryKey: ['datasets'],
    queryFn: () => datasetsApi.list(),
  })

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: datasetsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      toast.success('Dataset uploaded', 'Your dataset is being processed.')
      closeUploadModal()
    },
    onError: (error) => {
      toast.error('Upload failed', getErrorMessage(error))
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: datasetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasets'] })
      toast.success('Dataset deleted', 'The dataset has been removed.')
    },
    onError: (error) => {
      toast.error('Delete failed', getErrorMessage(error))
    },
  })

  const closeUploadModal = () => {
    setIsUploadModalOpen(false)
    setUploadName('')
    setUploadDescription('')
    setSelectedFile(null)
  }

  const handleUpload = () => {
    if (!selectedFile) return

    uploadMutation.mutate({
      file: selectedFile,
      name: uploadName || undefined,
      description: uploadDescription || undefined,
    })
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id)
    }
  }

  const datasets = data?.results || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Datasets</h1>
          <p className="text-secondary mt-1">Manage your uploaded datasets</p>
        </div>
        <Button
          leftIcon={<PlusIcon className="w-5 h-5" />}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload Dataset
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
            <p className="text-error-500">Failed to load datasets. Please try again.</p>
          </CardContent>
        </Card>
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={<TableCellsIcon className="w-8 h-8" />}
          title="No datasets yet"
          description="Upload your first dataset to start analyzing data and training models."
          action={{
            label: 'Upload Dataset',
            onClick: () => setIsUploadModalOpen(true),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {datasets.map((dataset: DatasetListItem) => (
              <motion.div
                key={dataset.id}
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
                          <DocumentIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary truncate">
                            {dataset.name}
                          </h3>
                          <p className="text-xs text-muted">
                            {formatRelativeTime(dataset.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={dataset.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">File</span>
                        <span className="text-primary">{dataset.original_filename}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Size</span>
                        <span className="text-primary">{dataset.file_size_display}</span>
                      </div>
                      {dataset.row_count && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary">Rows</span>
                          <span className="text-primary">{dataset.row_count.toLocaleString()}</span>
                        </div>
                      )}
                      {dataset.column_count && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary">Columns</span>
                          <span className="text-primary">{dataset.column_count}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/datasets/${dataset.id}`} className="flex-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                        >
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dataset.id, dataset.name)}
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

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Upload Dataset"
        description="Upload a CSV or Excel file to analyze"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeUploadModal}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              isLoading={uploadMutation.isPending}
            >
              Upload
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FileUpload
            onFileSelect={setSelectedFile}
            onError={(error) => toast.error('File error', error)}
            isUploading={uploadMutation.isPending}
          />

          {selectedFile && (
            <>
              <Input
                label="Dataset name (optional)"
                placeholder="Enter a name for this dataset"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
              <Input
                label="Description (optional)"
                placeholder="Add a description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default DatasetsPage
