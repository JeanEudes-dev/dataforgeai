import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CpuChipIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardContent,
  Button,
  SkeletonCard,
} from '@/components/ui'
import { StatusBadge, EmptyState } from '@/components/shared'
import { mlApi } from '@/api'
import { formatRelativeTime, formatDuration, cn } from '@/utils'
import type { TrainingJobListItem } from '@/types'

export function JobsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['training-jobs'],
    queryFn: () => mlApi.listJobs(),
    refetchInterval: 5000, // Poll every 5 seconds for active jobs
  })

  const jobs = data?.results || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Training Jobs</h1>
          <p className="text-secondary mt-1">Monitor your model training jobs</p>
        </div>
        <Link to="/datasets">
          <Button>
            <CpuChipIcon className="w-5 h-5 mr-2" />
            Start New Training
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
            <p className="text-error-500">Failed to load training jobs. Please try again.</p>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<CpuChipIcon className="w-8 h-8" />}
          title="No training jobs yet"
          description="Start training models by selecting a dataset and configuring the training parameters."
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
            {jobs.map((job: TrainingJobListItem) => (
              <motion.div
                key={job.id}
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
                          job.status === 'completed' ? 'bg-success-100 dark:bg-success-900/30' :
                          job.status === 'running' ? 'bg-primary-100 dark:bg-primary-900/30' :
                          job.status === 'error' ? 'bg-error-100 dark:bg-error-900/30' :
                          'bg-neutral-100 dark:bg-neutral-800'
                        )}>
                          <CpuChipIcon className={cn(
                            'w-5 h-5',
                            job.status === 'completed' ? 'text-success-600' :
                            job.status === 'running' ? 'text-primary-600' :
                            job.status === 'error' ? 'text-error-600' :
                            'text-neutral-500'
                          )} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-primary truncate">
                            {job.dataset_name || `Job ${job.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-xs text-muted">
                            {formatRelativeTime(job.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Task</span>
                        <span className="text-primary capitalize">{job.task_type}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Target</span>
                        <span className="text-primary">{job.target_column}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-secondary">Features</span>
                        <span className="text-primary">{job.feature_columns?.length || '-'}</span>
                      </div>
                      {job.status === 'completed' && job.best_model && (
                        <div className="flex justify-between text-sm">
                          <span className="text-secondary">Best Model</span>
                          <span className="text-primary">{job.best_model.algorithm}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar for running jobs */}
                    {job.status === 'running' && (
                      <div className="mb-4">
                        <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress || 0}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {job.current_step || 'Processing...'}
                        </p>
                      </div>
                    )}

                    {/* Duration for completed jobs */}
                    {job.status === 'completed' && job.duration && (
                      <div className="flex items-center gap-1 text-xs text-muted mb-4">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatDuration(job.duration)}</span>
                      </div>
                    )}

                    <Link to={`/training/jobs/${job.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                      >
                        View Details
                      </Button>
                    </Link>
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

export default JobsListPage
