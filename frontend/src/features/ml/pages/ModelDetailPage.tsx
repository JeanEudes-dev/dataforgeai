import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  PlayIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
} from '@/components/ui'
import { mlApi } from '@/api'
import { formatDateTime, formatNumber } from '@/utils'

export function ModelDetailPage() {
  const { modelId } = useParams<{ modelId: string }>()

  const { data: model, isLoading, error } = useQuery({
    queryKey: ['trained-models', modelId],
    queryFn: () => mlApi.getModel(modelId!),
    enabled: !!modelId,
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

  if (error || !model) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Model not found.</p>
          <Link to="/models">
            <Button variant="secondary">Back to Models</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Feature importance data for chart
  const featureImportanceData = model.feature_importance
    ? Object.entries(model.feature_importance)
        .map(([name, importance]) => ({ name, importance: importance as number }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/models">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">{model.algorithm}</h1>
              {model.is_best && (
                <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                  <TrophyIcon className="w-3.5 h-3.5" />
                  Best Model
                </span>
              )}
            </div>
            <p className="text-secondary mt-1">
              {model.task_type === 'classification' ? 'Classification' : 'Regression'} • Target: {model.target_column}
            </p>
          </div>
        </div>
        <Link to={`/models/${model.id}/predict`}>
          <Button leftIcon={<PlayIcon className="w-5 h-5" />}>
            Make Predictions
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {model.task_type === 'classification' ? (
          <>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Accuracy</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.accuracy, 4)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Precision</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.precision, 4)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Recall</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.recall, 4)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">F1 Score</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.f1_score, 4)}
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">MAE</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.mae, 4)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">MSE</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.mse, 4)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">RMSE</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.rmse, 4)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">R² Score</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber(model.metrics?.r2_score, 4)}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Details */}
        <Card>
          <CardHeader>
            <CardTitle>Model Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-secondary">Algorithm</dt>
                <dd className="text-primary font-medium">{model.algorithm}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Task Type</dt>
                <dd className="text-primary font-medium capitalize">{model.task_type}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Target Column</dt>
                <dd className="text-primary font-medium">{model.target_column}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Features Used</dt>
                <dd className="text-primary font-medium">{model.feature_columns?.length || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Created</dt>
                <dd className="text-primary font-medium">{formatDateTime(model.created_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Feature Columns */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Columns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {model.feature_columns?.map((col) => (
                <span
                  key={col}
                  className="px-3 py-1.5 text-sm rounded-lg neu-raised text-secondary"
                >
                  {col}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Importance Chart */}
      {featureImportanceData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Importance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureImportanceData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis dataKey="name" type="category" width={90} />
                  <Tooltip
                    formatter={(value: number) => formatNumber(value, 4)}
                    contentStyle={{
                      background: 'var(--neu-bg)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: 'var(--neu-shadow-md)',
                    }}
                  />
                  <Bar
                    dataKey="importance"
                    fill="#f59e0b"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Metrics */}
      {model.metrics && (
        <Card>
          <CardHeader>
            <CardTitle>All Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(model.metrics).map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg neu-raised">
                  <p className="text-xs text-muted uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold text-primary mt-1">
                    {typeof value === 'number' ? formatNumber(value, 4) : String(value)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ModelDetailPage
