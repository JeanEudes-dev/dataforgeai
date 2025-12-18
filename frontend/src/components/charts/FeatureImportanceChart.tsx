import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

interface FeatureImportanceItem {
  name: string;
  importance: number;
}

interface FeatureImportanceChartProps {
  data: FeatureImportanceItem[] | Record<string, number>;
  maxFeatures?: number;
  height?: number;
  showPercentage?: boolean;
}

export function FeatureImportanceChart({
  data,
  maxFeatures = 15,
  height = 400,
  showPercentage = true,
}: FeatureImportanceChartProps) {
  const chartData = useMemo(() => {
    let features: FeatureImportanceItem[];

    if (Array.isArray(data)) {
      features = data;
    } else if (data && typeof data === "object") {
      features = Object.entries(data).map(([name, importance]) => ({
        name,
        importance: importance as number,
      }));
    } else {
      return [];
    }

    // Sort by importance descending and limit
    return features
      .sort((a, b) => b.importance - a.importance)
      .slice(0, maxFeatures)
      .map((item) => ({
        ...item,
        displayName:
          item.name.length > 25 ? `${item.name.slice(0, 25)}...` : item.name,
        percentage: item.importance * 100,
      }));
  }, [data, maxFeatures]);

  if (!data || chartData.length === 0) {
    return (
      <div className="w-full rounded-xl border border-subtle bg-surface p-4 text-sm text-muted-foreground">
        No feature importance data available.
      </div>
    );
  }

  const maxImportance = Math.max(...chartData.map((d) => d.importance));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <defs>
            <linearGradient
              id="featureImportanceGradient"
              x1="0"
              y1="0"
              x2="1"
              y2="0"
            >
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.8}
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity={0.9}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="hsl(var(--border))"
            horizontal={true}
            vertical={false}
          />
          <XAxis
            type="number"
            domain={[0, showPercentage ? 100 : "auto"]}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
            tickFormatter={(value) =>
              showPercentage ? `${value.toFixed(0)}%` : value.toFixed(2)
            }
          />
          <YAxis
            type="category"
            dataKey="displayName"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={150}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-popover rounded-lg shadow-lg border border-border px-3 py-2">
                  <p className="text-sm font-medium text-foreground">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Importance: {(item.importance * 100).toFixed(2)}%
                  </p>
                </div>
              );
            }}
          />
          <Bar
            dataKey={showPercentage ? "percentage" : "importance"}
            radius={[0, 4, 4, 0]}
            maxBarSize={30}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill="hsl(var(--primary))"
                fillOpacity={0.6 + (entry.importance / maxImportance) * 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Summary stats */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Top feature:</span>
          <span className="font-medium text-foreground">
            {chartData[0]?.name} ({(chartData[0]?.importance * 100).toFixed(1)}
            %)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span>Features shown:</span>
          <span className="font-medium text-foreground">
            {chartData.length}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default FeatureImportanceChart;
