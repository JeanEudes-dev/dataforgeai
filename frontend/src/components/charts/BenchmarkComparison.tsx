import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ClockIcon,
  BoltIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
} from "@/components/ui";
import { computeBenchmarkWithActual } from "@/utils/benchmarkCalculator";
import { formatDurationLong, formatNumber } from "@/utils/formatters";
import { cn } from "@/utils";
import type { TaskType } from "@/types";

interface BenchmarkComparisonProps {
  actualDuration: number | null; // in seconds
  rowCount: number | null;
  columnCount: number | null;
  featureCount?: number;
  taskType: TaskType;
  className?: string;
}

export function BenchmarkComparison({
  actualDuration,
  rowCount,
  columnCount,
  featureCount,
  taskType,
  className,
}: BenchmarkComparisonProps) {
  const benchmark = useMemo(() => {
    if (!rowCount || !columnCount) return null;

    return computeBenchmarkWithActual(
      {
        rowCount,
        columnCount,
        taskType,
        featureCount,
      },
      actualDuration
    );
  }, [actualDuration, rowCount, columnCount, featureCount, taskType]);

  if (!benchmark || !rowCount || !columnCount) {
    return null;
  }

  const hasActualDuration = actualDuration !== null && actualDuration > 0;
  const speedGain =
    hasActualDuration && actualDuration
      ? benchmark.manualEstimate / actualDuration
      : null;
  const timeSavedPct =
    hasActualDuration && benchmark.manualEstimate
      ? Math.max(0, (benchmark.timeSaved / benchmark.manualEstimate) * 100)
      : null;

  const [collapsed, setCollapsed] = useState(false);

  // Data for main comparison chart
  const comparisonData = [
    {
      name: "DataForge AI",
      value: actualDuration || 0,
      fill: "var(--color-primary-500)",
    },
    {
      name: "Manual effort",
      value: benchmark.manualEstimate,
      fill: "var(--color-subtle)",
    },
  ];

  // Color palette for breakdown steps
  const stepColors = [
    "var(--color-primary-500)",
    "var(--color-purple-500)",
    "var(--color-pink-500)",
    "var(--color-amber-500)",
    "var(--color-teal-500)",
    "var(--color-indigo-500)",
  ];

  return (
    <Card
      className={cn(
        "overflow-hidden border border-subtle shadow-sm",
        className
      )}
    >
      <CardHeader className="border-b border-subtle bg-sunken">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-primary-500" />
            Benchmark comparison
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            className="text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed((prev) => !prev)}
          >
            {collapsed ? "Expand" : "Collapse"}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && (
        <CardContent className="space-y-8">
          {/* Hero highlight */}
          <div className="rounded-2xl overflow-hidden border border-primary-subtle bg-gradient-to-r from-primary-500 via-indigo-500 to-sky-500 text-white shadow-lg">
            <div className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="md:col-span-2 space-y-2">
                <p className="text-xs uppercase tracking-[0.08em] text-white/80">
                  Impact
                </p>
                <p className="text-3xl font-semibold leading-tight">
                  AutoML vs. manual effort
                </p>
                <p className="text-sm text-white/80">
                  Time saved by letting DataForge orchestrate feature prep and
                  model search.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-white/70">
                  Time saved
                </span>
                <p className="text-2xl font-semibold">
                  {hasActualDuration
                    ? formatDurationLong(benchmark.timeSaved)
                    : "N/A"}
                </p>
                {timeSavedPct !== null && (
                  <span className="text-xs text-white/80">
                    {formatNumber(timeSavedPct, 0)}% of manual effort
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs uppercase tracking-wide text-white/70">
                  Speedup
                </span>
                <p className="text-2xl font-semibold">
                  {speedGain ? `${formatNumber(speedGain, 1)}x faster` : "N/A"}
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <ClockIcon className="w-4 h-4 text-white/80" />
                  <span className="text-white/85">
                    {hasActualDuration
                      ? formatDurationLong(actualDuration!)
                      : "Pending"}{" "}
                    vs {formatDurationLong(benchmark.manualEstimate)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Compact stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl border border-subtle bg-surface shadow-[0_4px_12px_-6px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <ClockIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Actual time
                </span>
              </div>
              <p className="text-xl font-semibold text-foreground">
                {hasActualDuration
                  ? formatDurationLong(actualDuration!)
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-subtle bg-surface shadow-[0_4px_12px_-6px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  Manual estimate
                </span>
              </div>
              <p className="text-xl font-semibold text-foreground">
                {formatDurationLong(benchmark.manualEstimate)}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-subtle bg-surface shadow-[0_4px_12px_-6px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <ArrowTrendingDownIcon className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">
                  Time saved
                </span>
              </div>
              <p className="text-xl font-semibold text-foreground">
                {hasActualDuration
                  ? formatDurationLong(benchmark.timeSaved)
                  : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-subtle bg-surface shadow-[0_4px_12px_-6px_rgba(0,0,0,0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <BoltIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">
                  Efficiency
                </span>
              </div>
              <p className="text-xl font-semibold text-foreground">
                {hasActualDuration
                  ? `${formatNumber(benchmark.efficiencyGain, 0)}% faster`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Visual Comparison Bar */}
          {hasActualDuration && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-foreground">
                  Time comparison
                </h4>
                <span className="text-xs text-muted-foreground">
                  Lower is better
                </span>
              </div>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    layout="vertical"
                    margin={{ top: 0, right: 64, left: 110, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      width={120}
                      tick={{ fontSize: 12, fill: "var(--color-muted)" }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatDurationLong(value)}
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-subtle)",
                        borderRadius: "12px",
                        boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={30}>
                      {comparisonData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(value) => formatDurationLong(Number(value))}
                        style={{
                          fontSize: 11,
                          fill: "var(--color-foreground)",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Manual Steps Breakdown */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">
                Manual effort breakdown
              </h4>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded-full border border-subtle bg-surface">
                  {formatNumber(rowCount, 0)} rows
                </span>
                <span className="px-2 py-1 rounded-full border border-subtle bg-surface">
                  {formatNumber(columnCount, 0)} columns
                </span>
              </div>
            </div>
            <div className="space-y-2">
              {benchmark.breakdown.map((step, index) => (
                <motion.div
                  key={step.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-lg border border-subtle bg-surface shadow-[0_4px_12px_-8px_rgba(0,0,0,0.15)]"
                >
                  <div
                    className="w-2 h-8 rounded-full shrink-0"
                    style={{
                      backgroundColor: stepColors[index % stepColors.length],
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {step.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-foreground">
                      {step.estimatedMinutes} min
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~{formatNumber(step.estimatedMinutes / 60, 1)} hr
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-primary-subtle bg-primary-muted">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">
                  Total manual estimate
                </span>
              </div>
              <span className="text-lg font-bold text-primary">
                {formatDurationLong(benchmark.manualEstimate)}
              </span>
            </div>
          </div>

          {/* Calculation basis note */}
          <p className="text-xs text-muted-foreground leading-relaxed">
            Estimate based on {formatNumber(rowCount, 0)} rows,{" "}
            {formatNumber(columnCount, 0)} columns,
            {taskType === "classification"
              ? " classification"
              : " regression"}{" "}
            task. Manual estimates assume a typical data science workflow by an
            experienced practitioner.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export default BenchmarkComparison;
