import { useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils";
import type { MissingAnalysis } from "@/types";

interface MissingValuesChartProps {
  data: Record<string, MissingAnalysis>;
  totalRows?: number;
}

function getBarColor(ratio: number): string {
  if (ratio >= 0.5) return "bg-error-500 dark:bg-error-600";
  if (ratio >= 0.2) return "bg-warning-500 dark:bg-warning-600";
  if (ratio >= 0.05) return "bg-primary-400 dark:bg-primary-500";
  return "bg-success-500 dark:bg-success-600";
}

function getStatusText(ratio: number): { text: string; color: string } {
  if (ratio >= 0.5)
    return { text: "Critical", color: "text-error-600 dark:text-error-400" };
  if (ratio >= 0.2)
    return { text: "High", color: "text-warning-600 dark:text-warning-400" };
  if (ratio >= 0.05)
    return {
      text: "Moderate",
      color: "text-primary-600 dark:text-primary-400",
    };
  if (ratio > 0)
    return { text: "Low", color: "text-success-600 dark:text-success-400" };
  return { text: "Complete", color: "text-success-600 dark:text-success-400" };
}

export function MissingValuesChart({
  data,
  totalRows,
}: MissingValuesChartProps) {
  const sortedData = useMemo(() => {
    return Object.entries(data)
      .map(([column, analysis]) => ({
        column,
        ...analysis,
      }))
      .sort((a, b) => b.ratio - a.ratio);
  }, [data]);

  const hasAnyMissing = sortedData.some((d) => d.ratio > 0);
  const totalMissing = sortedData.reduce((sum, d) => sum + d.count, 0);
  const columnsWithMissing = sortedData.filter((d) => d.ratio > 0).length;

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No missing value data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-foreground">
            {columnsWithMissing}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Columns with missing
          </p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p className="text-2xl font-bold text-foreground">
            {totalMissing.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total missing values
          </p>
        </div>
        <div className="text-center p-3 bg-muted rounded-lg">
          <p
            className={cn(
              "text-2xl font-bold",
              hasAnyMissing ? "text-warning" : "text-success"
            )}
          >
            {hasAnyMissing ? "Incomplete" : "Complete"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Dataset status</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="space-y-3">
        {sortedData.map((item, index) => {
          const status = getStatusText(item.ratio);

          return (
            <motion.div
              key={item.column}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="group"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span
                    className="text-sm font-medium text-foreground truncate"
                    title={item.column}
                  >
                    {item.column}
                  </span>
                  <span className={cn("text-xs font-medium", status.color)}>
                    {status.text}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-right shrink-0">
                  <span className="text-xs text-muted-foreground">
                    {item.count.toLocaleString()}{" "}
                    {totalRows && `/ ${totalRows.toLocaleString()}`}
                  </span>
                  <span className="text-sm font-semibold text-foreground w-14">
                    {(item.ratio * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.max(item.ratio * 100, item.ratio > 0 ? 1 : 0)}%`,
                  }}
                  transition={{ duration: 0.5, delay: index * 0.03 }}
                  className={cn(
                    "h-full rounded-full transition-colors",
                    getBarColor(item.ratio),
                    "group-hover:brightness-110"
                  )}
                />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-4 border-t border-subtle">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-success-500" />
          <span className="text-xs text-muted-foreground">&lt;5%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary-400" />
          <span className="text-xs text-muted-foreground">5-20%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warning-500" />
          <span className="text-xs text-muted-foreground">20-50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-error-500" />
          <span className="text-xs text-muted-foreground">&gt;50%</span>
        </div>
      </div>
    </motion.div>
  );
}

export default MissingValuesChart;
