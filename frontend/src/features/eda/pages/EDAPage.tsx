import React from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import {
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  Info,
  Database,
  Layers,
  Zap,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import { pageVariants } from "../../../theme/motion";
import { Chart } from "../../../components/ui/chart";

export const EDAPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const datasetId = searchParams.get("datasetId");
  const [selectedFeature, setSelectedFeature] = React.useState<string | null>(
    null
  );

  const {
    data: latestEDA,
    isLoading: isLoadingEDA,
    refetch,
  } = useQuery({
    queryKey: ["eda-latest", datasetId],
    queryFn: async () => {
      if (!datasetId) return null;
      const response = await apiClient.get(`/eda/dataset/${datasetId}/latest/`);
      return response.data;
    },
    enabled: !!datasetId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "running" ? 2000 : false;
    },
  });

  // Set initial selected feature
  React.useEffect(() => {
    if (latestEDA?.distributions && !selectedFeature) {
      const features = Object.keys(latestEDA.distributions).filter(
        (col) => col !== latestEDA.target_analysis?.target_column
      );
      if (features.length > 0) {
        setSelectedFeature(features[0]);
      }
    }
  }, [latestEDA, selectedFeature]);

  const triggerEDA = useMutation({
    mutationFn: async (forceRefresh: boolean = false) => {
      const response = await apiClient.post(
        `/eda/?async=true${forceRefresh ? "&force_refresh=true" : ""}`,
        {
          dataset_id: datasetId,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      refetch();
    },
  });

  const heatmapOption = React.useMemo(() => {
    const correlationMatrix = latestEDA?.correlation_matrix || {};
    const columns = Object.keys(correlationMatrix);
    const heatmapData = [];
    for (let i = 0; i < columns.length; i++) {
      for (let j = 0; j < columns.length; j++) {
        heatmapData.push([
          i,
          j,
          correlationMatrix[columns[i]][columns[j]] || 0,
        ]);
      }
    }

    return {
      tooltip: { position: "top" },
      grid: { height: "70%", top: "10%" },
      xAxis: { type: "category", data: columns, splitArea: { show: true } },
      yAxis: { type: "category", data: columns, splitArea: { show: true } },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        inRange: { color: ["#ef4444", "#f8fafc", "#3b82f6"] },
      },
      series: [
        {
          name: "Correlation",
          type: "heatmap",
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" },
          },
        },
      ],
    };
  }, [latestEDA?.correlation_matrix]);

  const missingOption = React.useMemo(() => {
    const missingAnalysis = latestEDA?.missing_analysis || {};
    const missingCols = Object.keys(missingAnalysis);
    const missingRatios = missingCols.map((col) =>
      ((missingAnalysis[col].ratio || 0) * 100).toFixed(2)
    );

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
      yAxis: { type: "category", data: missingCols },
      series: [
        {
          name: "Missing Ratio",
          type: "bar",
          data: missingRatios,
          itemStyle: { color: "#f59e0b" },
        },
      ],
    };
  }, [latestEDA?.missing_analysis]);

  const distributionOption = React.useMemo(() => {
    if (!selectedFeature || !latestEDA?.distributions?.[selectedFeature])
      return null;

    const dist = latestEDA.distributions[selectedFeature];
    const isNumeric = dist.type === "numeric";

    if (isNumeric) {
      return {
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const p = params[0];
            const binStart = dist.bins[p.dataIndex];
            const binEnd = dist.bins[p.dataIndex + 1];
            return `${selectedFeature}<br/>Range: ${binStart.toFixed(
              2
            )} - ${binEnd.toFixed(2)}<br/>Count: ${p.value}`;
          },
        },
        grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
        xAxis: {
          type: "category",
          data: dist.bins.slice(0, -1).map((b: number) => b.toFixed(2)),
          name: "Value",
          nameLocation: "middle",
          nameGap: 35,
        },
        yAxis: { type: "value", name: "Frequency" },
        series: [
          {
            name: selectedFeature,
            type: "bar",
            data: dist.counts,
            barWidth: "95%",
            itemStyle: {
              color: "#3b82f6",
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };
    } else {
      return {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
        xAxis: {
          type: "category",
          data: dist.labels,
          axisLabel: { rotate: 45, interval: 0 },
        },
        yAxis: { type: "value" },
        series: [
          {
            name: selectedFeature,
            type: "bar",
            data: dist.counts,
            itemStyle: {
              color: "#10b981",
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };
    }
  }, [selectedFeature, latestEDA?.distributions]);

  const targetDistributionOption = React.useMemo(() => {
    const targetAnalysis = latestEDA?.target_analysis || {};
    if (!targetAnalysis.distribution) return null;

    const isClassification = targetAnalysis.task_type === "classification";

    if (isClassification) {
      const data = Object.entries(targetAnalysis.distribution).map(
        ([name, info]: [string, any]) => ({
          name,
          value: info.count,
        })
      );

      return {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        legend: {
          orient: "horizontal",
          bottom: "0",
          left: "center",
          type: "scroll",
        },
        series: [
          {
            name: "Target Distribution",
            type: "pie",
            radius: ["40%", "70%"],
            center: ["50%", "45%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: { show: false, position: "center" },
            emphasis: {
              label: { show: true, fontSize: 16, fontWeight: "bold" },
            },
            labelLine: { show: false },
            data: data,
          },
        ],
      };
    } else {
      const targetCol = targetAnalysis.target_column;
      const dist = latestEDA?.distributions?.[targetCol];

      if (dist && dist.type === "numeric") {
        return {
          tooltip: {
            trigger: "axis",
            formatter: (params: any) => {
              const p = params[0];
              return `Target: ${targetCol}<br/>Range: ${dist.bins[
                p.dataIndex
              ].toFixed(2)} - ${dist.bins[p.dataIndex + 1].toFixed(
                2
              )}<br/>Count: ${p.value}`;
            },
          },
          grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
          xAxis: {
            type: "category",
            data: dist.bins.slice(0, -1).map((b: number) => b.toFixed(2)),
          },
          yAxis: { type: "value" },
          series: [
            {
              data: dist.counts,
              type: "bar",
              barWidth: "95%",
              itemStyle: { color: "#8b5cf6", borderRadius: [4, 4, 0, 0] },
            },
          ],
        };
      }
      return null;
    }
  }, [latestEDA?.target_analysis, latestEDA?.distributions]);

  if (!datasetId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-semibold">No dataset selected</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Please select a dataset from the Datasets page to view its exploratory
          analysis.
        </p>
        <Link to="/app/datasets" className="mt-6">
          <Button>Go to Datasets</Button>
        </Link>
      </div>
    );
  }

  if (isLoadingEDA) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!latestEDA) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Info className="h-16 w-16 text-primary/20 mb-4" />
        <h2 className="text-xl font-semibold">Ready for Analysis</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          We haven't analyzed this dataset yet. Click the button below to
          generate insights.
        </p>
        <Button
          className="mt-6"
          onClick={() => triggerEDA.mutate()}
          disabled={triggerEDA.isPending}
        >
          {triggerEDA.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <BarChart3 className="mr-2 h-4 w-4" />
          )}
          Start EDA
        </Button>
      </div>
    );
  }

  if (latestEDA.status === "pending" || latestEDA.status === "running") {
    const steps = [
      { label: "Loading dataset", status: "completed" },
      {
        label: "Computing statistics",
        status: latestEDA.status === "running" ? "current" : "pending",
      },
      { label: "Analyzing distributions", status: "pending" },
      { label: "Generating AI insights", status: "pending" },
    ];

    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center max-w-2xl mx-auto">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative mb-8"
        >
          <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2">
            <span className="relative flex h-6 w-6">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-6 w-6 bg-primary"></span>
            </span>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold mb-2">Analyzing your data...</h2>
        <p className="text-muted-foreground mb-12">
          Our AI is crunching the numbers to find patterns and insights. This
          usually takes less than a minute.
        </p>

        <div className="w-full space-y-4">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card/50"
            >
              {step.status === "completed" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : step.status === "current" ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <div className="h-5 w-5 rounded-full border-2 border-muted" />
              )}
              <span
                className={
                  step.status === "pending"
                    ? "text-muted-foreground"
                    : "font-medium"
                }
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-12 w-full bg-muted rounded-full h-1.5 overflow-hidden">
          <motion.div
            className="bg-primary h-full"
            initial={{ width: "0%" }}
            animate={{
              width: latestEDA.status === "running" ? "60%" : "20%",
            }}
            transition={{ duration: 2 }}
          />
        </div>

        {/* Show retry option if it's taking too long (e.g., > 30s) */}
        {new Date().getTime() - new Date(latestEDA.created_at).getTime() >
          30000 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 p-4 bg-amber-50 border border-amber-100 rounded-lg text-amber-800 text-sm"
          >
            <p className="mb-3">
              This is taking longer than expected. The background worker might
              be busy or stuck.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-amber-200 hover:bg-amber-100 text-amber-800"
              onClick={() => triggerEDA.mutate(true)}
              disabled={triggerEDA.isPending}
            >
              <RefreshCw
                className={`mr-2 h-3 w-3 ${
                  triggerEDA.isPending ? "animate-spin" : ""
                }`}
              />
              Force Restart Analysis
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  if (latestEDA.status === "error") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertCircle className="h-16 w-16 text-destructive/20 mb-4" />
        <h2 className="text-xl font-semibold text-destructive">
          Analysis Failed
        </h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          {latestEDA.error_message ||
            "An error occurred during the analysis process."}
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => triggerEDA.mutate()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Analysis
        </Button>
      </div>
    );
  }

  const globalMetrics = latestEDA?.global_metrics || {};
  const targetAnalysis = latestEDA?.target_analysis || {};

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Exploratory Data Analysis
          </h1>
          <p className="text-muted-foreground">
            Insights for {latestEDA.dataset_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => triggerEDA.mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Link to={`/app/modeling?datasetId=${datasetId}`}>
            <Button>
              Continue to Modeling
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card p-6 rounded-xl border border-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Rows
              </p>
              <p className="text-2xl font-bold mt-1">
                {globalMetrics.total_rows?.toLocaleString() ||
                  latestEDA.summary_stats?.row_count?.toLocaleString() ||
                  latestEDA.dataset?.row_count?.toLocaleString() ||
                  "N/A"}
              </p>
            </div>
            <Database className="h-5 w-5 text-muted-foreground/40" />
          </div>
          {globalMetrics.duplicate_rows > 0 && (
            <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
              <ShieldAlert className="h-3 w-3" />
              {globalMetrics.duplicate_rows} duplicates found
            </p>
          )}
        </div>

        <div className="bg-card p-6 rounded-xl border border-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Columns
              </p>
              <p className="text-2xl font-bold mt-1">
                {globalMetrics.total_columns ||
                  latestEDA.summary_stats?.column_count ||
                  latestEDA.dataset?.column_count ||
                  "N/A"}
              </p>
            </div>
            <Layers className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Memory: {globalMetrics.memory_usage_display || "N/A"}
          </p>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Quality Score
              </p>
              <div className="flex items-baseline gap-1">
                <p
                  className={`text-2xl font-bold mt-1 ${
                    globalMetrics.quality_score >= 80
                      ? "text-green-600"
                      : globalMetrics.quality_score >= 50
                      ? "text-amber-600"
                      : "text-destructive"
                  }`}
                >
                  {globalMetrics.quality_score || 0}
                </p>
                <span className="text-xs text-muted-foreground">/100</span>
              </div>
            </div>
            <Zap className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full ${
                globalMetrics.quality_score >= 80
                  ? "bg-green-500"
                  : globalMetrics.quality_score >= 50
                  ? "bg-amber-500"
                  : "bg-destructive"
              }`}
              style={{ width: `${globalMetrics.quality_score || 0}%` }}
            />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Target Analysis
              </p>
              <p className="text-lg font-bold mt-1 text-primary truncate max-w-[150px]">
                {targetAnalysis.target_column || "Auto-detect"}
              </p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground/40" />
          </div>
          <p className="text-xs font-medium text-muted-foreground mt-2 capitalize">
            Task: {targetAnalysis.task_type || "Unknown"}
          </p>
        </div>
      </div>

      {/* Target & AI Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Target Analysis Details */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Target Diagnostics
          </h3>
          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-1">Task Type</p>
              <p className="font-medium capitalize">
                {targetAnalysis.task_type || "Not detected"}
              </p>
            </div>

            {targetAnalysis.warnings?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-amber-600 flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Warnings
                </p>
                {targetAnalysis.warnings.map((warning: any, i: number) => (
                  <div
                    key={i}
                    className="text-xs p-2 bg-amber-50 border border-amber-100 rounded text-amber-800"
                  >
                    {typeof warning === "string" ? warning : warning.message}
                  </div>
                ))}
              </div>
            )}

            {targetAnalysis.distribution &&
              targetAnalysis.task_type === "classification" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Class Balance</p>
                  {Object.entries(targetAnalysis.distribution).map(
                    ([label, info]: [string, any]) => (
                      <div key={label} className="space-y-1">
                        <div className="flex justify-between text-[10px]">
                          <span className="truncate max-w-[100px]">
                            {label}
                          </span>
                          <span>{info.percentage}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${info.percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="lg:col-span-2 bg-primary/5 border border-primary/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">AI Insights</h3>
          </div>
          <ul className="space-y-3">
            {(typeof latestEDA.ai_insights === "string"
              ? latestEDA.ai_insights
                  .split("\n")
                  .filter((line) => line.trim().length > 0)
              : Array.isArray(latestEDA.ai_insights)
              ? latestEDA.ai_insights
              : []
            ).map((insight: string, i: number) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {insight.replace(/^[*-]\s*/, "")}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Distribution Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Target Distribution */}
        <div className="lg:col-span-1 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Target Distribution
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase">
              {targetAnalysis.task_type}
            </span>
          </div>
          <div className="h-[300px]">
            {targetDistributionOption ? (
              <Chart option={targetDistributionOption} />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                No distribution data available
              </div>
            )}
          </div>
          {targetAnalysis.task_type === "regression" &&
            targetAnalysis.distribution?.skewness && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 text-xs font-medium mb-1">
                  <Info className="h-3 w-3" />
                  Distribution Insight
                </div>
                <p className="text-[11px] text-blue-700">
                  {Math.abs(targetAnalysis.distribution.skewness || 0) > 1
                    ? `Heavy skew detected (${(
                        targetAnalysis.distribution.skewness || 0
                      ).toFixed(
                        2
                      )}). A log transformation might improve model performance.`
                    : `Target distribution is relatively symmetric (skew: ${(
                        targetAnalysis.distribution.skewness || 0
                      ).toFixed(2)}).`}
                </p>
              </div>
            )}
        </div>

        {/* Feature Distributions */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Feature Distributions
            </h3>
            <select
              className="text-sm border border-border rounded-md bg-background px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedFeature || ""}
              onChange={(e) => setSelectedFeature(e.target.value)}
            >
              <option value="" disabled>
                Select a feature to visualize
              </option>
              {Object.keys(latestEDA.distributions || {})
                .filter((col) => col !== targetAnalysis.target_column)
                .map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
            </select>
          </div>

          <div className="h-[300px]">
            {selectedFeature ? (
              <Chart option={distributionOption!} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm italic border-2 border-dashed border-muted rounded-xl">
                <BarChart3 className="h-8 w-8 mb-2 opacity-20" />
                Select a feature from the dropdown to see its distribution
              </div>
            )}
          </div>

          {selectedFeature &&
            latestEDA.summary_stats?.[selectedFeature]?.skewness !==
              undefined && (
              <div className="mt-4 flex items-center gap-4">
                <div className="text-xs">
                  <span className="text-muted-foreground">Skewness:</span>{" "}
                  <span
                    className={
                      Math.abs(
                        latestEDA.summary_stats[selectedFeature].skewness || 0
                      ) > 1
                        ? "text-amber-600 font-bold"
                        : "text-foreground font-medium"
                    }
                  >
                    {(
                      latestEDA.summary_stats[selectedFeature].skewness || 0
                    ).toFixed(2)}
                  </span>
                </div>
                {Math.abs(
                  latestEDA.summary_stats[selectedFeature].skewness || 0
                ) > 1 && (
                  <div className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Consider Log Transform
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-6">Correlation Heatmap</h3>
          <div className="h-[400px]">
            <Chart option={heatmapOption} />
          </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-border">
          <h3 className="font-semibold mb-6">Missing Values by Column</h3>
          <div className="h-[400px]">
            <Chart option={missingOption} />
          </div>
        </div>
      </div>

      {/* Redundant Features (Multicollinearity) */}
      {globalMetrics.multicollinearity?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert className="h-5 w-5 text-amber-600" />
            <h3 className="font-semibold text-amber-900">
              Redundant Features Detected
            </h3>
          </div>
          <p className="text-sm text-amber-800 mb-4">
            The following pairs of columns are highly correlated. Consider
            removing one of them to improve model stability and
            interpretability.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalMetrics.multicollinearity.map((item: any, i: number) => (
              <div
                key={i}
                className="bg-white/50 border border-amber-100 rounded-lg p-3 flex justify-between items-center"
              >
                <div className="text-xs font-medium">
                  <span className="text-amber-900">{item.column1}</span>
                  <span className="mx-2 text-amber-400">↔</span>
                  <span className="text-amber-900">{item.column2}</span>
                </div>
                <span
                  className={`text-xs font-bold ${
                    item.severity === "high"
                      ? "text-destructive"
                      : "text-amber-600"
                  }`}
                >
                  {(item.correlation * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Diagnostics Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold">Column Diagnostics</h3>
          <p className="text-sm text-muted-foreground">
            Detailed health check for each feature
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-medium">
              <tr>
                <th className="px-6 py-3">Column</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Missing</th>
                <th className="px-6 py-3">Unique</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Object.entries(latestEDA.summary_stats || {})
                .filter(
                  ([key]) =>
                    !["row_count", "column_count", "total_missing"].includes(
                      key
                    )
                )
                .map(([colName, stats]: [string, any]) => {
                  const missing = latestEDA.missing_analysis?.[colName] || {};
                  const isConstant = stats.unique_count === 1;
                  const highMissing = missing.ratio > 0.5;
                  const highCardinality =
                    stats.unique_count > globalMetrics.total_rows * 0.9 &&
                    stats.type === "object";

                  return (
                    <tr
                      key={colName}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">{colName}</td>
                      <td className="px-6 py-4 text-muted-foreground capitalize">
                        {stats.type}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            missing.count > 0
                              ? "text-amber-600 font-medium"
                              : "text-green-600"
                          }
                        >
                          {missing.count || 0} (
                          {(missing.ratio * 100 || 0).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {stats.unique_count || "N/A"}
                      </td>
                      <td className="px-6 py-4">
                        {isConstant ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive">
                            Constant
                          </span>
                        ) : highMissing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            High Missing
                          </span>
                        ) : highCardinality ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            ID-like
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Healthy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
