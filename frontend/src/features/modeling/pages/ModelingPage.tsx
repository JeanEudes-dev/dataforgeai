import React, { useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import {
  Cpu,
  Loader2,
  ArrowRight,
  Trophy,
  BarChart2,
  Target,
  ShieldAlert,
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

interface Job {
  id: string;
  dataset: string;
  status: string;
}

interface Model {
  id: string;
  algorithm: string;
  metric_name: string;
  metric_value: number;
  created_at: string;
  model_type?: string;
  model_type_display?: string;
  task_type?: string;
  metrics?: Record<string, number>;
  feature_importance?: Record<string, number>;
}

export const ModelingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const datasetId = searchParams.get("datasetId");
  const [targetColumn, setTargetColumn] = React.useState<string>("");

  const { data: latestEDA } = useQuery({
    queryKey: ["eda-latest", datasetId],
    queryFn: async () => {
      if (!datasetId) return null;
      const response = await apiClient.get(`/eda/dataset/${datasetId}/latest/`);
      return response.data;
    },
    enabled: !!datasetId,
  });

  // Set default target column from EDA
  React.useEffect(() => {
    if (latestEDA?.target_analysis?.target_column && !targetColumn) {
      setTargetColumn(latestEDA.target_analysis.target_column);
    }
  }, [latestEDA, targetColumn]);

  const { data: models, refetch: refetchModels } = useQuery({
    queryKey: ["dataset-models", datasetId],
    queryFn: async () => {
      if (!datasetId) return null;
      const response = await apiClient.get(`/ml/dataset/${datasetId}/models/`);
      return response.data;
    },
    enabled: !!datasetId,
  });

  const { data: activeJobs, refetch: refetchJobs } = useQuery({
    queryKey: ["training-jobs", datasetId],
    queryFn: async () => {
      const response = await apiClient.get(`/ml/jobs/`);
      return response.data;
    },
    refetchInterval: (query) => {
      const jobs = query.state.data as { results: Job[] } | undefined;
      const hasRunningJob = jobs?.results?.some(
        (job) =>
          job.dataset === datasetId &&
          (job.status === "pending" || job.status === "running")
      );
      return hasRunningJob ? 2000 : false;
    },
  });

  const triggerTraining = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post(`/ml/train/?async=true`, {
        dataset_id: datasetId,
        target_column: targetColumn,
      });
      return response.data;
    },
    onSuccess: () => {
      refetchJobs();
    },
  });

  const isTraining = activeJobs?.results?.some(
    (job: Job) =>
      job.dataset === datasetId &&
      (job.status === "pending" || job.status === "running")
  );

  const featureImportanceOption = React.useMemo(() => {
    const bestModel = models?.results?.[0];
    if (!bestModel?.feature_importance) return null;

    const data = Object.entries(bestModel.feature_importance)
      .map(([name, value]) => ({ name, value: value as number }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "value" },
      yAxis: { type: "category", data: data.map((d) => d.name).reverse() },
      series: [
        {
          name: "Importance",
          type: "bar",
          data: data.map((d) => d.value).reverse(),
          itemStyle: { color: "#3b82f6" },
        },
      ],
    };
  }, [models?.results]);

  useEffect(() => {
    if (!isTraining && activeJobs) {
      refetchModels();
    }
  }, [isTraining, activeJobs, refetchModels]);

  if (!datasetId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Cpu className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-semibold">No dataset selected</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Please select a dataset from the Datasets page to start training
          models.
        </p>
        <Link to="/app/datasets" className="mt-6">
          <Button>Go to Datasets</Button>
        </Link>
      </div>
    );
  }

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
            AutoML Modeling
          </h1>
          <p className="text-muted-foreground mt-1">
            Train and compare models for your data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            className="shadow-sm"
            onClick={() => triggerTraining.mutate()}
            disabled={isTraining || triggerTraining.isPending || !targetColumn}
          >
            {isTraining ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cpu className="mr-2 h-4 w-4" />
            )}
            {isTraining ? "Training..." : "Run AutoML"}
          </Button>
        </div>
      </div>

      {/* Configuration Section */}
      {!isTraining && (
        <motion.div variants={listItemVariants}>
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Training Configuration
              </CardTitle>
              <CardDescription>
                Define the parameters for your automated machine learning run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">
                      Target Column
                    </label>
                    <select
                      className="w-full p-2.5 rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      value={targetColumn}
                      onChange={(e) => setTargetColumn(e.target.value)}
                    >
                      <option value="">Select target...</option>
                      {latestEDA?.summary_stats &&
                        Object.keys(latestEDA.summary_stats)
                          .filter(
                            (key) =>
                              ![
                                "row_count",
                                "column_count",
                                "total_missing",
                              ].includes(key)
                          )
                          .map((col) => (
                            <option key={col} value={col}>
                              {col}
                            </option>
                          ))}
                    </select>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The column you want to predict. Our system will
                      automatically detect if this is a classification or
                      regression task.
                    </p>
                  </div>
                </div>

                {latestEDA?.target_analysis?.warnings?.length > 0 && (
                  <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wider">
                        Target Warnings
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {latestEDA.target_analysis.warnings.map(
                        (w: string, i: number) => (
                          <li
                            key={i}
                            className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2"
                          >
                            <span className="mt-1 h-1 w-1 rounded-full bg-amber-400 shrink-0" />
                            {w}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {isTraining && (
        <motion.div
          variants={listItemVariants}
          className="bg-primary/5 dark:bg-primary/10 border border-primary/10 rounded-2xl p-12 text-center"
        >
          <div className="relative inline-block mb-6">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Cpu className="h-6 w-6 text-primary/50" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground">
            Training in Progress
          </h3>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            We're testing multiple algorithms, tuning hyperparameters, and
            evaluating performance. This usually takes about a minute.
          </p>
          <div className="mt-8 max-w-xs mx-auto bg-muted rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="bg-primary h-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 60, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}

      {!isTraining && models?.results?.length > 0 ? (
        <div className="space-y-10">
          {/* Leaderboard */}
          <motion.div variants={listItemVariants}>
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <CardTitle className="text-lg">Model Leaderboard</CardTitle>
                  </div>
                  <Badge variant="outline" className="bg-background">
                    {models.results.length} Models Trained
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground font-medium">
                      <tr>
                        <th className="px-6 py-4">Model Type</th>
                        <th className="px-6 py-4">Accuracy / R²</th>
                        <th className="px-6 py-4">F1 / RMSE</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {models.results.map((model: Model, i: number) => (
                        <tr
                          key={model.id}
                          className="hover:bg-muted/20 transition-colors group"
                        >
                          <td className="px-6 py-4 font-semibold text-foreground">
                            <div className="flex items-center gap-3">
                              {i === 0 && (
                                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none text-[10px] px-1.5 py-0">
                                  BEST
                                </Badge>
                              )}
                              {model.model_type_display || model.model_type}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {(
                              model.metrics?.accuracy ||
                              model.metrics?.r2 ||
                              0
                            ).toFixed(4)}
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">
                            {(
                              model.metrics?.f1_score ||
                              model.metrics?.rmse ||
                              0
                            ).toFixed(4)}
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700  border-emerald-200 font-medium"
                            >
                              Ready
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() =>
                                  navigate(`/app/modeling/${model.id}`)
                                }
                              >
                                Details
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 shadow-sm"
                                onClick={() =>
                                  navigate(
                                    `/app/predictions?modelId=${model.id}`
                                  )
                                }
                              >
                                Predict
                                <ArrowRight className="ml-2 h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Best Model Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div variants={listItemVariants} className="lg:col-span-2">
              <Card className="border-none shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    Feature Importance
                  </CardTitle>
                  <CardDescription>
                    Top factors influencing the best model's predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {featureImportanceOption ? (
                      <Chart option={featureImportanceOption} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-muted rounded-2xl">
                        <BarChart2 className="h-10 w-10 mb-3 opacity-20" />
                        <p className="text-sm text-muted-foreground">
                          No feature importance data available.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={listItemVariants}>
              <Card className="border-none shadow-sm h-full">
                <CardHeader>
                  <CardTitle className="text-lg">Model Summary</CardTitle>
                  <CardDescription>
                    Key details of the top performer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Algorithm
                      </span>
                      <span className="text-sm font-bold">
                        {models.results[0].model_type_display}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Task Type
                      </span>
                      <span className="text-sm font-bold capitalize">
                        {models.results[0].task_type}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Trained On
                      </span>
                      <span className="text-sm font-bold">
                        {new Date(
                          models.results[0].created_at
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="w-full shadow-sm"
                      asChild
                    >
                      <Link to={`/app/reports?datasetId=${datasetId}`}>
                        View Full Report
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      ) : !isTraining ? (
        <motion.div
          variants={listItemVariants}
          className="text-center py-24 bg-card rounded-2xl border-2 border-dashed border-muted"
        >
          <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Cpu className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-bold text-foreground">
            No models trained yet
          </h3>
          <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
            Select a target column and run AutoML to find the best model for
            your data.
          </p>
          <Button
            className="mt-8 shadow-md"
            onClick={() => triggerTraining.mutate()}
            disabled={triggerTraining.isPending || !targetColumn}
          >
            {triggerTraining.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cpu className="mr-2 h-4 w-4" />
            )}
            Start Training
          </Button>
        </motion.div>
      ) : null}
    </motion.div>
  );
};
