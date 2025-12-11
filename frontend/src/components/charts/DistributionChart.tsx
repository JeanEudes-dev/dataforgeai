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
import type { DistributionData } from "@/types";

interface DistributionChartProps {
  data: DistributionData;
  columnName: string;
  color?: string;
  height?: number;
}

export function DistributionChart({
  data,
  columnName,
  color,
  height = 200,
}: DistributionChartProps) {
  const chartData = useMemo(() => {
    if (!data?.bins || !data?.counts) return [];
    return data.bins.map((bin, index) => ({
      name: bin.length > 12 ? `${bin.slice(0, 12)}...` : bin,
      fullName: bin,
      value: data.counts[index] || 0,
    }));
  }, [data]);

  if (!data || chartData.length === 0) {
    return (
      <div className="w-full rounded-xl border border-subtle bg-surface p-4 text-sm text-muted-foreground">
        No distribution data available for {columnName}.
      </div>
    );
  }

  const maxValue = Math.max(...data.counts, 0);
  const barColor =
    color ||
    (data.type === 'numeric'
      ? 'var(--color-primary-500)'
      : 'var(--color-success-500)');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-3">
        <h4
          className="text-sm font-medium text-foreground truncate"
          title={columnName}
        >
          {columnName}
        </h4>
        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {data.type}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <defs>
            <linearGradient
              id={`gradient-${columnName}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor={barColor} stopOpacity={0.9} />
              <stop offset="100%" stopColor={barColor} stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-subtle)"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--color-subtle)" }}
            interval={0}
            angle={-45}
            textAnchor="end"
            height={50}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--color-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const item = payload[0].payload;
              return (
                <div className="bg-surface rounded-lg shadow-lg border border-subtle px-3 py-2">
                  <p className="text-xs text-muted-foreground">{item.fullName}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {item.value.toLocaleString()} records
                  </p>
                </div>
              );
            }}
          />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
            {chartData.map((_, index) => (
              <Cell
                key={index}
                fill={`url(#gradient-${columnName})`}
                opacity={0.7 + (chartData[index].value / maxValue) * 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export default DistributionChart;
