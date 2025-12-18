import React from "react";
import ReactECharts from "echarts-for-react";

interface ChartProps {
  option: Record<string, unknown>;
  style?: React.CSSProperties;
  className?: string;
  loading?: boolean;
}

export function Chart({ option, style, className, loading }: ChartProps) {
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    // Small delay to ensure DOM dimensions are calculated,
    // especially during animations or layout shifts.
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={className}
      style={{ height: "100%", width: "100%", ...style }}
    >
      {isReady ? (
        <ReactECharts
          option={option}
          style={{ height: "100%", width: "100%" }}
          showLoading={loading}
          notMerge={true}
          lazyUpdate={true}
          opts={{ renderer: "canvas" }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/5 animate-pulse rounded-lg" />
      )}
    </div>
  );
}
