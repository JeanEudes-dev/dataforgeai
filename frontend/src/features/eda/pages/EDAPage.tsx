/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { containerVariants, listItemVariants } from "../../../theme/motion";
import { Chart } from "../../../components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { useTheme } from "../../../components/theme-provider";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { datasetsApi } from "../../../api/datasets";

export const EDAPage: React.FC = () => {
  const { theme } = useTheme();
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

  const { data: previewData } = useQuery({
    queryKey: ["dataset-preview", datasetId],
    queryFn: () => datasetsApi.getPreview(datasetId!),
    enabled: !!datasetId,
  });

  const { data: schemaData } = useQuery({
    queryKey: ["dataset-schema", datasetId],
    queryFn: () => datasetsApi.getSchema(datasetId!),
    enabled: !!datasetId,
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
      grid: { height: "70%", top: "10%", containLabel: true },
      xAxis: { type: "category", data: columns, splitArea: { show: true } },
      yAxis: { type: "category", data: columns, splitArea: { show: true } },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        inRange: {
          color:
            theme === "dark"
              ? ["#f87171", "#1e293b", "#60a5fa"]
              : ["#ef4444", "#f8fafc", "#3b82f6"],
        },
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
  }, [latestEDA?.correlation_matrix, theme]);

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
          onClick={() => triggerEDA.mutate(false)}
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
            className="mt-8 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-lg text-amber-950 dark:text-amber-200 text-sm"
          >
            <p className="mb-3">
              This is taking longer than expected. The background worker might
              be busy or stuck.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="bg-white dark:bg-background border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-900 dark:text-amber-200"
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
          onClick={() => triggerEDA.mutate(false)}
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
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Exploratory Data Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Insights and patterns for {latestEDA.dataset_name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="shadow-sm"
            onClick={() => triggerEDA.mutate(true)}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                triggerEDA.isPending ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
          <Link to={`/app/modeling?datasetId=${datasetId}`}>
            <Button className="shadow-sm">
              Continue to Modeling
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-8">
        <TabsList>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="preview">Data Preview</TabsTrigger>
          <TabsTrigger value="schema">Schema</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-10">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Rows
                  </CardTitle>
                  <div className="p-2 rounded-lg">
                    <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {globalMetrics.total_rows?.toLocaleString() ||
                      latestEDA.summary_stats?.row_count?.toLocaleString() ||
                      latestEDA.dataset?.row_count?.toLocaleString() ||
                      "N/A"}
                  </div>
                  {globalMetrics.duplicate_rows > 0 ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      {globalMetrics.duplicate_rows} duplicates found
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">
                      No duplicates detected
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Columns
                  </CardTitle>
                  <div className="p-2 rounded-lg">
                    <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {globalMetrics.total_columns ||
                      latestEDA.summary_stats?.column_count ||
                      latestEDA.dataset?.column_count ||
                      "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Memory: {globalMetrics.memory_usage_display || "N/A"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Quality Score
                  </CardTitle>
                  <div className="p-2 rounded-lg">
                    <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline gap-1">
                    <div
                      className={`text-2xl font-bold ${
                        globalMetrics.quality_score >= 80
                          ? "text-emerald-600 dark:text-emerald-400"
                          : globalMetrics.quality_score >= 50
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-destructive"
                      }`}
                    >
                      {globalMetrics.quality_score || 0}
                    </div>
                    <span className="text-xs text-muted-foreground">/100</span>
                  </div>
                  <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${
                        globalMetrics.quality_score >= 80
                          ? "bg-emerald-500"
                          : globalMetrics.quality_score >= 50
                          ? "bg-amber-500"
                          : "bg-destructive"
                      }`}
                      style={{ width: `${globalMetrics.quality_score || 0}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Target Column
                  </CardTitle>
                  <div className="p-2 rounded-lg">
                    <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold truncate">
                    {targetAnalysis.target_column || "Auto-detect"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">
                    Task: {targetAnalysis.task_type || "Unknown"}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Target & AI Insights Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Target Analysis Details */}
            <motion.div variants={listItemVariants} className="lg:col-span-1">
              <Card className="h-full border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    Target Diagnostics
                  </CardTitle>
                  <CardDescription>
                    Health check for your target variable
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
                    <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wider">
                      Task Type
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {targetAnalysis.task_type || "Not detected"}
                    </p>
                  </div>

                  {targetAnalysis.warnings?.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Warnings
                      </p>
                      <div className="space-y-2">
                        {targetAnalysis.warnings.map(
                          (warning: any, i: number) => (
                            <div
                              key={i}
                              className="text-xs p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-lg text-amber-800 dark:text-amber-200 leading-relaxed"
                            >
                              {typeof warning === "string"
                                ? warning
                                : warning.message}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {targetAnalysis.distribution &&
                    targetAnalysis.task_type === "classification" && (
                      <div className="space-y-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Class Balance
                        </p>
                        <div className="space-y-3">
                          {Object.entries(targetAnalysis.distribution).map(
                            ([label, info]: [string, any]) => (
                              <div key={label} className="space-y-1.5">
                                <div className="flex justify-between text-xs">
                                  <span className="font-medium truncate max-w-37.5">
                                    {label}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {info.percentage}%
                                  </span>
                                </div>
                                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${info.percentage}%` }}
                                    className="bg-primary h-full rounded-full"
                                  />
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Insights */}
            <motion.div variants={listItemVariants} className="lg:col-span-2">
              <Card className="h-full border-none shadow-sm bg-primary/5 dark:bg-primary/10 border-primary/10">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-primary">
                    <Zap className="h-5 w-5" />
                    AI Insights
                  </CardTitle>
                  <CardDescription className="text-primary/70">
                    Automated observations from your data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(typeof latestEDA.ai_insights === "string"
                      ? latestEDA.ai_insights
                          .split("\n")
                          .filter((line: string) => line.trim().length > 0)
                      : Array.isArray(latestEDA.ai_insights)
                      ? latestEDA.ai_insights
                      : []
                    ).map((insight: string, i: number) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 p-4 bg-background/50 dark:bg-background/20 rounded-xl border border-primary/10 shadow-sm"
                      >
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0 shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                        <span className="text-sm leading-relaxed">
                          {insight.replace(/^[*-]\s*/, "")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Distribution Analysis Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Target Distribution */}
            <motion.div variants={listItemVariants} className="lg:col-span-1">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Target Distribution
                    </CardTitle>
                    <CardDescription>
                      Spread of the target variable
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="uppercase text-[10px]">
                    {targetAnalysis.task_type}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {targetDistributionOption ? (
                      <Chart option={targetDistributionOption} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic border-2 border-dashed border-muted rounded-xl">
                        No distribution data available
                      </div>
                    )}
                  </div>
                  {targetAnalysis.task_type === "regression" &&
                    targetAnalysis.distribution?.skewness && (
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-800 text-xs font-semibold mb-1.5">
                          <Info className="h-3.5 w-3.5" />
                          Distribution Insight
                        </div>
                        <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                          {Math.abs(targetAnalysis.distribution.skewness || 0) >
                          1
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
                </CardContent>
              </Card>
            </motion.div>

            {/* Feature Distributions */}
            <motion.div variants={listItemVariants} className="lg:col-span-2">
              <Card className="border-none shadow-sm">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">
                      Feature Distributions
                    </CardTitle>
                    <CardDescription>
                      Visualize individual column spreads
                    </CardDescription>
                  </div>
                  <select
                    className="text-sm border border-border rounded-lg bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    value={selectedFeature || ""}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                  >
                    <option value="" disabled>
                      Select a feature
                    </option>
                    {Object.keys(latestEDA.distributions || {})
                      .filter((col) => col !== targetAnalysis.target_column)
                      .map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                  </select>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {selectedFeature ? (
                      <Chart option={distributionOption!} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-sm italic border-2 border-dashed border-muted rounded-xl">
                        <BarChart3 className="h-10 w-10 mb-3 opacity-20" />
                        Select a feature from the dropdown to see its
                        distribution
                      </div>
                    )}
                  </div>

                  {selectedFeature &&
                    latestEDA.summary_stats?.[selectedFeature]?.skewness !==
                      undefined && (
                      <div className="mt-6 flex items-center gap-4">
                        <div className="text-xs font-medium px-3 py-1.5 bg-muted rounded-lg">
                          <span className="text-muted-foreground">
                            Skewness:
                          </span>{" "}
                          <span
                            className={
                              Math.abs(
                                latestEDA.summary_stats[selectedFeature]
                                  .skewness || 0
                              ) > 1
                                ? "text-amber-700 dark:text-amber-400 font-bold"
                                : "text-foreground"
                            }
                          >
                            {(
                              latestEDA.summary_stats[selectedFeature]
                                .skewness || 0
                            ).toFixed(2)}
                          </span>
                        </div>
                        {Math.abs(
                          latestEDA.summary_stats[selectedFeature].skewness || 0
                        ) > 1 && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30"
                          >
                            <Zap className="h-3 w-3 mr-1" />
                            Consider Log Transform
                          </Badge>
                        )}
                      </div>
                    )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Correlation Heatmap</CardTitle>
                  <CardDescription>
                    Relationships between numeric features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Chart option={heatmapOption} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Missing Values</CardTitle>
                  <CardDescription>Data completeness by column</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <Chart option={missingOption} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Redundant Features (Multicollinearity) */}
          {globalMetrics.multicollinearity?.length > 0 && (
            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm  border-amber-900">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-amber-950">
                    <ShieldAlert className="h-5 w-5 text-amber-950" />
                    Redundant Features Detected
                  </CardTitle>
                  <CardDescription className="text-amber-900">
                    Highly correlated column pairs that might affect model
                    stability
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {globalMetrics.multicollinearity.map(
                      (item: any, i: number) => (
                        <div
                          key={i}
                          className="bg-white/80 dark:bg-background/40 border border-amber-200/50 rounded-xl p-4 flex justify-between items-center shadow-sm"
                        >
                          <div className="text-xs font-semibold">
                            <span className="text-amber-950">
                              {item.column1}
                            </span>
                            <span className="mx-2 text-amber-600">↔</span>
                            <span className="text-amber-950">
                              {item.column2}
                            </span>
                          </div>
                          <Badge
                            variant="outline"
                            className="bg-amber-100/50 font-bold text-amber-700 border-amber-200"
                          >
                            {(item.correlation * 100).toFixed(1)}%
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Column Diagnostics Table */}
          <motion.div variants={listItemVariants}>
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg">Column Diagnostics</CardTitle>
                <CardDescription>
                  Detailed health check for each feature
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                      <tr>
                        <th className="px-6 py-4">Column</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Missing</th>
                        <th className="px-6 py-4">Unique</th>
                        <th className="px-6 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {Object.entries(latestEDA.summary_stats || {})
                        .filter(
                          ([key]) =>
                            ![
                              "row_count",
                              "column_count",
                              "total_missing",
                            ].includes(key)
                        )
                        .map(([colName, stats]: [string, any]) => {
                          const missing =
                            latestEDA.missing_analysis?.[colName] || {};
                          const isConstant = stats.unique_count === 1;
                          const highMissing = missing.ratio > 0.5;
                          const highCardinality =
                            stats.unique_count >
                              globalMetrics.total_rows * 0.9 &&
                            stats.type === "object";

                          return (
                            <tr
                              key={colName}
                              className="hover:bg-muted/20 transition-colors group"
                            >
                              <td className="px-6 py-4 font-semibold text-foreground">
                                {colName}
                              </td>
                              <td className="px-6 py-4">
                                <Badge
                                  variant="outline"
                                  className="font-normal capitalize "
                                >
                                  {stats.type}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={
                                    missing.count > 0
                                      ? "text-amber-600 dark:text-amber-400 font-medium"
                                      : "text-emerald-600 dark:text-emerald-400"
                                  }
                                >
                                  {missing.count || 0} (
                                  {(missing.ratio * 100 || 0).toFixed(1)}%)
                                </span>
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {stats.unique_count?.toLocaleString() || "N/A"}
                              </td>
                              <td className="px-6 py-4">
                                {isConstant ? (
                                  <Badge
                                    variant="destructive"
                                    className="font-medium"
                                  >
                                    Constant
                                  </Badge>
                                ) : highMissing ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-700 border-amber-200 "
                                  >
                                    High Missing
                                  </Badge>
                                ) : highCardinality ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-100  text-blue-800 border-blue-200 "
                                  >
                                    ID-like
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-emerald-100 text-emerald-800 border-emerald-200 "
                                  >
                                    Healthy
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Data Preview</CardTitle>
              <CardDescription>
                First {previewData?.rows?.length || 0} rows of the dataset
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewData?.columns?.map((col) => (
                        <TableHead key={col}>{col}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData?.rows?.map((row, i) => (
                      <TableRow key={i}>
                        {previewData.columns.map((col) => (
                          <TableCell key={col}>
                            {row[col]?.toString() || ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schema">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Schema</CardTitle>
              <CardDescription>Column types and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Column Name</TableHead>
                      <TableHead>Original Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pandas Type</TableHead>
                      <TableHead>Missing</TableHead>
                      <TableHead>Unique</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schemaData?.columns?.map((col) => (
                      <TableRow key={col.id}>
                        <TableCell className="font-medium">
                          {col.name}
                        </TableCell>
                        <TableCell>{col.original_name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{col.dtype}</Badge>
                        </TableCell>
                        <TableCell>{col.pandas_dtype}</TableCell>
                        <TableCell>
                          {col.null_count} ({(col.null_ratio * 100).toFixed(1)}
                          %)
                        </TableCell>
                        <TableCell>{col.unique_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
