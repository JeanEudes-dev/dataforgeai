import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  TrophyIcon,
  ChartBarIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Skeleton,
} from "@/components/ui";
import { BenchmarkComparison } from "@/components/charts";
import { StatusBadge } from "@/components/shared";
import { mlApi } from "@/api";
import { formatDateTime, formatDuration, formatNumber, cn } from "@/utils";

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["training-jobs", jobId],
    queryFn: () => mlApi.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) =>
      query.state.data?.status === "running" ||
      query.state.data?.status === "pending"
        ? 3000
        : false,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-error-500 mb-4">Training job not found.</p>
          <Link to="/training/jobs">
            <Button variant="secondary">Back to Jobs</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
        <div className="relative px-6 py-6 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to="/training/jobs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                    Training job
                  </p>
                  <StatusBadge status={job.status} />
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  AutoML run
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {job.dataset_name ||
                    `Dataset: ${job.dataset?.id?.slice(0, 8) || "Unknown"}`}
                </p>
              </div>
            </div>
            {job.status === "completed" && job.best_model && (
              <Link to={`/models/${job.best_model.id}`}>
                <Button>
                  <TrophyIcon className="w-5 h-5 mr-2" />
                  View best model
                </Button>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-semibold">
                01
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Task</p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 capitalize">
                  {job.task_type}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-semibold">
                02
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Target
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {job.target_column}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/50 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-sm font-semibold">
                03
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Progress
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {job.progress ?? 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      {(job.status === "running" || job.status === "pending") && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="py-7">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                    Current step
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {job.current_step || "Initializing..."}
                  </p>
                </div>
                <div className="rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 px-3 py-1 text-sm font-semibold">
                  {job.progress || 0}%
                </div>
              </div>
              <div className="h-3 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden border border-gray-200 dark:border-gray-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${job.progress || 0}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                This page refreshes automatically while your models train.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Task type
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {job.task_type}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Target column
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100 truncate">
              {job.target_column}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Features
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {job.feature_columns?.length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              Duration
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {job.duration ? formatDuration(job.duration) : "In progress"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Benchmark Comparison */}
      {job.status === "completed" && (
        <BenchmarkComparison
          actualDuration={job.duration}
          rowCount={job.dataset?.row_count ?? null}
          columnCount={job.dataset?.column_count ?? null}
          featureCount={job.feature_columns?.length}
          taskType={job.task_type}
        />
      )}

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                  Started
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {formatDateTime(job.created_at)}
                </dd>
              </div>
              {job.completed_at && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                  <dt className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                    Completed
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatDateTime(job.completed_at)}
                  </dd>
                </div>
              )}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                  Dataset rows
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {job.dataset?.row_count
                    ? formatNumber(job.dataset.row_count, 0)
                    : "Unknown"}
                </dd>
              </div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
                <dt className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                  Columns
                </dt>
                <dd className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {job.dataset?.column_count
                    ? formatNumber(job.dataset.column_count, 0)
                    : "Unknown"}
                </dd>
              </div>
            </dl>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
                Feature columns
              </p>
              <div className="flex flex-wrap gap-2">
                {job.feature_columns?.map((col) => (
                  <span
                    key={col}
                    className="inline-flex items-center rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-3 py-1 text-sm text-gray-700 dark:text-gray-300 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                  >
                    {col}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {job.status === "error" && job.error_message && (
            <Card className="border border-error-200 bg-error-50/60">
              <CardHeader>
                <CardTitle className="text-error-600">Training error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-error-700">{job.error_message}</p>
              </CardContent>
            </Card>
          )}

          {job.status === "completed" && job.best_model && (
            <Card className="border border-primary-100 dark:border-primary-900/50 bg-primary-50/70 dark:bg-primary-900/20">
              <CardContent className="p-4 flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-primary-500 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    Best model
                  </p>
                  <p>{job.best_model.display_name}</p>
                  <Link to={`/models/${job.best_model.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-0 text-primary-600 dark:text-primary-400"
                    >
                      View model details
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Trained models */}
      {job.status === "completed" &&
        job.trained_models &&
        job.trained_models.length > 0 && (
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <CardTitle>Trained models</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                        Algorithm
                      </th>
                      {job.task_type === "classification" ? (
                        <>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            Accuracy
                          </th>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            Precision
                          </th>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            Recall
                          </th>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            F1 score
                          </th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            MAE
                          </th>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            RMSE
                          </th>
                          <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold">
                            R^2
                          </th>
                        </>
                      )}
                      <th className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-semibold"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.trained_models.map((model) => (
                      <tr
                        key={model.id}
                        className={cn(
                          "border-b border-gray-200 dark:border-gray-800 last:border-0",
                          model.is_best &&
                            "bg-primary-50 dark:bg-primary-900/20"
                        )}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">
                              {model.display_name}
                            </span>
                            {model.is_best && (
                              <span className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                                <TrophyIcon className="w-3.5 h-3.5" />
                                Best
                              </span>
                            )}
                          </div>
                        </td>
                        {job.task_type === "classification" ? (
                          <>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.accuracy, 4)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.precision, 4)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.recall, 4)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.f1_score, 4)}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.mae, 4)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.rmse, 4)}
                            </td>
                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                              {formatNumber(model.metrics?.r2_score, 4)}
                            </td>
                          </>
                        )}
                        <td className="px-4 py-3">
                          <Link to={`/models/${model.id}`}>
                            <Button variant="ghost" size="sm">
                              <ChartBarIcon className="w-4 h-4" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

export default JobDetailPage;
