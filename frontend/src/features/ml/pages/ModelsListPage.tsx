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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Trained Models</h1>
          <p className="text-secondary mt-1">View and use your trained machine learning models</p>
        </div>
        <Link to="/datasets">
          <Button>
            <BeakerIcon className="w-5 h-5 mr-2" />
            Train New Model
          </Button>
        </Link>
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
            {models.map((model: TrainedModelListItem) => (
              <motion.div
                key={model.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card hoverable className="h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          model.is_best
                            ? 'bg-success-100 dark:bg-success-900/30'
                            : 'bg-primary-100 dark:bg-primary-900/30'
                        )}>
                          {model.is_best ? (
                            <TrophyIcon className="w-5 h-5 text-success-600 dark:text-success-400" />
                          ) : (
                            <BeakerIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary">
                            {model.algorithm}
                          </h3>
                          <p className="text-xs text-muted">
                            {formatRelativeTime(model.created_at)}
                          </p>
                        </div>
                      </div>
                      {model.is_best && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                          Best
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Task</span>
                        <span className="text-primary capitalize">{model.task_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Target</span>
                        <span className="text-primary truncate max-w-24">{model.target_column}</span>
                      </div>

                      {/* Key Metric */}
                      {model.task_type === 'classification' ? (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary">F1 Score</span>
                          <span className="text-primary font-medium">
                            {formatNumber(model.metrics?.f1_score, 4)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary">R²</span>
                          <span className="text-primary font-medium">
                            {formatNumber(model.metrics?.r2_score, 4)}
                          </span>
                        </div>
                      )}
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
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}

export default ModelsListPage
