import { useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  PlayIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  CheckIcon,
  XMarkIcon,
  HashtagIcon,
  TagIcon,
  SparklesIcon,
  CpuChipIcon,
  AdjustmentsHorizontalIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Select,
  Skeleton,
  Input,
} from "@/components/ui";
import { datasetsApi, mlApi } from "@/api";
import { useToastActions } from "@/contexts";
import { cn } from "@/utils";
import type { TaskType } from "@/types";

export function TrainingPage() {
  const { datasetId } = useParams<{ datasetId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToastActions();

  const [targetColumn, setTargetColumn] = useState<string>("");
  const [taskType, setTaskType] = useState<TaskType>("classification");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dataset, isLoading: datasetLoading } = useQuery({
    queryKey: ["datasets", datasetId],
    queryFn: () => datasetsApi.get(datasetId!),
    enabled: !!datasetId,
  });

  const { data: schema } = useQuery({
    queryKey: ["datasets", datasetId, "schema"],
    queryFn: () => datasetsApi.schema(datasetId!),
    enabled: !!datasetId && dataset?.status === "ready",
  });

  const trainMutation = useMutation({
    mutationFn: mlApi.startTraining,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["training-jobs"] });
      toast.success(
        "Training started",
        "Your models are being trained in the background."
      );
      navigate(`/training/jobs/${data.id}`);
    },
    onError: () => {
      toast.error("Training failed", "Could not start the training job.");
    },
  });

  const handleFeatureToggle = (column: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(column)
        ? prev.filter((c) => c !== column)
        : [...prev, column]
    );
  };

  const handleSelectAllFeatures = () => {
    if (!schema) return;
    const allFeatures = schema.columns
      .filter((c) => c.name !== targetColumn)
      .map((c) => c.name);
    setSelectedFeatures(allFeatures);
  };

  const handleSelectNumeric = () => {
    if (!schema) return;
    const numeric = schema.columns
      .filter(
        (c) =>
          c.name !== targetColumn &&
          ["int64", "float64", "int32", "float32", "number"].includes(
            c.dtype.toLowerCase()
          )
      )
      .map((c) => c.name);
    setSelectedFeatures((prev) => [...new Set([...prev, ...numeric])]);
  };

  const handleSelectCategorical = () => {
    if (!schema) return;
    const categorical = schema.columns
      .filter(
        (c) =>
          c.name !== targetColumn &&
          ["object", "string", "category", "bool"].includes(
            c.dtype.toLowerCase()
          )
      )
      .map((c) => c.name);
    setSelectedFeatures((prev) => [...new Set([...prev, ...categorical])]);
  };

  const handleDeselectAllFeatures = () => {
    setSelectedFeatures([]);
  };

  const handleSubmit = () => {
    if (!targetColumn) {
      toast.error("Missing target", "Please select a target column.");
      return;
    }
    if (selectedFeatures.length === 0) {
      toast.error(
        "Missing features",
        "Please select at least one feature column."
      );
      return;
    }

    trainMutation.mutate({
      dataset_id: datasetId!,
      target_column: targetColumn,
      feature_columns: selectedFeatures,
      task_type: taskType,
    });
  };

  const numericColumns = useMemo(
    () =>
      schema?.columns.filter((c) =>
        ["int64", "float64", "int32", "float32", "number"].includes(
          c.dtype.toLowerCase()
        )
      ) || [],
    [schema]
  );

  const categoricalColumns = useMemo(
    () =>
      schema?.columns.filter((c) =>
        ["object", "string", "category", "bool"].includes(c.dtype.toLowerCase())
      ) || [],
    [schema]
  );

  const filteredColumns = useMemo(() => {
    if (!schema) return { numeric: [], categorical: [] };
    const query = searchQuery.toLowerCase();
    return {
      numeric: numericColumns.filter((c) =>
        c.name.toLowerCase().includes(query)
      ),
      categorical: categoricalColumns.filter((c) =>
        c.name.toLowerCase().includes(query)
      ),
    };
  }, [schema, searchQuery, numericColumns, categoricalColumns]);

  const availableColumns =
    (schema?.columns.length || 0) - (targetColumn ? 1 : 0);

  const setupSteps = [
    {
      title: "Task type",
      detail: taskType === "classification" ? "Classification" : "Regression",
      done: !!taskType,
    },
    {
      title: "Target column",
      detail: targetColumn || "Not selected",
      done: !!targetColumn,
    },
    {
      title: "Feature set",
      detail: selectedFeatures.length
        ? `${selectedFeatures.length} selected`
        : "Choose columns",
      done: selectedFeatures.length > 0,
    },
  ];

  if (datasetLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-32" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-48" />
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!dataset || dataset.status !== "ready") {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-destructive mb-4">
            Dataset not ready for training.
          </p>
          <Link to="/datasets">
            <Button variant="secondary">Back to Datasets</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 relative">
      {trainMutation.isPending && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-centertext-muted-foreground">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.08em] text-muted-foreground">
                  Training in progress
                </p>
                <p className="text-lg font-semibold text-card-foreground">
                  We’re starting your AutoML job
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              You can stay here while we queue the run. We’ll redirect to the
              job detail page as soon as it’s ready.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-muted-foreground">
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                Evaluating algorithms
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                Checking data quality
              </div>
              <div className="p-3 rounded-xl border border-border bg-muted/50">
                Provisioning resources
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Notion-inspired header */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-muted/20 via-background to-muted/20" />
        <div className="relative px-6 py-6 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Link to={`/datasets/${datasetId}`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:bg-muted"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                  Training workspace
                </p>
                <div className="flex items-center gap-2">
                  <CpuChipIcon className="w-6 h-6text-muted-foreground" />
                  <h1 className="text-2xl font-semibold text-foreground">
                    Train models
                  </h1>
                </div>
                <p className="text-sm text-muted-foreground">{dataset.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm text-muted-foreground">
              <SparklesIcon className="w-4 h-4text-muted-foreground" />
              <span>AutoML explores multiple model families for you.</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground text-sm font-semibold">
                01
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rows</p>
                <p className="text-base font-semibold text-foreground">
                  {dataset.row_count?.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground text-sm font-semibold">
                02
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Columns available
                </p>
                <p className="text-base font-semibold text-foreground">
                  {availableColumns}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-foreground text-sm font-semibold">
                03
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Progress</p>
                <p className="text-base font-semibold text-foreground">
                  {(targetColumn ? 50 : 0) +
                    (selectedFeatures.length > 0 ? 50 : 0)}
                  % ready
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {setupSteps.map((step, idx) => (
              <div
                key={step.title}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors",
                  step.done
                    ? "border-primary/50 bg-primary/10text-muted-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                <span className="text-xs font-semibold text-muted-foreground/70">
                  0{idx + 1}
                </span>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">
                    {step.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {step.detail}
                  </span>
                </div>
                {step.done && (
                  <span className="ml-auto h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <CheckIcon className="w-4 h-4" />
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Type */}
          <Card className="overflow-hidden border border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                  <AdjustmentsHorizontalIcon className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    Step 1
                  </p>
                  <CardTitle>Task type</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Tell us what you want to predict. We will adapt the pipeline
                automatically.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setTaskType("classification")}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                    taskType === "classification"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-input"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center border",
                      taskType === "classification"
                        ? "border-primary bg-cardtext-muted-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <TagIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        Classification
                      </p>
                      {taskType === "classification" && (
                        <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5 flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Predict categories or labels (e.g., churn, sentiment,
                      intent).
                    </p>
                  </div>
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setTaskType("regression")}
                  className={cn(
                    "flex items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all shadow-[0_1px_0_rgba(0,0,0,0.04)]",
                    taskType === "regression"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-input"
                  )}
                >
                  <div
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center border",
                      taskType === "regression"
                        ? "border-primary bg-cardtext-muted-foreground"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    <HashtagIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        Regression
                      </p>
                      {taskType === "regression" && (
                        <span className="rounded-full bg-primary text-primary-foreground text-[10px] px-2 py-0.5 flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" />
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Predict numeric values (e.g., revenue, score,
                      time-to-close).
                    </p>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>

          {/* Target Column */}
          <Card className="overflow-hidden border border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                    Step 2
                  </p>
                  <CardTitle>Target column</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Pick the column you want the model to predict.
              </p>
              <Select
                value={targetColumn}
                onChange={(value) => {
                  setTargetColumn(value);
                  setSelectedFeatures((prev) =>
                    prev.filter((c) => c !== value)
                  );
                }}
                options={
                  schema?.columns.map((c) => ({
                    value: c.name,
                    label: `${c.name} (${c.dtype})`,
                  })) || []
                }
                placeholder="Search or select a target column..."
              />
              <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <InformationCircleIcon className="w-4 h-4 text-muted-foreground mt-0.5" />
                <span>
                  We will keep this column out of your feature set to prevent
                  leakage.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 6h16M4 12h16M4 18h7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      Step 3
                    </p>
                    <CardTitle>Feature set</CardTitle>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground">
                  {selectedFeatures.length} / {availableColumns} selected
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Filter columns by name or type..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSelectAllFeatures}
                      className="whitespace-nowrap"
                    >
                      Select all
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleDeselectAllFeatures}
                      className="whitespace-nowrap"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectNumeric}
                    className="border border-border bg-card hover:border-primary flex items-center gap-2"
                  >
                    <HashtagIcon className="w-4 h-4 text-muted-foreground" />
                    Add numeric
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectCategorical}
                    className="border border-border bg-card hover:border-primary flex items-center gap-2"
                  >
                    <TagIcon className="w-4 h-4 text-muted-foreground" />
                    Add categorical
                  </Button>
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="rounded-xl border border-border bg-muted/50 px-4 py-3">
                    <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground mb-2">
                      Selected
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatures.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 rounded-full bg-card border border-border px-3 py-1 text-sm text-foreground shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                        >
                          {feature}
                          <button
                            onClick={() => handleFeatureToggle(feature)}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label={`Remove ${feature}`}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Column Groups */}
              <div className="space-y-6">
                {/* Numeric Columns */}
                {filteredColumns.numeric.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <HashtagIcon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Numeric columns
                        </span>
                        <span className="text-muted-foreground">
                          ({filteredColumns.numeric.length})
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredColumns.numeric.map((col, index) => {
                        const isTarget = col.name === targetColumn;
                        const isSelected = selectedFeatures.includes(col.name);
                        return (
                          <motion.button
                            key={col.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() =>
                              !isTarget && handleFeatureToggle(col.name)
                            }
                            disabled={isTarget}
                            className={cn(
                              "group relative flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                              isTarget
                                ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                                : isSelected
                                  ? "border-primary bg-primary/10 shadow-[0_8px_24px_rgba(0,122,255,0.08)]"
                                  : "border-border bg-card hover:border-input hover:shadow-sm"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background group-hover:border-muted-foreground"
                              )}
                            >
                              {isSelected && <CheckIcon className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {col.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {col.dtype}
                              </p>
                            </div>
                            {isTarget && (
                              <span className="absolute top-2 right-2 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                Target
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Categorical Columns */}
                {filteredColumns.categorical.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                        <TagIcon className="w-4 h-4" />
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          Categorical columns
                        </span>
                        <span className="text-muted-foreground">
                          ({filteredColumns.categorical.length})
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredColumns.categorical.map((col, index) => {
                        const isTarget = col.name === targetColumn;
                        const isSelected = selectedFeatures.includes(col.name);
                        return (
                          <motion.button
                            key={col.name}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            onClick={() =>
                              !isTarget && handleFeatureToggle(col.name)
                            }
                            disabled={isTarget}
                            className={cn(
                              "group relative flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-all",
                              isTarget
                                ? "border-border bg-muted/50 text-muted-foreground cursor-not-allowed"
                                : isSelected
                                  ? "border-primary bg-primary/10 shadow-[0_8px_24px_rgba(0,122,255,0.08)]"
                                  : "border-border bg-card hover:border-input hover:shadow-sm"
                            )}
                          >
                            <div
                              className={cn(
                                "mt-0.5 h-5 w-5 rounded-md flex items-center justify-center border transition-all",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-input bg-background group-hover:border-muted-foreground"
                              )}
                            >
                              {isSelected && <CheckIcon className="w-3 h-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {col.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {col.dtype}
                              </p>
                            </div>
                            {isTarget && (
                              <span className="absolute top-2 right-2 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                Target
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {filteredColumns.numeric.length === 0 &&
                  filteredColumns.categorical.length === 0 &&
                  searchQuery && (
                    <div className="text-center py-10 text-muted-foreground">
                      No columns found matching "{searchQuery}".
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Panel */}
        <div className="space-y-6">
          {/* Training Summary Card */}
          <Card className="overflow-hidden sticky top-6 border border-border shadow-sm backdrop-blur-md bg-card/80">
            <CardHeader className="bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <CardTitle>Training summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <dl className="space-y-3">
                <div className="flex justify-between items-center rounded-lg border border-border bg-card px-3 py-2">
                  <dt className="text-muted-foreground text-sm">Dataset</dt>
                  <dd className="text-muted-foreground font-medium text-sm truncate max-w-[160px] text-right">
                    {dataset.name}
                  </dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-border bg-card px-3 py-2">
                  <dt className="text-muted-foreground text-sm">Rows</dt>
                  <dd className="text-muted-foreground font-medium">
                    {dataset.row_count?.toLocaleString()}
                  </dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-border bg-card px-3 py-2">
                  <dt className="text-muted-foreground text-sm">Task type</dt>
                  <dd className="font-medium text-sm capitalize text-foreground">
                    {taskType}
                  </dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-border bg-card px-3 py-2">
                  <dt className="text-muted-foreground text-sm">Target</dt>
                  <dd
                    className={cn(
                      "font-medium text-sm truncate max-w-[160px] text-right",
                      targetColumn ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {targetColumn || "Not selected"}
                  </dd>
                </div>
                <div className="flex justify-between items-center rounded-lg border border-border bg-card px-3 py-2">
                  <dt className="text-muted-foreground text-sm">Features</dt>
                  <dd
                    className={cn(
                      "font-semibold",
                      selectedFeatures.length > 0
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {selectedFeatures.length}
                  </dd>
                </div>
              </dl>

              {/* Progress indicator */}
              <div className="pt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Setup progress</span>
                  <span>
                    {targetColumn && selectedFeatures.length > 0
                      ? "Ready to launch"
                      : "Complete all steps"}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden border border-border">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{
                      width: `${(targetColumn ? 50 : 0) + (selectedFeatures.length > 0 ? 50 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border border-primary/20 bg-primary/5 backdrop-blur-md bg-card/80">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">
                    How this run works
                  </p>
                  <p>
                    We will evaluate several model families (e.g., Random
                    Forest, XGBoost, linear baselines) and pick the
                    best-performing pipeline with sensible defaults.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Start Training Button */}
          <Button
            onClick={handleSubmit}
            isLoading={trainMutation.isPending}
            leftIcon={<PlayIcon className="w-5 h-5" />}
            className={cn(
              "w-full py-4 text-lg font-semibold transition-all border border-transparent",
              targetColumn && selectedFeatures.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl"
                : "bg-muted text-muted-foreground border-border"
            )}
            disabled={!targetColumn || selectedFeatures.length === 0}
          >
            Start training
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TrainingPage;
