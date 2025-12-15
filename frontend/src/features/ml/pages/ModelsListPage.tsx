import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BeakerIcon,
  TrophyIcon,
  ArrowRightIcon,
  PlayIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardContent,
  Button,
  SkeletonCard,
} from '@/components/ui'
import { EmptyState } from '@/components/shared'
import { mlApi } from '@/api'
import { formatRelativeTime, formatNumber, cn } from '@/utils'
import type { TrainedModelListItem } from '@/types'

export function ModelsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trained-models'],
    queryFn: () => mlApi.listModels(),
  })

  const models = data?.results || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
        <div className="relative px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Model library</p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Trained models</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Browse, compare, and deploy the best models discovered by AutoML. Each card highlights task, target, top metric, and freshness.
            </p>
          </div>
          <Link to="/datasets">
            <Button>
              <BeakerIcon className="w-5 h-5 mr-2" />
              Train new model
            </Button>
          </Link>
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
            <p className="text-error-500">Failed to load models. Please try again.</p>
          </CardContent>
        </Card>
      ) : models.length === 0 ? (
        <EmptyState
          icon={<BeakerIcon className="w-8 h-8" />}
          title="No models trained yet"
          description="Train your first machine learning model by selecting a dataset and configuring the training parameters."
          action={{
            label: 'Go to Datasets',
            onClick: () => window.location.href = '/datasets',
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {models.map((model: TrainedModelListItem) => {
              const isClassification = model.task_type === 'classification'
              const primaryMetric = isClassification
                ? (model.metrics?.f1_score ?? model.metrics?.accuracy ?? 0)
                : (model.metrics?.r2_score ?? 0)

              return (
                <motion.div
                  key={model.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  layout
                >
                  <Card hoverable className="h-full border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-11 h-11 rounded-xl flex items-center justify-center border',
                            model.is_best
                              ? 'border-primary-200 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-200'
                          )}>
                            {model.is_best ? (
                              <TrophyIcon className="w-5 h-5" />
                            ) : (
                              <BeakerIcon className="w-5 h-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {model.display_name}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(model.created_at)}
                            </p>
                          </div>
                        </div>
                        {model.is_best && (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200">
                            Best
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 capitalize">
                          {model.task_type}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 truncate max-w-[180px]">
                          Target: {model.target_column}
                        </span>
                        {model.dataset_name && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-200 truncate max-w-[180px]">
                            {model.dataset_name}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Top metric</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {isClassification
                              ? `${formatNumber(primaryMetric * 100, 1)}%`
                              : `${formatNumber(primaryMetric, 4)}`}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Features</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            -
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Link to={`/models/${model.id}`} className="flex-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                          >
                            Details
                          </Button>
                        </Link>
                        <Link to={`/models/${model.id}/predict`}>
                          <Button
                            size="sm"
                            leftIcon={<PlayIcon className="w-4 h-4" />}
                          >
                            Predict
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

export default ModelsListPage
