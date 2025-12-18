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
import { pageVariants } from "../../../theme/motion";
import { Chart } from "../../../components/ui/chart";

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
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AutoML Modeling</h1>
          <p className="text-muted-foreground">
            Train and compare models for your data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
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
        <div className="bg-card p-6 rounded-xl border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Training Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Target Column
              </label>
              <select
                className="w-full p-2 rounded-md border border-border bg-background"
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
              <p className="text-xs text-muted-foreground">
                The column you want to predict.
              </p>
            </div>

            {latestEDA?.target_analysis?.warnings?.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800 uppercase">
                    Target Warnings
                  </span>
                </div>
                <ul className="space-y-1">
                  {latestEDA.target_analysis.warnings.map(
                    (w: string, i: number) => (
                      <li key={i} className="text-xs text-amber-700">
                        • {w}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {isTraining && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-8 text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <h3 className="text-lg font-semibold mt-4">Training in Progress</h3>
          <p className="text-muted-foreground mt-2">
            We're testing multiple algorithms and tuning hyperparameters. This
            may take a minute.
          </p>
        </div>
      )}

      {!isTraining && models?.results?.length > 0 ? (
        <div className="space-y-8">
          {/* Leaderboard */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold">Model Leaderboard</h3>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-neutral-50 text-muted-foreground font-medium">
                  <tr>
                    <th className="px-6 py-3">Model Type</th>
                    <th className="px-6 py-3">Accuracy / R²</th>
                    <th className="px-6 py-3">F1 / RMSE</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {models.results.map((model: Model, i: number) => (
                    <tr
                      key={model.id}
                      className="hover:bg-neutral-50/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium">
                        {i === 0 && (
                          <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Best
                          </span>
                        )}
                        {model.model_type_display || model.model_type}
                      </td>
                      <td className="px-6 py-4">
                        {(
                          model.metrics?.accuracy ||
                          model.metrics?.r2 ||
                          0
                        ).toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        {(
                          model.metrics?.f1_score ||
                          model.metrics?.rmse ||
                          0
                        ).toFixed(4)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Ready
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/modeling/${model.id}`)}
                        >
                          Details
                        </Button>
                        <Link to={`/app/predictions?modelId=${model.id}`}>
                          <Button variant="outline" size="sm">
                            Predict
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Best Model Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-primary" />
                Feature Importance
              </h3>
              <div className="h-[400px]">
                {featureImportanceOption ? (
                  <Chart option={featureImportanceOption} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-neutral-50 rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">
                      No feature importance data available for this model.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-card p-6 rounded-xl border border-border">
              <h3 className="font-semibold mb-6">Model Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Algorithm</span>
                  <span className="font-medium">
                    {models.results[0].model_type_display}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Task Type</span>
                  <span className="font-medium capitalize">
                    {models.results[0].task_type}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trained On</span>
                  <span className="font-medium">
                    {new Date(
                      models.results[0].created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-4 border-t border-border">
                  <Link to={`/app/reports?datasetId=${datasetId}`}>
                    <Button variant="outline" className="w-full">
                      View Full Report
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : !isTraining ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <Cpu className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No models trained</h3>
          <p className="text-muted-foreground">
            Run AutoML to find the best model for your data.
          </p>
          <Button
            className="mt-6"
            onClick={() => triggerTraining.mutate()}
            disabled={triggerTraining.isPending}
          >
            {triggerTraining.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Cpu className="mr-2 h-4 w-4" />
            )}
            Start Training
          </Button>
        </div>
      ) : null}
    </motion.div>
  );
};
