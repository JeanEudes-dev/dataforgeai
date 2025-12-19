import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "../theme-provider";

interface ChartProps {
  option: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
}

export function Chart({ option, style, className, loading }: ChartProps) {
  const { theme } = useTheme();
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Merge theme-aware defaults into the option
  const themedOption = React.useMemo(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const textColor = isDark ? "#94a3b8" : "#64748b";
    const splitLineColor = isDark ? "#1e293b" : "#f1f5f9";

    return {
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: "Inter, system-ui, sans-serif",
        color: textColor,
      },
      title: {
        textStyle: { color: isDark ? "#f1f5f9" : "#0f172a" },
      },
      legend: {
        textStyle: { color: textColor },
      },
      tooltip: {
        backgroundColor: isDark ? "#0f172a" : "#ffffff",
        borderColor: isDark ? "#1e293b" : "#e2e8f0",
        textStyle: { color: isDark ? "#f1f5f9" : "#0f172a" },
        shadowBlur: 10,
        shadowColor: "rgba(0,0,0,0.1)",
        borderRadius: 8,
      },
      xAxis: {
        axisLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: textColor },
        splitLine: { lineStyle: { color: splitLineColor } },
        ...((option.xAxis as Record<string, unknown>) || {}),
      },
      yAxis: {
        axisLine: { lineStyle: { color: splitLineColor } },
        axisLabel: { color: textColor },
        splitLine: { lineStyle: { color: splitLineColor } },
        ...((option.yAxis as Record<string, unknown>) || {}),
      },
      ...option,
    };
  }, [option, theme]);

  return (
    <div
      className={className}
      style={{ height: "100%", width: "100%", ...style }}
    >
      {isReady ? (
        <ReactECharts
          option={themedOption}
          style={{ height: "100%", width: "100%" }}
          showLoading={loading}
          notMerge={true}
          lazyUpdate={true}
          opts={{ renderer: "canvas" }}
          theme={theme === "dark" ? "dark" : undefined}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/5 animate-pulse rounded-lg" />
      )}
    </div>
  );
}
