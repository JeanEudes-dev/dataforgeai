import { useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ChartBarIcon,
  TableCellsIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ClockIcon,
  SparklesIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
  MarkdownRenderer,
} from "@/components/ui";
import { StatusBadge, EmptyState } from "@/components/shared";
import {
  StatCard,
  DistributionChart,
  CorrelationHeatmap,
  MissingValuesChart,
  OutliersChart,
  InsightsPanel,
  SummaryStatsTable,
} from "@/components/charts";
import { edaApi, datasetsApi } from "@/api";
import { useToastActions } from "@/contexts";
import { formatNumber, formatDuration, cn } from "@/utils";

type TabId =
  | "overview"
  | "distributions"
  | "correlations"
  | "quality"
  | "insights";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: "overview", label: "Overview", icon: ChartBarIcon },
  { id: "distributions", label: "Distributions", icon: ChartBarIcon },
  { id: "correlations", label: "Correlations", icon: TableCellsIcon },
  { id: "quality", label: "Data Quality", icon: ExclamationTriangleIcon },
  { id: "insights", label: "Insights", icon: LightBulbIcon },
];

export function EDAPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const queryClient = useQueryClient();
  const toast = useToastActions();
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const { data: dataset } = useQuery({
    queryKey: ["datasets", datasetId],
    queryFn: () => datasetsApi.get(datasetId!),
    enabled: !!datasetId,
  });

  const {
    data: edaResult,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["eda", datasetId, "latest"],
    queryFn: () => edaApi.getLatestByDataset(datasetId!),
    enabled: !!datasetId,
    retry: false,
  });

  const triggerMutation = useMutation({
    mutationFn: () => edaApi.trigger({ dataset_id: datasetId!, async: true }),
    onSuccess: () => {
      toast.success("Analysis started", "EDA is running in the background.");
      queryClient.invalidateQueries({ queryKey: ["eda", datasetId] });
    },
    onError: () => {
      toast.error("Analysis failed", "Could not start EDA.");
    },
  });

  const isRunning =
    edaResult?.status === "running" || edaResult?.status === "pending";
  const isRequesting = triggerMutation.isPending || isRunning;

  // Calculate data quality score
  const dataQualityScore = useMemo(() => {
    if (!edaResult?.missing_analysis) return null;
    const columns = Object.values(edaResult.missing_analysis);
    if (columns.length === 0) return 100;
    const avgMissing =
      columns.reduce((sum, col) => sum + col.ratio, 0) / columns.length;
    return Math.round((1 - avgMissing) * 100);
  }, [edaResult]);

  // Get distribution columns for preview
  const distributionColumns = useMemo(() => {
    if (!edaResult?.distributions) return [];
    return Object.keys(edaResult.distributions).slice(0, 6);
  }, [edaResult]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
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
            {edaResult ? "Refresh Analysis" : "Run Analysis"}
          </Button>
        </div>
      </div>

      {isRequesting && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="py-6 px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600 dark:text-primary-400">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                  Analysis in progress
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  EDA is running in the background. You can stay on this page;
                  we’ll refresh results automatically.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                Profiling columns
              </span>
              <span className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                Computing stats
              </span>
              <span className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                Detecting outliers
              </span>
              <span className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                Building visuals
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {!edaResult || error ? (
        <EmptyState
          title="No analysis yet"
          description="Run exploratory data analysis to discover insights about your dataset."
          action={{
            label: "Run Analysis",
            onClick: () => triggerMutation.mutate(),
          }}
        />
      ) : edaResult.status !== "completed" ? (
        <Card>
          <CardContent className="py-12 text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <ArrowPathIcon className="w-8 h-8 text-primary-500" />
            </motion.div>
            <StatusBadge status={edaResult.status} />
            <p className="text-secondary mt-4">
              {edaResult.status === "running"
                ? "Analysis in progress..."
                : "Analysis pending..."}
            </p>
            <Button
              variant="secondary"
              className="mt-4"
              onClick={() => refetch()}
            >
              Check Status
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeTab === tab.id
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Hero Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Analysis Time"
                      value={
                        edaResult.computation_time
                          ? formatDuration(edaResult.computation_time)
                          : "-"
                      }
                      icon={<ClockIcon className="w-full h-full" />}
                      color="primary"
                    />
                    <StatCard
                      title="Insights Found"
                      value={edaResult.insights.length}
                      subtitle={
                        edaResult.insights.filter((i) => i.severity === "high")
                          .length + " high priority"
                      }
                      icon={<LightBulbIcon className="w-full h-full" />}
                      color="info"
                    />
                    <StatCard
                      title="Data Quality"
                      value={
                        dataQualityScore !== null ? `${dataQualityScore}%` : "-"
                      }
                      subtitle={
                        dataQualityScore && dataQualityScore >= 90
                          ? "Excellent"
                          : dataQualityScore && dataQualityScore >= 70
                            ? "Good"
                            : "Needs attention"
                      }
                      icon={<ChartBarIcon className="w-full h-full" />}
                      color={
                        dataQualityScore && dataQualityScore >= 90
                          ? "success"
                          : dataQualityScore && dataQualityScore >= 70
                            ? "warning"
                            : "error"
                      }
                    />
                    <StatCard
                      title="Correlations"
                      value={edaResult.top_correlations.length}
                      subtitle={
                        edaResult.top_correlations.filter(
                          (c) => c.strength === "strong"
                        ).length + " strong"
                      }
                      icon={<TableCellsIcon className="w-full h-full" />}
                      color="default"
                    />
                  </div>

                  {/* Quick Preview: Distributions */}
                  {distributionColumns.length > 0 && (
                    <Card padding="none">
                      <CardHeader className="px-6 pt-6">
                        <div className="flex items-center justify-between">
                          <CardTitle>Distribution Preview</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("distributions")}
                          >
                            View all{" "}
                            <ChevronDownIcon className="w-4 h-4 ml-1 rotate-[-90deg]" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {distributionColumns.slice(0, 3).map((col) => (
                            <DistributionChart
                              key={col}
                              columnName={col}
                              data={edaResult.distributions[col]}
                              height={180}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quick Preview: Correlations */}
                  {Object.keys(edaResult.correlation_matrix || {}).length >
                    0 && (
                    <Card padding="none">
                      <CardHeader className="px-6 pt-6">
                        <div className="flex items-center justify-between">
                          <CardTitle>Correlation Matrix</CardTitle>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveTab("correlations")}
                          >
                            Details{" "}
                            <ChevronDownIcon className="w-4 h-4 ml-1 rotate-[-90deg]" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <CorrelationHeatmap
                          matrix={edaResult.correlation_matrix}
                          maxItems={6}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Summary */}
                  {edaResult.ai_insights && (
                    <Card padding="none" className="overflow-hidden">
                      <div className="bg-gradient-to-r from-info-500 to-primary-500 px-6 py-4">
                        <div className="flex items-center gap-2 text-white">
                          <SparklesIcon className="w-5 h-5" />
                          <h3 className="font-semibold">
                            AI-Generated Summary
                          </h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <MarkdownRenderer
                          content={edaResult.ai_insights}
                          className="text-secondary"
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Distributions Tab */}
              {activeTab === "distributions" && (
                <div className="space-y-6">
                  <Card padding="none">
                    <CardHeader className="px-6 pt-6">
                      <CardTitle>Column Distributions</CardTitle>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Visualize the distribution of values in each column
                      </p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      {Object.keys(edaResult.distributions || {}).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                          {Object.entries(edaResult.distributions).map(
                            ([col, data]) => (
                              <div
                                key={col}
                                className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4"
                              >
                                <DistributionChart
                                  columnName={col}
                                  data={data}
                                  height={200}
                                />
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                          No distribution data available
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Summary Statistics Table */}
                  {Object.keys(edaResult.summary_stats || {}).length > 0 && (
                    <Card padding="none">
                      <CardHeader className="px-6 pt-6">
                        <CardTitle>Summary Statistics</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">
                          Click on a row to see percentile details
                        </p>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <SummaryStatsTable data={edaResult.summary_stats} />
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Correlations Tab */}
              {activeTab === "correlations" && (
                <div className="space-y-6">
                  {/* Full Heatmap */}
                  <Card padding="none">
                    <CardHeader className="px-6 pt-6">
                      <CardTitle>Correlation Heatmap</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Hover over cells to see exact correlation values
                      </p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <CorrelationHeatmap
                        matrix={edaResult.correlation_matrix}
                        maxItems={12}
                      />
                    </CardContent>
                  </Card>

                  {/* Top Correlations Table */}
                  {edaResult.top_correlations.length > 0 && (
                    <Card padding="none">
                      <CardHeader className="px-6 pt-6">
                        <CardTitle>Top Correlations</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Strongest relationships between columns
                        </p>
                      </CardHeader>
                      <CardContent className="px-6 pb-6">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Column 1
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Column 2
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Correlation
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Strength
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">
                                  Visual
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {edaResult.top_correlations
                                .slice(0, 15)
                                .map((corr, i) => (
                                  <motion.tr
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                  >
                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                                      {corr.column1}
                                    </td>
                                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">
                                      {corr.column2}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                                      {formatNumber(corr.correlation, 3)}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={cn(
                                          "px-2.5 py-1 rounded-full text-xs font-medium",
                                          corr.strength === "strong"
                                            ? "bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300"
                                            : corr.strength === "moderate"
                                              ? "bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300"
                                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                        )}
                                      >
                                        {corr.strength}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="w-24 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                          className={cn(
                                            "h-full rounded-full",
                                            corr.correlation >= 0
                                              ? "bg-primary-500"
                                              : "bg-error-500"
                                          )}
                                          style={{
                                            width: `${Math.abs(corr.correlation) * 100}%`,
                                          }}
                                        />
                                      </div>
                                    </td>
                                  </motion.tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Data Quality Tab */}
              {activeTab === "quality" && (
                <div className="space-y-6">
                  {/* Quality Score Banner */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "p-6 rounded-2xl text-white",
                      dataQualityScore && dataQualityScore >= 90
                        ? "bg-gradient-to-r from-success-500 to-success-600"
                        : dataQualityScore && dataQualityScore >= 70
                          ? "bg-gradient-to-r from-warning-500 to-warning-600"
                          : "bg-gradient-to-r from-error-500 to-error-600"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-sm font-medium">
                          Overall Data Quality Score
                        </p>
                        <p className="text-4xl font-bold mt-1">
                          {dataQualityScore}%
                        </p>
                        <p className="text-white/80 text-sm mt-2">
                          {dataQualityScore && dataQualityScore >= 90
                            ? "Excellent! Your data is well-prepared for analysis."
                            : dataQualityScore && dataQualityScore >= 70
                              ? "Good quality, but some columns need attention."
                              : "Consider cleaning your data before proceeding."}
                        </p>
                      </div>
                      <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                        <span className="text-3xl font-bold">
                          {dataQualityScore}%
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Missing Values */}
                  <Card padding="none">
                    <CardHeader className="px-6 pt-6">
                      <CardTitle>Missing Values Analysis</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Identify columns with missing data
                      </p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <MissingValuesChart
                        data={edaResult.missing_analysis}
                        totalRows={dataset?.row_count ?? undefined}
                      />
                    </CardContent>
                  </Card>

                  {/* Outliers */}
                  <Card padding="none">
                    <CardHeader className="px-6 pt-6">
                      <CardTitle>Outlier Detection</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Values that fall outside the expected range
                      </p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <OutliersChart data={edaResult.outlier_analysis} />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === "insights" && (
                <div className="space-y-6">
                  {/* AI Summary at top */}
                  {edaResult.ai_insights && (
                    <Card padding="none" className="overflow-hidden">
                      <div className="bg-gradient-to-r from-info-500 to-primary-500 px-6 py-4">
                        <div className="flex items-center gap-2 text-white">
                          <SparklesIcon className="w-5 h-5" />
                          <h3 className="font-semibold">
                            AI-Generated Analysis
                          </h3>
                        </div>
                      </div>
                      <CardContent className="p-6">
                        <MarkdownRenderer
                          content={edaResult.ai_insights}
                          className="text-secondary"
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Automated Insights */}
                  <Card padding="none">
                    <CardHeader className="px-6 pt-6">
                      <CardTitle>Automated Insights</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Key findings from your data analysis
                      </p>
                    </CardHeader>
                    <CardContent className="px-6 pb-6">
                      <InsightsPanel
                        insights={edaResult.insights}
                        maxItems={20}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Sampling Notice */}
          {edaResult.sampled && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-4 py-3 bg-info-50 dark:bg-info-900/30 border border-info-200 dark:border-info-800 rounded-xl text-sm text-info-700 dark:text-info-300"
            >
              <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
              <span>
                This analysis was performed on a sample of{" "}
                <strong>{edaResult.sample_size?.toLocaleString()}</strong> rows
                for performance.
              </span>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}

export default EDAPage;
