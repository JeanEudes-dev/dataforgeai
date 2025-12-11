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
import { BenchmarkComparison } from '@/components/charts'
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

  const featureImportanceData = model.feature_importance
    ? Object.entries(model.feature_importance)
        .map(([name, importance]) => ({ name: name.replace('num__', '').replace('cat__', ''), importance: importance as number }))
        .sort((a, b) => b.importance - a.importance)
        .slice(0, 10)
    : []

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

  const confusionMatrix = model.metrics?.confusion_matrix as number[][] | undefined
  const confusionLabels = model.metrics?.confusion_matrix_labels as string[] | undefined

  const rocCurve = model.metrics?.roc_curve as { fpr: number[], tpr: number[], thresholds: number[] } | undefined
  const rocData = rocCurve?.fpr?.map((fpr, i) => ({
    fpr,
    tpr: rocCurve.tpr[i],
  })) || []

  const shapData = model.shap_values?.mean_abs_shap
    ? Object.entries(model.shap_values.mean_abs_shap as Record<string, number>)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10)
    : []

  const inputSchema = model.input_schema as Record<string, { dtype: string, nullable: boolean }> | undefined

  const isClassification = model.task_type === 'classification'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
        <div className="relative px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/models">
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">Best model</p>
                  {model.is_best && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-200">
                      <TrophyIcon className="w-3.5 h-3.5" />
                      Top pick
                    </span>
                  )}
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{model.display_name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isClassification ? 'Classification' : 'Regression'} • Target: {model.target_column}
                </p>
              </div>
            </div>
            <Link to={`/models/${model.id}/predict`}>
              <Button leftIcon={<PlayIcon className="w-5 h-5" />}>
                Make predictions
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-200 text-sm font-semibold">Task</div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Type</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">{model.task_type}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-200 text-sm font-semibold">Data</div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Rows / Columns</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(model.dataset?.row_count ?? 0, 0)} / {formatNumber(model.dataset?.column_count ?? 0, 0)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/70 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-200 text-sm font-semibold">Created</div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Timestamp</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {formatDateTime(model.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isClassification ? (
          <>
            <StatCard label="Accuracy" value={`${formatNumber((model.metrics?.accuracy || 0) * 100, 1)}%`} />
            <StatCard label="Precision" value={`${formatNumber((model.metrics?.precision || 0) * 100, 1)}%`} />
            <StatCard label="Recall" value={`${formatNumber((model.metrics?.recall || 0) * 100, 1)}%`} />
            <StatCard label="F1 score" value={`${formatNumber((model.metrics?.f1 || model.metrics?.f1_score || 0) * 100, 1)}%`} />
          </>
        ) : (
          <>
            <StatCard label="MAE" value={formatNumber(model.metrics?.mae, 4)} />
            <StatCard label="RMSE" value={formatNumber(model.metrics?.rmse, 4)} />
            <StatCard label="MSE" value={formatNumber(model.metrics?.mse, 4)} />
            <StatCard label="R^2" value={`${formatNumber((model.metrics?.r2 || model.metrics?.r2_score || 0) * 100, 1)}%`} />
          </>
        )}
      </div>

      {/* Benchmark */}
      <BenchmarkComparison
        actualDuration={model.training_job_duration}
        rowCount={model.dataset?.row_count ?? null}
        columnCount={model.dataset?.column_count ?? null}
        featureCount={model.feature_columns?.length}
        taskType={model.task_type}
      />

      {/* Performance visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isClassification && confusionMatrix && confusionLabels && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <CardTitle className="flex items-center gap-2">
                <TableCellsIcon className="w-5 h-5" />
                Confusion matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="p-2 text-sm text-gray-500"></th>
                      <th colSpan={confusionLabels.length} className="p-2 text-sm text-center text-gray-600 font-medium">
                        Predicted
                      </th>
                    </tr>
                    <tr>
                      <th className="p-2 text-sm text-gray-500"></th>
                      {confusionLabels.map(label => (
                        <th key={label} className="p-2 text-sm text-center text-gray-600 font-medium min-w-[60px]">
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
                          <td className="p-2 text-sm text-gray-600 font-medium text-right pr-3">
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
                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-200'
                                    : val > 0
                                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                                      : 'bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 border border-dashed border-gray-200 dark:border-gray-700'
                                )}
                                style={{
                                  opacity: val > 0 ? Math.max(0.45, intensity) : 1
                                }}
                              >
                                {val}
                                {rowTotal > 0 && (
                                  <span className="block text-xs font-normal text-gray-500">
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

        {isClassification && rocData.length > 0 && model.metrics?.roc_auc && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <CardTitle className="flex items-center gap-2">
                <ChartBarIcon className="w-5 h-5" />
                ROC curve (AUC: {formatNumber(model.metrics.roc_auc, 3)})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rocData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rocGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
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
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
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
                      stroke="#2563eb"
                      strokeWidth={2}
                      fill="url(#rocGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {!isClassification && cvScoresData.length > 0 && (
          <Card className="border border-gray-200 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <CardTitle>
                Cross-validation scores
                <span className="ml-2 text-sm font-normal text-gray-500">
                  (Mean: {formatNumber(cvMean, 3)} ± {formatNumber(cvStd, 3)})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cvScoresData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis dataKey="fold" />
                    <YAxis
                      domain={['auto', 'auto']}
                      tickFormatter={(v) => formatNumber(v, 2)}
                    />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value, 4)}
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <ReferenceLine y={cvMean} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Mean', fill: '#f59e0b', fontSize: 12 }} />
                    <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                      {cvScoresData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.score >= cvMean ? '#2563eb' : '#f59e0b'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {featureImportanceData.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <CardTitle>Feature importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureImportanceData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value, 4)}
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="importance"
                      fill="#2563eb"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {shapData.length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <CardTitle>SHAP feature impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                    <XAxis type="number" domain={[0, 'auto']} />
                    <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value, 4)}
                      contentStyle={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '12px',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="#7c3aed"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <CardTitle>Model information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Algorithm" value={model.display_name} />
            <InfoRow label="Algorithm type" value={model.algorithm_type?.replace(/_/g, ' ')} />
            <InfoRow label="Task type" value={model.task_type} />
            <InfoRow label="Target column" value={model.target_column} />
            <InfoRow label="Features used" value={String(model.feature_columns?.length || '-')} />
            <InfoRow label="Model size" value={model.model_size_display || '-'} />
            <InfoRow label="Created" value={formatDateTime(model.created_at)} />
          </CardContent>
        </Card>

        {model.hyperparameters && Object.keys(model.hyperparameters).length > 0 && (
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
              <CardTitle className="flex items-center gap-2">
                <Cog6ToothIcon className="w-5 h-5" />
                Hyperparameters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {Object.entries(model.hyperparameters).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <dt className="text-gray-500">{key.replace(/_/g, ' ')}</dt>
                    <dd className="text-gray-900 font-medium font-mono text-sm">
                      {typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>

      {inputSchema && Object.keys(inputSchema).length > 0 && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <CardTitle className="flex items-center gap-2">
              <TableCellsIcon className="w-5 h-5" />
              Input schema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Feature</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-gray-600 font-medium">Nullable</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(inputSchema).map(([feature, schema]) => (
                    <tr key={feature} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 text-gray-900 font-medium">{feature}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          schema.dtype === 'numeric'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        )}>
                          {schema.dtype}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'px-2 py-1 rounded text-xs font-medium',
                          schema.nullable
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-700'
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

      <Card className="border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
          <CardTitle>Feature columns ({model.feature_columns?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {model.feature_columns?.map((col) => (
              <span
                key={col}
                className="px-3 py-1.5 text-sm rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
              >
                {col}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {model.metrics && (
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
            <CardTitle>All metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(model.metrics)
                .filter(([key]) => !['confusion_matrix', 'confusion_matrix_labels', 'roc_curve'].includes(key))
                .map(([key, value]) => (
                <div key={key} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    {key.replace(/_/g, ' ')}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">
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

function StatCard({ label, value }: { label: string, value: string }) {
  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  )
}

export default ModelDetailPage

