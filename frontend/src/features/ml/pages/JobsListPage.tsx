import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  CpuChipIcon,
  ArrowRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, Button, SkeletonCard } from "@/components/ui";
import { StatusBadge, EmptyState } from "@/components/shared";
import { mlApi } from "@/api";
import { formatRelativeTime, formatDuration, cn } from "@/utils";
import type { TrainingJobListItem } from "@/types";

export function JobsListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["training-jobs"],
    queryFn: () => mlApi.listJobs(),
    refetchInterval: 5000, // Poll every 5 seconds for active jobs
  });

  const jobs = data?.results || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="relative overflow-hidden border-border bg-card">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative px-8 py-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AutoML Engine
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Training Jobs
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Monitor your model training jobs. Watch as the AutoML engine
              searches for the best algorithms and hyperparameters.
            </p>
          </div>
          <Link to="/datasets">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              <CpuChipIcon className="w-5 h-5 mr-2" />
              Start New Training
            </Button>
          </Link>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive">
              Failed to load training jobs. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={<CpuChipIcon className="w-8 h-8" />}
          title="No training jobs yet"
          description="Start training models by selecting a dataset and configuring the training parameters."
          action={{
            label: "Go to Datasets",
            onClick: () => (window.location.href = "/datasets"),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {jobs.map((job: TrainingJobListItem) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <Card
                  hoverable
                  className="h-full border-border bg-card hover:bg-muted/50 transition-colors"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border border-border",
                            job.status === "completed"
                              ? "bg-green-500/10 text-green-600 dark:text-green-400"
                              : job.status === "running"
                                ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                : job.status === "error"
                                  ? "bg-red-500/10 text-red-600 dark:text-red-400"
                                  : "bg-muted text-muted-foreground"
                          )}
                        >
                          <CpuChipIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {job.dataset_name || `Job ${job.id.slice(0, 8)}`}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(job.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={job.status} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Task</span>
                        <span className="text-foreground capitalize">
                          {job.task_type}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target</span>
                        <span className="text-foreground">
                          {job.target_column}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Features</span>
                        <span className="text-foreground">
                          {job.feature_columns?.length || "-"}
                        </span>
                      </div>
                      {job.status === "completed" && job.best_model && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Best Model
                          </span>
                          <span className="text-foreground">
                            {job.best_model.display_name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Progress bar for running jobs */}
                    {job.status === "running" && (
                      <div className="mb-4">
                        <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${job.progress || 0}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {job.current_step || "Processing..."}
                        </p>
                      </div>
                    )}

                    {/* Duration for completed jobs */}
                    {job.status === "completed" && job.duration && (
                      <div className="flex items-center gap-1 text-xs text-muted mb-4">
                        <ClockIcon className="w-3.5 h-3.5" />
                        <span>{formatDuration(job.duration)}</span>
                      </div>
                    )}

                    <Link to={`/training/jobs/${job.id}`}>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="w-full"
                        rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                      >
                        View Details
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}

export default JobsListPage;
