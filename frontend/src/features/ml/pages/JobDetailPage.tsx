import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
} from '@/components/ui'
import { StatusBadge } from '@/components/shared'
import { mlApi } from '@/api'
import { formatDateTime, formatDuration, formatNumber, cn } from '@/utils'

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>()

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['training-jobs', jobId],
    queryFn: () => mlApi.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) =>
      query.state.data?.status === 'running' || query.state.data?.status === 'pending' ? 3000 : false,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Training job not found.</p>
          <Link to="/training/jobs">
            <Button variant="secondary">Back to Jobs</Button>
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
          <Link to="/training/jobs">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">
                Training Job
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-secondary mt-1">
              {job.dataset_name || `Dataset: ${job.dataset?.id?.slice(0, 8) || 'Unknown'}`}
            </p>
          </div>
        </div>
        {job.status === 'completed' && job.best_model && (
          <Link to={`/models/${job.best_model.id}`}>
            <Button>
              <TrophyIcon className="w-5 h-5 mr-2" />
              View Best Model
            </Button>
          </Link>
        )}
      </div>

      {/* Progress for running jobs */}
      {(job.status === 'running' || job.status === 'pending') && (
        <Card>
          <CardContent className="py-8">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-secondary">
                  {job.current_step || 'Initializing...'}
                </span>
                <span className="text-sm font-medium text-primary">
                  {job.progress || 0}%
                </span>
              </div>
              <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center text-muted text-sm mt-4">
                Training in progress. This page will update automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted mb-1">Task Type</p>
            <p className="text-2xl font-bold text-primary capitalize">{job.task_type}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted mb-1">Target Column</p>
            <p className="text-2xl font-bold text-primary truncate">{job.target_column}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted mb-1">Features</p>
            <p className="text-2xl font-bold text-primary">{job.feature_columns?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted mb-1">Duration</p>
            <p className="text-2xl font-bold text-primary">
              {job.duration ? formatDuration(job.duration) : '-'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-secondary">Started</dt>
                <dd className="text-primary font-medium">{formatDateTime(job.created_at)}</dd>
              </div>
              {job.completed_at && (
                <div>
                  <dt className="text-sm text-secondary">Completed</dt>
                  <dd className="text-primary font-medium">{formatDateTime(job.completed_at)}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-sm text-secondary mb-2">Feature Columns</dt>
                <dd className="flex flex-wrap gap-2">
                  {job.feature_columns?.map((col) => (
                    <span
                      key={col}
                      className="px-2 py-1 text-xs rounded-lg neu-raised text-secondary"
                    >
                      {col}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {job.status === 'error' && job.error_message && (
          <Card>
            <CardHeader>
              <CardTitle className="text-error-500">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-error-500">{job.error_message}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trained Models */}
      {job.status === 'completed' && job.trained_models && job.trained_models.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Trained Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="px-4 py-3 text-left">Algorithm</th>
                    {job.task_type === 'classification' ? (
                      <>
                        <th className="px-4 py-3 text-left">Accuracy</th>
                        <th className="px-4 py-3 text-left">Precision</th>
                        <th className="px-4 py-3 text-left">Recall</th>
                        <th className="px-4 py-3 text-left">F1 Score</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left">MAE</th>
                        <th className="px-4 py-3 text-left">RMSE</th>
                        <th className="px-4 py-3 text-left">R²</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {job.trained_models.map((model) => (
                    <tr
                      key={model.id}
                      className={cn(
                        'border-b border-subtle last:border-0',
                        model.is_best && 'bg-success-50 dark:bg-success-900/10'
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-medium">{model.algorithm}</span>
                          {model.is_best && (
                            <span className="flex items-center gap-1 text-xs text-success-600">
                              <TrophyIcon className="w-3.5 h-3.5" />
                              Best
                            </span>
                          )}
                        </div>
                      </td>
                      {job.task_type === 'classification' ? (
                        <>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.accuracy, 4)}
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.precision, 4)}
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.recall, 4)}
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.f1_score, 4)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.mae, 4)}
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.rmse, 4)}
                          </td>
                          <td className="px-4 py-3 text-secondary">
                            {formatNumber(model.metrics?.r2_score, 4)}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <Link to={`/models/${model.id}`}>
                          <Button variant="ghost" size="sm">
                            <ChartBarIcon className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default JobDetailPage
