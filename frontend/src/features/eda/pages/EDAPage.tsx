import { Link, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Card, CardHeader, CardTitle, CardContent, Button, Skeleton } from '@/components/ui'
import { StatusBadge, EmptyState } from '@/components/shared'
import { edaApi, datasetsApi } from '@/api'
import { useToastActions } from '@/contexts'
import { formatNumber, formatDuration, cn } from '@/utils'

export function EDAPage() {
  const { datasetId } = useParams<{ datasetId: string }>()
  const queryClient = useQueryClient()
  const toast = useToastActions()

  const { data: dataset } = useQuery({
    queryKey: ['datasets', datasetId],
    queryFn: () => datasetsApi.get(datasetId!),
    enabled: !!datasetId,
  })

  const { data: edaResult, isLoading, error, refetch } = useQuery({
    queryKey: ['eda', datasetId, 'latest'],
    queryFn: () => edaApi.getLatestByDataset(datasetId!),
    enabled: !!datasetId,
    retry: false,
  })

  const triggerMutation = useMutation({
    mutationFn: () => edaApi.trigger({ dataset_id: datasetId!, async: true }),
    onSuccess: () => {
      toast.success('Analysis started', 'EDA is running in the background.')
      queryClient.invalidateQueries({ queryKey: ['eda', datasetId] })
    },
    onError: () => {
      toast.error('Analysis failed', 'Could not start EDA.')
    },
  })

  const isRunning = edaResult?.status === 'running' || edaResult?.status === 'pending'

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-20" /></CardContent></Card>
          ))}
        </div>
      </div>
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
            <h1 className="text-2xl font-bold text-primary">
              Exploratory Data Analysis
            </h1>
            <p className="text-secondary mt-1">{dataset?.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {edaResult && <StatusBadge status={edaResult.status} />}
          <Button
            onClick={() => triggerMutation.mutate()}
            isLoading={triggerMutation.isPending || isRunning}
            leftIcon={<ArrowPathIcon className="w-5 h-5" />}
          >
            {edaResult ? 'Refresh Analysis' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {!edaResult || error ? (
        <EmptyState
          title="No analysis yet"
          description="Run exploratory data analysis to discover insights about your dataset."
          action={{
            label: 'Run Analysis',
            onClick: () => triggerMutation.mutate(),
          }}
        />
      ) : edaResult.status !== 'completed' ? (
        <Card>
          <CardContent className="py-12 text-center">
            <StatusBadge status={edaResult.status} />
            <p className="text-secondary mt-4">
              {edaResult.status === 'running' ? 'Analysis in progress...' : 'Analysis pending...'}
            </p>
            <Button variant="secondary" className="mt-4" onClick={() => refetch()}>
              Check Status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Computation Time</p>
                <p className="text-2xl font-bold text-primary">
                  {edaResult.computation_time ? formatDuration(edaResult.computation_time) : '-'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Insights Found</p>
                <p className="text-2xl font-bold text-primary">{edaResult.insights.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Top Correlations</p>
                <p className="text-2xl font-bold text-primary">{edaResult.top_correlations.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted mb-1">Sampled</p>
                <p className="text-2xl font-bold text-primary">
                  {edaResult.sampled ? `Yes (${edaResult.sample_size?.toLocaleString()})` : 'No'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Insights */}
          {edaResult.insights.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Key Insights</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {edaResult.insights.map((insight, i) => (
                    <li key={i} className={cn(
                      'p-3 rounded-lg',
                      insight.type === 'warning' ? 'bg-warning-50 dark:bg-warning-900/20' :
                      insight.type === 'success' ? 'bg-success-50 dark:bg-success-900/20' :
                      'bg-info-50 dark:bg-info-900/20'
                    )}>
                      <p className="text-sm text-primary">{insight.message}</p>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Top Correlations */}
          {edaResult.top_correlations.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Top Correlations</CardTitle></CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-subtle">
                      <th className="px-4 py-3 text-left">Column 1</th>
                      <th className="px-4 py-3 text-left">Column 2</th>
                      <th className="px-4 py-3 text-left">Correlation</th>
                      <th className="px-4 py-3 text-left">Strength</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edaResult.top_correlations.slice(0, 10).map((corr, i) => (
                      <tr key={i} className="border-b border-subtle last:border-0">
                        <td className="px-4 py-3 text-primary">{corr.column1}</td>
                        <td className="px-4 py-3 text-primary">{corr.column2}</td>
                        <td className="px-4 py-3 text-secondary">{formatNumber(corr.correlation, 3)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            corr.strength === 'strong' ? 'bg-success-100 text-success-700' :
                            corr.strength === 'moderate' ? 'bg-warning-100 text-warning-700' :
                            'bg-neutral-100 text-neutral-600'
                          )}>
                            {corr.strength}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {edaResult.ai_insights && (
            <Card>
              <CardHeader><CardTitle>AI Summary</CardTitle></CardHeader>
              <CardContent>
                <p className="text-secondary whitespace-pre-wrap">{edaResult.ai_insights}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default EDAPage
