import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Tooltip,
  METRIC_DESCRIPTIONS,
} from "@/components/ui";
import { ModelComparisonChart, MetricsRadarChart } from "@/components/charts";
import type { EnhancedReport } from "@/types";

interface ModelComparisonSectionProps {
  report: EnhancedReport;
}

type SortKey =
  | "name"
  | "algorithm_type"
  | "primary_metric"
  | "accuracy"
  | "f1"
  | "r2"
  | "rmse";
type SortDirection = "asc" | "desc";

export function ModelComparisonSection({
  report,
}: ModelComparisonSectionProps) {
  const models = useMemo(
    () => report.model_comparison || [],
    [report.model_comparison]
  );
  const [sortKey, setSortKey] = useState<SortKey>("primary_metric");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [selectedMetric, setSelectedMetric] = useState<string>("");

  const taskType = models[0]?.task_type || "classification";
  const isClassification = taskType === "classification";

  // Available metrics for sorting
  const metricOptions = useMemo(() => {
    if (isClassification) {
      return [
        { key: "accuracy", label: "Accuracy" },
        { key: "precision", label: "Precision" },
        { key: "recall", label: "Recall" },
        { key: "f1", label: "F1 Score" },
        { key: "roc_auc", label: "ROC AUC" },
      ];
    } else {
      return [
        { key: "r2", label: "R2 Score" },
        { key: "rmse", label: "RMSE" },
        { key: "mae", label: "MAE" },
      ];
    }
  }, [isClassification]);

  // Sort models
  const sortedModels = useMemo(() => {
    return [...models].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;

      if (sortKey === "name") {
        aVal = a.display_name;
        bVal = b.display_name;
      } else if (sortKey === "algorithm_type") {
        aVal = a.algorithm_type;
        bVal = b.algorithm_type;
      } else if (sortKey === "primary_metric") {
        aVal = a.primary_metric || 0;
        bVal = b.primary_metric || 0;
      } else {
        aVal = (a.metrics?.[sortKey as keyof typeof a.metrics] as number) || 0;
        bVal = (b.metrics?.[sortKey as keyof typeof b.metrics] as number) || 0;
      }

      // For error metrics like RMSE, lower is better
      const errorMetrics = ["rmse", "mae", "mse", "mape"];
      const invertSort = errorMetrics.includes(sortKey);

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      const comparison = (aVal as number) - (bVal as number);
      if (invertSort) {
        return sortDirection === "asc" ? -comparison : comparison;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [models, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  };

  if (models.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Model comparison requires at least 2 trained models.
          </p>
        </CardContent>
      </Card>
    );
  }

  const renderSortIcon = (column: SortKey) => {
    if (sortKey !== column) return null;
    return sortDirection === "asc" ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  const formatMetric = (value: number | undefined, isError = false) => {
    if (value === undefined || value === null) return "-";
    if (isError) return value.toFixed(4);
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Comparison Table */}
      <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
        <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Model Comparison</CardTitle>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {models.length} models
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th
                    onClick={() => handleSort("name")}
                    className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Model
                      {renderSortIcon("name")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("algorithm_type")}
                    className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      Algorithm
                      {renderSortIcon("algorithm_type")}
                    </div>
                  </th>
                  {metricOptions.map(({ key, label }) => {
                    const metricInfo = METRIC_DESCRIPTIONS[key];
                    const headerContent = (
                      <th
                        key={key}
                        onClick={() => handleSort(key as SortKey)}
                        className="px-4 py-3 text-left text-gray-500 dark:text-gray-400 font-medium cursor-pointer hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {renderSortIcon(key as SortKey)}
                        </div>
                      </th>
                    );

                    if (metricInfo) {
                      return (
                        <Tooltip
                          key={key}
                          content={
                            <div className="min-w-[150px]">
                              <div className="font-semibold mb-1">
                                {metricInfo.title}
                              </div>
                              <div className="text-gray-300 text-[11px]">
                                {metricInfo.description}
                              </div>
                            </div>
                          }
                          position="top"
                        >
                          {headerContent}
                        </Tooltip>
                      );
                    }
                    return headerContent;
                  })}
                  <th className="px-4 py-3 text-center text-gray-500 dark:text-gray-400 font-medium">
                    Best
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedModels.map((model, index) => (
                  <motion.tr
                    key={model.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`
                      border-b border-gray-100 dark:border-gray-800
                      ${model.is_best ? "bg-green-50 dark:bg-green-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                    `}
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                      {model.display_name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 capitalize">
                      {model.algorithm_type?.replace(/_/g, " ")}
                    </td>
                    {metricOptions.map(({ key }) => {
                      const value = model.metrics?.[
                        key as keyof typeof model.metrics
                      ] as number | undefined;
                      const isError = ["rmse", "mae", "mse", "mape"].includes(
                        key
                      );
                      return (
                        <td
                          key={key}
                          className="px-4 py-3 text-gray-600 dark:text-gray-400"
                        >
                          {formatMetric(value, isError)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center">
                      {model.is_best && (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500 text-white text-xs">
                          ✓
                        </span>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Visual Comparisons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Comparison */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Performance Comparison
              </CardTitle>
              <select
                value={selectedMetric || (isClassification ? "f1" : "r2")}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="text-sm px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                {metricOptions.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <ModelComparisonChart
              models={models}
              metric={selectedMetric || (isClassification ? "f1" : "r2")}
              height={Math.min(300, models.length * 50 + 100)}
            />
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
          <CardHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
            <CardTitle className="text-base">Multi-Metric Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <MetricsRadarChart models={models} maxModels={4} height={350} />
          </CardContent>
        </Card>
      </div>

      {/* Best Model Summary */}
      {sortedModels.find((m) => m.is_best) && (
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">
                  ✓
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-green-800 dark:text-green-200">
                  Best Model:{" "}
                  {sortedModels.find((m) => m.is_best)?.display_name}
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Selected based on {isClassification ? "F1 Score" : "R2 Score"}{" "}
                  performance with cross-validation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

export default ModelComparisonSection;
