import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  MetricTooltip,
  METRIC_DESCRIPTIONS,
} from "@/components/ui";
import {
  StatCard,
  ConfusionMatrixChart,
  ROCCurveChart,
  FeatureImportanceChart,
  CrossValidationChart,
} from "@/components/charts";
import { formatNumber } from "@/utils";
import type { EnhancedReport } from "@/types";

interface ModelPerformanceSectionProps {
  report: EnhancedReport;
}

export function ModelPerformanceSection({
  report,
}: ModelPerformanceSectionProps) {
  const model = report.content?.model;

  if (!model) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No model data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isClassification = model.task_type === "classification";
  const metrics = model.metrics || {};

  // Get relevant metrics based on task type
  const displayMetrics = isClassification
    ? [
        { key: "accuracy", label: "Accuracy", format: "percent" },
        { key: "precision", label: "Precision", format: "percent" },
        { key: "recall", label: "Recall", format: "percent" },
        { key: "f1", label: "F1 Score", format: "percent" },
        { key: "roc_auc", label: "ROC AUC", format: "percent" },
      ]
    : [
        { key: "r2", label: "R2 Score", format: "percent" },
        { key: "rmse", label: "RMSE", format: "number" },
        { key: "mae", label: "MAE", format: "number" },
        { key: "mape", label: "MAPE", format: "percent" },
      ];

  const formatMetricValue = (value: number | undefined, format: string) => {
    if (value === undefined || value === null) return "N/A";
    if (format === "percent") return `${(value * 100).toFixed(2)}%`;
    return formatNumber(value, 4);
  };

  // Extract ROC curve data
  const rocData = metrics.roc_curve || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Model Info */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Model overview</CardTitle>
            {model.is_best && (
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                Best model
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <InfoTile
              label="Algorithm"
              value={model.algorithm_type?.replace(/_/g, " ")}
            />
            <InfoTile label="Task" value={model.task_type} />
            <InfoTile
              label="Primary metric"
              value={
                model.primary_metric !== undefined
                  ? `${(model.primary_metric * 100).toFixed(2)}%`
                  : "N/A"
              }
              highlight
            />
            <InfoTile
              label="Model size"
              value={model.model_size_display || "N/A"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {displayMetrics.map(({ key, label, format }) => {
          const value = metrics[key as keyof typeof metrics] as
            | number
            | undefined;
          if (value === undefined) return null;

          const metricInfo = METRIC_DESCRIPTIONS[key];
          const statCard = (
            <StatCard
              key={key}
              title={label}
              value={formatMetricValue(value, format)}
              color={
                key === "accuracy" || key === "f1" || key === "r2"
                  ? "primary"
                  : key === "precision"
                    ? "success"
                    : key === "recall"
                      ? "info"
                      : "default"
              }
            />
          );

          // Wrap with tooltip if description available
          if (metricInfo) {
            return (
              <MetricTooltip
                key={key}
                title={metricInfo.title}
                description={metricInfo.description}
                position="top"
              >
                {statCard}
              </MetricTooltip>
            );
          }

          return statCard;
        })}
      </div>

      {/* Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix (Classification only) */}
        {isClassification && metrics.confusion_matrix && (
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <CardTitle className="text-base">Confusion matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfusionMatrixChart
                matrix={metrics.confusion_matrix}
                labels={metrics.confusion_matrix_labels}
                height={350}
              />
            </CardContent>
          </Card>
        )}

        {/* ROC Curve (Classification only) */}
        {isClassification && rocData && (
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <CardTitle className="text-base">ROC curve</CardTitle>
            </CardHeader>
            <CardContent>
              <ROCCurveChart
                data={rocData}
                auc={metrics.roc_auc}
                height={300}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feature Importance */}
      {model.feature_importance && model.feature_importance.length > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="text-base">Feature importance</CardTitle>
          </CardHeader>
          <CardContent>
            <FeatureImportanceChart
              data={model.feature_importance}
              maxFeatures={15}
              height={Math.min(400, model.feature_importance.length * 30 + 80)}
            />
          </CardContent>
        </Card>
      )}

      {/* Cross-Validation Scores */}
      {model.cross_val_scores &&
        model.cross_val_scores.length > 0 &&
        (() => {
          const cvMean =
            model.cross_val_scores.reduce((a, b) => a + b, 0) /
            model.cross_val_scores.length;
          const cvStd = Math.sqrt(
            model.cross_val_scores
              .map((x) => Math.pow(x - cvMean, 2))
              .reduce((a, b) => a + b, 0) / model.cross_val_scores.length
          );
          return (
            <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
              <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Cross-validation scores
                  </CardTitle>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isClassification
                      ? "F1 score across folds"
                      : "R2 score across folds"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span className="px-2 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300">
                    Mean: {formatNumber(cvMean, 3)}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    Std: {formatNumber(cvStd, 3)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CrossValidationChart
                  scores={model.cross_val_scores}
                  metricName={isClassification ? "F1 Score" : "R2 Score"}
                  height={260}
                />
              </CardContent>
            </Card>
          );
        })()}

      {/* Hyperparameters */}
      {model.hyperparameters &&
        Object.keys(model.hyperparameters).length > 0 && (
          <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <CardTitle className="text-base">Hyperparameters</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(model.hyperparameters).map(([key, value]) => (
                  <div
                    key={key}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  >
                    <div
                      className="text-xs text-gray-500 dark:text-gray-400 truncate"
                      title={key}
                    >
                      {key.replace(/_/g, " ")}
                    </div>
                    <div
                      className="text-sm font-mono text-gray-900 dark:text-gray-100 truncate"
                      title={String(value)}
                    >
                      {String(value)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
    </motion.div>
  );
}

function InfoTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number | undefined;
  highlight?: boolean;
}) {
  return (
    <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.12)]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p
        className={
          highlight
            ? "text-sm font-semibold text-primary-700 dark:text-primary-400"
            : "text-sm font-semibold text-gray-900 dark:text-gray-100"
        }
      >
        {value ?? "N/A"}
      </p>
    </div>
  );
}

export default ModelPerformanceSection;
