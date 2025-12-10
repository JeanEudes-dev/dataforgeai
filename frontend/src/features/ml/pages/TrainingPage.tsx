import { useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  PlayIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  HashtagIcon,
  TagIcon,
  SparklesIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  Skeleton,
  Input,
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
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleSelectNumeric = () => {
    if (!schema) return
    const numeric = schema.columns
      .filter(c => c.name !== targetColumn && ['int64', 'float64', 'int32', 'float32', 'number'].includes(c.dtype.toLowerCase()))
      .map(c => c.name)
    setSelectedFeatures(prev => [...new Set([...prev, ...numeric])])
  }

  const handleSelectCategorical = () => {
    if (!schema) return
    const categorical = schema.columns
      .filter(c => c.name !== targetColumn && ['object', 'string', 'category', 'bool'].includes(c.dtype.toLowerCase()))
      .map(c => c.name)
    setSelectedFeatures(prev => [...new Set([...prev, ...categorical])])
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

  const numericColumns = useMemo(() =>
    schema?.columns.filter(c =>
      ['int64', 'float64', 'int32', 'float32', 'number'].includes(c.dtype.toLowerCase())
    ) || []
  , [schema])

  const categoricalColumns = useMemo(() =>
    schema?.columns.filter(c =>
      ['object', 'string', 'category', 'bool'].includes(c.dtype.toLowerCase())
    ) || []
  , [schema])

  const filteredColumns = useMemo(() => {
    if (!schema) return { numeric: [], categorical: [] }
    const query = searchQuery.toLowerCase()
    return {
      numeric: numericColumns.filter(c => c.name.toLowerCase().includes(query)),
      categorical: categoricalColumns.filter(c => c.name.toLowerCase().includes(query)),
    }
  }, [schema, searchQuery, numericColumns, categoricalColumns])

  const availableColumns = (schema?.columns.length || 0) - (targetColumn ? 1 : 0)

  const setupSteps = [
    {
      title: 'Task type',
      detail: taskType === 'classification' ? 'Classification' : 'Regression',
      done: !!taskType,
    },
    {
      title: 'Target column',
      detail: targetColumn || 'Not selected',
      done: !!targetColumn,
    },
    {
      title: 'Feature set',
      detail: selectedFeatures.length ? `${selectedFeatures.length} selected` : 'Choose columns',
      done: selectedFeatures.length > 0,
    },
  ]

  if (datasetLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card><CardContent className="p-6"><Skeleton className="h-32" /></CardContent></Card>
            <Card><CardContent className="p-6"><Skeleton className="h-48" /></CardContent></Card>
          </div>
          <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>
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
    <div className="space-y-8 relative">
      {trainMutation.isPending && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.08em] text-gray-500">Training in progress</p>
                <p className="text-lg font-semibold text-gray-900">We’re starting your AutoML job</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              You can stay here while we queue the run. We’ll redirect to the job detail page as soon as it’s ready.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">Evaluating algorithms</div>
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">Checking data quality</div>
              <div className="p-3 rounded-xl border border-gray-200 bg-gray-50">Provisioning resources</div>
            </div>
          </div>
        </div>
      )}
      {/* Notion-inspired header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50" />
        <div className="relative px-6 py-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to={`/datasets/${datasetId}`}>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100">
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.08em] text-gray-500">Training workspace</p>
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="w-6 h-6 text-primary-500" />
                  <h1 className="text-2xl font-semibold text-gray-900">Train models</h1>
                </div>
                <p className="text-sm text-gray-500">{dataset.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
              <SparklesIcon className="w-4 h-4 text-primary-500" />
              <span>AutoML explores multiple model families for you.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold">01</div>
              <div>
                <p className="text-xs text-gray-500">Rows</p>
                <p className="text-base font-semibold text-gray-900">{dataset.row_count?.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold">02</div>
              <div>
                <p className="text-xs text-gray-500">Columns available</p>
                <p className="text-base font-semibold text-gray-900">{availableColumns}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-sm font-semibold">03</div>
              <div>
                <p className="text-xs text-gray-500">Progress</p>
                <p className="text-base font-semibold text-gray-900">
                  {((targetColumn ? 50 : 0) + (selectedFeatures.length > 0 ? 50 : 0))}% ready
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {setupSteps.map((step, idx) => (
              <div
                key={step.title}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors',
                  step.done ? 'border-primary-200 bg-primary-50 text-primary-800' : 'border-gray-200 bg-white text-gray-600'
                )}
              >
                <span className="text-xs font-semibold text-gray-400">0{idx + 1}</span>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-900">{step.title}</span>
                  <span className="text-xs text-gray-500">{step.detail}</span>
                </div>
                {step.done && (
                  <span className="ml-auto h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center">
                    <CheckIcon className="w-4 h-4" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Type */}
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-gray-500">Step 1</p>
                  <CardTitle>Task type</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Tell us what you want to predict. We will adapt the pipeline automatically.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setTaskType('classification')}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all shadow-[0_1px_0_rgba(0,0,0,0.04)]',
                    taskType === 'classification'
                      ? 'border-primary-300 bg-primary-50/80'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center border',
                    taskType === 'classification' ? 'border-primary-300 bg-white text-primary-700' : 'border-gray-200 text-gray-600'
                  )}>
                    <TagIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Classification</p>
                      {taskType === 'classification' && (
                        <span className="rounded-full bg-primary-500 text-white text-[10px] px-2 py-0.5 flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Predict categories or labels (e.g., churn, sentiment, intent).
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setTaskType('regression')}
                  className={cn(
                    'flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all shadow-[0_1px_0_rgba(0,0,0,0.04)]',
                    taskType === 'regression'
                      ? 'border-primary-300 bg-primary-50/80'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  )}
                >
                  <div className={cn(
                    'h-10 w-10 rounded-lg flex items-center justify-center border',
                    taskType === 'regression' ? 'border-primary-300 bg-white text-primary-700' : 'border-gray-200 text-gray-600'
                  )}>
                    <HashtagIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">Regression</p>
                      {taskType === 'regression' && (
                        <span className="rounded-full bg-primary-500 text-white text-[10px] px-2 py-0.5 flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Predict numeric values (e.g., revenue, score, time-to-close).
                    </p>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>

          {/* Target Column */}
          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-gray-500">Step 2</p>
                  <CardTitle>Target column</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-gray-500">Pick the column you want the model to predict.</p>
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
                placeholder="Search or select a target column..."
              />
              <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                <InformationCircleIcon className="w-4 h-4 text-primary-500 mt-0.5" />
                <span>We will keep this column out of your feature set to prevent leakage.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-gray-500">Step 3</p>
                    <CardTitle>Feature set</CardTitle>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                  {selectedFeatures.length} / {availableColumns} selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Filter columns by name or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={handleSelectAllFeatures} className="whitespace-nowrap">
                      Select all
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleDeselectAllFeatures} className="whitespace-nowrap">
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectNumeric}
                    className="border border-gray-200 bg-white hover:border-primary-300 flex items-center gap-2"
                  >
                    <HashtagIcon className="w-4 h-4 text-gray-600" />
                    Add numeric
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectCategorical}
                    className="border border-gray-200 bg-white hover:border-primary-300 flex items-center gap-2"
                  >
                    <TagIcon className="w-4 h-4 text-gray-600" />
                    Add categorical
                  </Button>
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-gray-500 mb-2">Selected</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatures.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 text-sm text-gray-700 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                        >
                          {feature}
                          <button
                            onClick={() => handleFeatureToggle(feature)}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label={`Remove ${feature}`}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Column Groups */}
              <div className="space-y-6">
                {/* Numeric Columns */}
                {filteredColumns.numeric.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                        <HashtagIcon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Numeric columns</span>
                        <span className="text-gray-400">({filteredColumns.numeric.length})</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredColumns.numeric.map((col, index) => {
                        const isTarget = col.name === targetColumn
                        const isSelected = selectedFeatures.includes(col.name)
                        return (
                          <motion.button
                            key={col.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => !isTarget && handleFeatureToggle(col.name)}
                            disabled={isTarget}
                            className={cn(
                              'group relative flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                              isTarget
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary-300 bg-primary-50/80 shadow-[0_8px_24px_rgba(0,122,255,0.08)]'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            )}
                          >
                            <div className={cn(
                              'mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all',
                              isSelected ? 'border-primary-400 bg-primary-500 text-white' : 'border-gray-300 bg-white group-hover:border-gray-400'
                            )}>
                              {isSelected && <CheckIcon className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{col.name}</p>
                              <p className="text-xs text-gray-500">{col.dtype}</p>
                            </div>
                            {isTarget && (
                              <span className="absolute top-2 right-2 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                                Target
                              </span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Categorical Columns */}
                {filteredColumns.categorical.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
                        <TagIcon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="font-semibold text-gray-900">Categorical columns</span>
                        <span className="text-gray-400">({filteredColumns.categorical.length})</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredColumns.categorical.map((col, index) => {
                        const isTarget = col.name === targetColumn
                        const isSelected = selectedFeatures.includes(col.name)
                        return (
                          <motion.button
                            key={col.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() => !isTarget && handleFeatureToggle(col.name)}
                            disabled={isTarget}
                            className={cn(
                              'group relative flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                              isTarget
                                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                                : isSelected
                                ? 'border-primary-300 bg-primary-50/80 shadow-[0_8px_24px_rgba(0,122,255,0.08)]'
                                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                            )}
                          >
                            <div className={cn(
                              'mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all',
                              isSelected ? 'border-primary-400 bg-primary-500 text-white' : 'border-gray-300 bg-white group-hover:border-gray-400'
                            )}>
                              {isSelected && <CheckIcon className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{col.name}</p>
                              <p className="text-xs text-gray-500">{col.dtype}</p>
                            </div>
                            {isTarget && (
                              <span className="absolute top-2 right-2 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                                Target
                              </span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {filteredColumns.numeric.length === 0 && filteredColumns.categorical.length === 0 && searchQuery && (
                  <div className="text-center py-10 text-gray-500">
                    No columns found matching "{searchQuery}".
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
          {/* Training Summary Card */}
          <Card className="overflow-hidden sticky top-6 border border-gray-200 shadow-sm">
            <CardHeader className="bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <CardTitle>Training summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <dl className="space-y-3">
                <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <dt className="text-secondary text-sm">Dataset</dt>
                  <dd className="text-primary font-medium text-sm truncate max-w-[160px] text-right">{dataset.name}</dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <dt className="text-secondary text-sm">Rows</dt>
                  <dd className="text-primary font-medium">{dataset.row_count?.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <dt className="text-secondary text-sm">Task type</dt>
                  <dd className="font-medium text-sm capitalize text-gray-900">{taskType}</dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <dt className="text-secondary text-sm">Target</dt>
                  <dd className={cn(
                    "font-medium text-sm truncate max-w-[160px] text-right",
                    targetColumn ? "text-gray-900" : "text-gray-400"
                  )}>
                    {targetColumn || 'Not selected'}
                  </dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <dt className="text-secondary text-sm">Features</dt>
                  <dd className={cn(
                    "font-semibold",
                    selectedFeatures.length > 0 ? "text-primary-600" : "text-gray-400"
                  )}>
                    {selectedFeatures.length}
                  </dd>
                </div>
              </dl>

              {/* Progress indicator */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Setup progress</span>
                  <span>{targetColumn && selectedFeatures.length > 0 ? 'Ready to launch' : 'Complete all steps'}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                    style={{
                      width: `${(targetColumn ? 50 : 0) + (selectedFeatures.length > 0 ? 50 : 0)}%`
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border border-primary-100 bg-primary-50/70">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">How this run works</p>
                  <p>
                    We will evaluate several model families (e.g., Random Forest, XGBoost, linear baselines) and pick the best-performing pipeline with sensible defaults.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Training Button */}
          <Button
            onClick={handleSubmit}
            isLoading={trainMutation.isPending}
            leftIcon={<PlayIcon className="w-5 h-5" />}
            className={cn(
              "w-full py-4 text-lg font-semibold transition-all border border-transparent",
              targetColumn && selectedFeatures.length > 0
                ? "bg-primary-500 text-white hover:bg-primary-600 shadow-lg hover:shadow-xl"
                : "bg-gray-100 text-gray-500 border-gray-200"
            )}
            disabled={!targetColumn || selectedFeatures.length === 0}
          >
            Start training
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TrainingPage
