import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  ChartBarIcon,
  CpuChipIcon,
  DocumentTextIcon,
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
import { reportsApi } from '@/api'
import { useToastActions } from '@/contexts'
import { formatDateTime, formatNumber, downloadFile } from '@/utils'

export function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const toast = useToastActions()

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['reports', reportId],
    queryFn: () => reportsApi.get(reportId!),
    enabled: !!reportId,
  })

  const exportMutation = useMutation({
    mutationFn: () => reportsApi.export(reportId!, 'pdf'),
    onSuccess: (blob) => {
      downloadFile(blob, `${report?.title || 'report'}.pdf`)
      toast.success('Export started', 'Your PDF is downloading.')
    },
    onError: () => {
      toast.error('Export failed', 'Could not export the report.')
    },
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

  if (error || !report) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Report not found.</p>
          <Link to="/reports">
            <Button variant="secondary">Back to Reports</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const content = report.content

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/reports">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">{report.title}</h1>
              <StatusBadge status={report.status} />
            </div>
            <p className="text-secondary mt-1">
              Generated {formatDateTime(report.created_at)}
            </p>
          </div>
        </div>
        <Button
          onClick={() => exportMutation.mutate()}
          isLoading={exportMutation.isPending}
          leftIcon={<ArrowDownTrayIcon className="w-5 h-5" />}
        >
          Export PDF
        </Button>
      </div>

      {report.status !== 'completed' ? (
        <Card>
          <CardContent className="py-12 text-center">
            <StatusBadge status={report.status} />
            <p className="text-secondary mt-4">
              {report.status === 'generating'
                ? 'Report is being generated...'
                : report.status === 'pending'
                ? 'Report is queued for generation...'
                : 'Report generation failed.'}
            </p>
          </CardContent>
        </Card>
      ) : content ? (
        <>
          {/* Dataset Overview Section */}
          {content.dataset_overview && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-primary-500" />
                  <CardTitle>Dataset Overview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl neu-raised text-center">
                    <p className="text-sm text-muted">Rows</p>
                    <p className="text-xl font-bold text-primary">
                      {content.dataset_overview.rows?.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl neu-raised text-center">
                    <p className="text-sm text-muted">Columns</p>
                    <p className="text-xl font-bold text-primary">
                      {content.dataset_overview.columns}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl neu-raised text-center">
                    <p className="text-sm text-muted">File Type</p>
                    <p className="text-xl font-bold text-primary uppercase">
                      {content.dataset_overview.file_type}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl neu-raised text-center">
                    <p className="text-sm text-muted">Dataset</p>
                    <p className="text-xl font-bold text-primary truncate">
                      {content.dataset_overview.name}
                    </p>
                  </div>
                </div>

                {content.dataset_overview.missingness_summary && (
                  <div>
                    <p className="text-sm font-medium text-secondary mb-2">Missing Values Summary</p>
                    <p className="text-sm text-muted p-3 rounded-lg neu-raised">
                      {content.dataset_overview.missingness_summary}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* EDA Summary Section */}
          {content.eda_summary && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-primary-500" />
                  <CardTitle>Analysis Summary</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {/* Key Statistics */}
                {content.eda_summary.key_statistics && Object.keys(content.eda_summary.key_statistics).length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-secondary mb-3">Key Statistics</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {Object.entries(content.eda_summary.key_statistics).slice(0, 8).map(([key, value]) => (
                        <div key={key} className="p-3 rounded-lg neu-raised">
                          <p className="text-xs text-muted uppercase truncate">{key.replace(/_/g, ' ')}</p>
                          <p className="text-lg font-semibold text-primary">
                            {typeof value === 'number' ? formatNumber(value, 2) : String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outliers */}
                {content.eda_summary.outliers_detected !== undefined && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-secondary mb-3">Outliers Detected</p>
                    <div className="p-4 rounded-xl neu-raised inline-block">
                      <p className="text-3xl font-bold text-primary">{content.eda_summary.outliers_detected}</p>
                    </div>
                  </div>
                )}

                {/* Missing Values */}
                {content.eda_summary.missing_values && Object.keys(content.eda_summary.missing_values).length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-secondary mb-3">Missing Values by Column</p>
                    <div className="space-y-2">
                      {Object.entries(content.eda_summary.missing_values)
                        .filter(([, count]) => count > 0)
                        .slice(0, 10)
                        .map(([column, count]) => (
                          <div key={column} className="flex items-center gap-3">
                            <span className="text-sm text-secondary w-32 truncate">{column}</span>
                            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-warning-500"
                                style={{ width: `${Math.min(count, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-primary w-16 text-right">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Notable Correlations */}
                {content.eda_summary.notable_correlations && content.eda_summary.notable_correlations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-secondary mb-3">Notable Correlations</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-subtle">
                            <th className="px-4 py-2 text-left">Column 1</th>
                            <th className="px-4 py-2 text-left">Column 2</th>
                            <th className="px-4 py-2 text-left">Correlation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {content.eda_summary.notable_correlations.slice(0, 5).map((corr, i) => (
                            <tr key={i} className="border-b border-subtle last:border-0">
                              <td className="px-4 py-2 text-primary">{corr.column1}</td>
                              <td className="px-4 py-2 text-primary">{corr.column2}</td>
                              <td className="px-4 py-2 text-secondary">{formatNumber(corr.correlation, 3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Model Summary Section */}
          {content.model_summary && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="w-5 h-5 text-primary-500" />
                  <CardTitle>Model Performance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-secondary">Algorithm</dt>
                        <dd className="text-primary font-medium">{content.model_summary.algorithm}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-secondary">Task Type</dt>
                        <dd className="text-primary font-medium capitalize">{content.model_summary.task_type}</dd>
                      </div>
                    </dl>
                  </div>

                  {content.model_summary.metrics && (
                    <div>
                      <p className="text-sm font-medium text-secondary mb-3">Metrics</p>
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(content.model_summary.metrics).map(([key, value]) => (
                          <div key={key} className="p-3 rounded-lg neu-raised">
                            <p className="text-xs text-muted uppercase">{key.replace(/_/g, ' ')}</p>
                            <p className="text-lg font-semibold text-primary">
                              {formatNumber(value, 4)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Feature Importance */}
                {content.model_summary.feature_importance && Object.keys(content.model_summary.feature_importance).length > 0 && (
                  <div className="mt-6">
                    <p className="text-sm font-medium text-secondary mb-3">Top Features</p>
                    <div className="space-y-2">
                      {Object.entries(content.model_summary.feature_importance)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([feature, importance]) => (
                          <div key={feature} className="flex items-center gap-3">
                            <span className="text-sm text-secondary w-32 truncate">{feature}</span>
                            <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary-500"
                                style={{ width: `${importance * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-primary w-16 text-right">
                              {formatNumber(importance * 100, 1)}%
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          {report.ai_summary && (
            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-secondary whitespace-pre-wrap">{report.ai_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Insights */}
          {content.insights && content.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {content.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-medium text-primary-600">
                        {i + 1}
                      </span>
                      <p className="text-secondary">{insight}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-secondary">No content available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReportDetailPage
