import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  PlayIcon,
  TrophyIcon,
  Cog6ToothIcon,
  TableCellsIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Area,
  AreaChart,
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
import { formatDateTime, formatNumber, cn } from '@/utils'

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
        .map(([name, importance]) => ({ name: name.replace('num__', '').replace('cat__', ''), importance: importance as number }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
    : []

  // Cross-validation scores data
  const cvScoresData = model.cross_val_scores?.map((score, index) => ({
    fold: `Fold ${index + 1}`,
    score: score,
  })) || []
  const cvMean = model.cross_val_scores?.length
    ? model.cross_val_scores.reduce((a, b) => a + b, 0) / model.cross_val_scores.length
    : 0
  const cvStd = model.cross_val_scores?.length
    ? Math.sqrt(model.cross_val_scores.map(x => Math.pow(x - cvMean, 2)).reduce((a, b) => a + b, 0) / model.cross_val_scores.length)
    : 0

  // Confusion matrix data
  const confusionMatrix = model.metrics?.confusion_matrix as number[][] | undefined
  const confusionLabels = model.metrics?.confusion_matrix_labels as string[] | undefined

  // ROC curve data
  const rocCurve = model.metrics?.roc_curve as { fpr: number[], tpr: number[], thresholds: number[] } | undefined
  const rocData = rocCurve?.fpr?.map((fpr, i) => ({
    fpr,
    tpr: rocCurve.tpr[i],
  })) || []

  // SHAP values data
  const shapData = model.shap_values?.mean_abs_shap
    ? Object.entries(model.shap_values.mean_abs_shap as Record<string, number>)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : []

  // Input schema
  const inputSchema = model.input_schema as Record<string, { dtype: string, nullable: boolean }> | undefined

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
              <h1 className="text-2xl font-bold text-primary">{model.display_name}</h1>
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
                  {formatNumber((model.metrics?.accuracy || 0) * 100, 1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Precision</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber((model.metrics?.precision || 0) * 100, 1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Recall</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber((model.metrics?.recall || 0) * 100, 1)}%
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">F1 Score</p>
                <p className="text-2xl font-bold text-primary">
                  {formatNumber((model.metrics?.f1 || model.metrics?.f1_score || 0) * 100, 1)}%
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
                  {formatNumber((model.metrics?.r2 || model.metrics?.r2_score || 0) * 100, 1)}%
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Confusion Matrix & ROC Curve (Classification only) */}
      {model.task_type === 'classification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          {confusionMatrix && confusionLabels && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TableCellsIcon className="w-5 h-5" />
                  Confusion Matrix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="p-2 text-sm text-muted"></th>
                        <th colSpan={confusionLabels.length} className="p-2 text-sm text-center text-secondary font-medium">
                          Predicted
                        </th>
                      </tr>
                      <tr>
                        <th className="p-2 text-sm text-muted"></th>
                        {confusionLabels.map(label => (
                          <th key={label} className="p-2 text-sm text-center text-secondary font-medium min-w-[60px]">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {confusionMatrix.map((row, i) => {
                        const rowTotal = row.reduce((a, b) => a + b, 0)
                        const maxVal = Math.max(...confusionMatrix.flat())
                        return (
                          <tr key={i}>
                            {i === 0 && (
                              <td rowSpan={confusionLabels.length} className="p-2 text-sm text-secondary font-medium align-middle">
                                <span className="writing-vertical-lr rotate-180">Actual</span>
                              </td>
                            )}
                            <td className="p-2 text-sm text-secondary font-medium text-right pr-4">
                              {confusionLabels[i]}
                            </td>
                            {row.map((val, j) => {
                              const isCorrect = i === j
                              const intensity = maxVal > 0 ? val / maxVal : 0
                              return (
                                <td
                                  key={j}
                                  className={cn(
                                    'p-3 text-center font-semibold rounded-lg m-0.5',
                                    isCorrect
                                      ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                                      : val > 0
                                        ? 'bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400'
                                        : 'bg-neutral-100 dark:bg-neutral-800 text-secondary'
                                  )}
                                  style={{
                                    opacity: val > 0 ? Math.max(0.4, intensity) : 1
                                  }}
                                >
                                  {val}
                                  {rowTotal > 0 && (
                                    <span className="block text-xs font-normal opacity-75">
                                      {formatNumber((val / rowTotal) * 100, 0)}%
                                    </span>
                                  )}
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ROC Curve */}
          {rocData.length > 0 && model.metrics?.roc_auc && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5" />
                  ROC Curve (AUC: {formatNumber(model.metrics.roc_auc, 3)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rocData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis
                        dataKey="fpr"
                        type="number"
                        domain={[0, 1]}
                        tickFormatter={(v) => formatNumber(v, 1)}
                        label={{ value: 'False Positive Rate', position: 'bottom', offset: -5, style: { fontSize: 12 } }}
                      />
                      <YAxis
                        dataKey="tpr"
                        type="number"
                        domain={[0, 1]}
                        tickFormatter={(v) => formatNumber(v, 1)}
                        label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      />
                      <Tooltip
                        formatter={(value: number) => formatNumber(value, 3)}
                        labelFormatter={(fpr) => `FPR: ${formatNumber(fpr as number, 3)}`}
                        contentStyle={{
                          background: 'var(--neu-bg)',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: 'var(--neu-shadow-md)',
                        }}
                      />
                      <ReferenceLine
                        segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                        stroke="#9ca3af"
                        strokeDasharray="5 5"
                      />
                      <Area
                        type="monotone"
                        dataKey="tpr"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#rocGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cross-validation Scores */}
      {cvScoresData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Cross-Validation Scores
              <span className="ml-2 text-sm font-normal text-secondary">
                (Mean: {formatNumber(cvMean, 3)} ± {formatNumber(cvStd, 3)})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cvScoresData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="fold" />
                  <YAxis
                    domain={['auto', 'auto']}
                    tickFormatter={(v) => formatNumber(v, 2)}
                  />
                  <Tooltip
                    formatter={(value: number) => formatNumber(value, 4)}
                    contentStyle={{
                      background: 'var(--neu-bg)',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: 'var(--neu-shadow-md)',
                    }}
                  />
                  <ReferenceLine y={cvMean} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Mean', fill: '#f59e0b', fontSize: 12 }} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {cvScoresData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.score >= cvMean ? '#10b981' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Importance Chart */}
        {featureImportanceData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureImportanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
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

        {/* SHAP Values */}
        {shapData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>SHAP Feature Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
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
                      dataKey="value"
                      fill="#8b5cf6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Model Information */}
        <Card>
          <CardHeader>
            <CardTitle>Model Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-secondary">Algorithm</dt>
                <dd className="text-primary font-medium">{model.display_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Algorithm Type</dt>
                <dd className="text-primary font-medium">{model.algorithm_type?.replace(/_/g, ' ')}</dd>
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
                <dt className="text-secondary">Model Size</dt>
                <dd className="text-primary font-medium">{model.model_size_display || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Created</dt>
                <dd className="text-primary font-medium">{formatDateTime(model.created_at)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Hyperparameters */}
        {model.hyperparameters && Object.keys(model.hyperparameters).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5" />
                Hyperparameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {Object.entries(model.hyperparameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-secondary">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-primary font-medium font-mono text-sm">
                      {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Input Schema */}
      {inputSchema && Object.keys(inputSchema).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TableCellsIcon className="w-5 h-5" />
              Input Schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-subtle">
                    <th className="px-4 py-3 text-left text-secondary font-medium">Feature</th>
                    <th className="px-4 py-3 text-left text-secondary font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-secondary font-medium">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inputSchema).map(([feature, schema]) => (
                    <tr key={feature} className="border-b border-subtle last:border-0">
                      <td className="px-4 py-3 text-primary font-medium">{feature}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          schema.dtype === 'numeric'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        )}>
                          {schema.dtype}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          schema.nullable
                            ? 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                            : 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                        )}>
                          {schema.nullable ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Columns */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Columns ({model.feature_columns?.length || 0})</CardTitle>
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

      {/* All Metrics */}
      {model.metrics && (
        <Card>
          <CardHeader>
            <CardTitle>All Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(model.metrics)
                .filter(([key]) => !['confusion_matrix', 'confusion_matrix_labels', 'roc_curve'].includes(key))
                .map(([key, value]) => (
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
