import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  PlayIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  Skeleton,
} from '@/components/ui'
import { datasetsApi, mlApi } from '@/api'
import { useToastActions } from '@/contexts'
import { cn } from '@/utils'
import type { TaskType } from '@/types'

export function TrainingPage() {
  const { datasetId } = useParams<{ datasetId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToastActions()

  const [targetColumn, setTargetColumn] = useState<string>('')
  const [taskType, setTaskType] = useState<TaskType>('classification')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])

  const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ['datasets', datasetId],
    queryFn: () => datasetsApi.get(datasetId!),
    enabled: !!datasetId,
  })

  const { data: schema } = useQuery({
    queryKey: ['datasets', datasetId, 'schema'],
    queryFn: () => datasetsApi.schema(datasetId!),
    enabled: !!datasetId && dataset?.status === 'ready',
  })

  const trainMutation = useMutation({
    mutationFn: mlApi.startTraining,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['training-jobs'] })
      toast.success('Training started', 'Your models are being trained in the background.')
      navigate(`/training/jobs/${data.id}`)
    },
    onError: () => {
      toast.error('Training failed', 'Could not start the training job.')
    },
  })

  const handleFeatureToggle = (column: string) => {
    setSelectedFeatures(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  const handleSelectAllFeatures = () => {
    if (!schema) return
    const allFeatures = schema.columns
      .filter(c => c.name !== targetColumn)
      .map(c => c.name)
    setSelectedFeatures(allFeatures)
  }

  const handleDeselectAllFeatures = () => {
    setSelectedFeatures([])
  }

  const handleSubmit = () => {
    if (!targetColumn) {
      toast.error('Missing target', 'Please select a target column.')
      return
    }
    if (selectedFeatures.length === 0) {
      toast.error('Missing features', 'Please select at least one feature column.')
      return
    }

    trainMutation.mutate({
      dataset_id: datasetId!,
      target_column: targetColumn,
      feature_columns: selectedFeatures,
      task_type: taskType,
    })
  }

  const numericColumns = schema?.columns.filter(c =>
    ['int64', 'float64', 'int32', 'float32', 'number'].includes(c.dtype.toLowerCase())
  ) || []

  const categoricalColumns = schema?.columns.filter(c =>
    ['object', 'string', 'category', 'bool'].includes(c.dtype.toLowerCase())
  ) || []

  if (datasetLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>
          <Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>
        </div>
      </div>
    )
  }

  if (!dataset || dataset.status !== 'ready') {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Dataset not ready for training.</p>
          <Link to="/datasets">
            <Button variant="secondary">Back to Datasets</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to={`/datasets/${datasetId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-primary">Train Models</h1>
            <p className="text-secondary mt-1">{dataset.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Type */}
          <Card>
            <CardHeader>
              <CardTitle>Task Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <button
                  onClick={() => setTaskType('classification')}
                  className={cn(
                    'flex-1 p-4 rounded-xl transition-all',
                    taskType === 'classification'
                      ? 'neu-pressed bg-primary-50 dark:bg-primary-900/30'
                      : 'neu-raised hover:neu-button'
                  )}
                >
                  <p className="font-semibold text-primary">Classification</p>
                  <p className="text-sm text-secondary mt-1">
                    Predict categories or labels
                  </p>
                </button>
                <button
                  onClick={() => setTaskType('regression')}
                  className={cn(
                    'flex-1 p-4 rounded-xl transition-all',
                    taskType === 'regression'
                      ? 'neu-pressed bg-primary-50 dark:bg-primary-900/30'
                      : 'neu-raised hover:neu-button'
                  )}
                >
                  <p className="font-semibold text-primary">Regression</p>
                  <p className="text-sm text-secondary mt-1">
                    Predict numeric values
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Target Column */}
          <Card>
            <CardHeader>
              <CardTitle>Target Column</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={targetColumn}
                onChange={(value) => {
                  setTargetColumn(value)
                  setSelectedFeatures(prev => prev.filter(c => c !== value))
                }}
                options={
                  schema?.columns.map(c => ({
                    value: c.name,
                    label: `${c.name} (${c.dtype})`,
                  })) || []
                }
                placeholder="Select target column..."
              />
              <p className="text-sm text-muted mt-2">
                This is the column you want to predict.
              </p>
            </CardContent>
          </Card>

          {/* Feature Columns */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Feature Columns</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleSelectAllFeatures}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDeselectAllFeatures}>
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {numericColumns.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary mb-2">Numeric</p>
                    <div className="flex flex-wrap gap-2">
                      {numericColumns.map(col => (
                        <button
                          key={col.name}
                          onClick={() => col.name !== targetColumn && handleFeatureToggle(col.name)}
                          disabled={col.name === targetColumn}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm transition-all',
                            col.name === targetColumn
                              ? 'opacity-50 cursor-not-allowed bg-neutral-200 dark:bg-neutral-700'
                              : selectedFeatures.includes(col.name)
                              ? 'neu-pressed bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                              : 'neu-raised hover:neu-button'
                          )}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {categoricalColumns.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary mb-2">Categorical</p>
                    <div className="flex flex-wrap gap-2">
                      {categoricalColumns.map(col => (
                        <button
                          key={col.name}
                          onClick={() => col.name !== targetColumn && handleFeatureToggle(col.name)}
                          disabled={col.name === targetColumn}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-sm transition-all',
                            col.name === targetColumn
                              ? 'opacity-50 cursor-not-allowed bg-neutral-200 dark:bg-neutral-700'
                              : selectedFeatures.includes(col.name)
                              ? 'neu-pressed bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                              : 'neu-raised hover:neu-button'
                          )}
                        >
                          {col.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted mt-4">
                Selected: {selectedFeatures.length} of {(schema?.columns.length || 0) - (targetColumn ? 1 : 0)} columns
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Training Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-secondary">Dataset</dt>
                  <dd className="text-primary font-medium truncate max-w-32">{dataset.name}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Rows</dt>
                  <dd className="text-primary font-medium">{dataset.row_count?.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Task Type</dt>
                  <dd className="text-primary font-medium capitalize">{taskType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Target</dt>
                  <dd className="text-primary font-medium">{targetColumn || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-secondary">Features</dt>
                  <dd className="text-primary font-medium">{selectedFeatures.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-info-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-secondary">
                    Training will evaluate multiple algorithms and select the best one based on performance metrics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleSubmit}
            isLoading={trainMutation.isPending}
            leftIcon={<PlayIcon className="w-5 h-5" />}
            className="w-full"
            disabled={!targetColumn || selectedFeatures.length === 0}
          >
            Start Training
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TrainingPage
