import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Share2,
  BrainCircuit,
  Calendar,
  Database,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

import { reportsApi } from "../../../api/reports";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Separator } from "../../../components/ui/separator";
import { ScrollArea } from "../../../components/ui/scroll-area";
import { Chart } from "../../../components/ui/chart";
import { useTheme } from "../../../components/theme-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => reportsApi.get(reportId!),
    enabled: !!reportId,
  });

  const features = report?.content?.eda?.distributions
    ? Object.keys(report.content.eda.distributions)
    : [];
  const activeFeature =
    selectedFeature || (features.length > 0 ? features[0] : null);

  const heatmapOption = useMemo(() => {
    const correlationMatrix = report?.content?.eda?.correlation_matrix || {};
    const columns = Object.keys(correlationMatrix);
    const heatmapData = [];
    for (let i = 0; i < columns.length; i++) {
      for (let j = 0; j < columns.length; j++) {
        heatmapData.push([
          i,
          j,
          correlationMatrix[columns[i]][columns[j]] || 0,
        ]);
      }
    }

    return {
      tooltip: { position: "top" },
      grid: { height: "70%", top: "10%", containLabel: true },
      xAxis: { type: "category", data: columns, splitArea: { show: true } },
      yAxis: { type: "category", data: columns, splitArea: { show: true } },
      visualMap: {
        min: -1,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: "0%",
        inRange: {
          color:
            theme === "dark"
              ? ["#f87171", "#1e293b", "#60a5fa"]
              : ["#ef4444", "#f8fafc", "#3b82f6"],
        },
      },
      series: [
        {
          name: "Correlation",
          type: "heatmap",
          data: heatmapData,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: "rgba(0, 0, 0, 0.5)" },
          },
        },
      ],
    };
  }, [report?.content?.eda?.correlation_matrix, theme]);

  const missingOption = useMemo(() => {
    const missingAnalysis = report?.content?.eda?.missing_analysis || {};
    const missingCols = Object.keys(missingAnalysis);
    const missingRatios = missingCols.map((col) =>
      ((missingAnalysis[col].ratio || 0) * 100).toFixed(2)
    );

    return {
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
      xAxis: { type: "value", max: 100, axisLabel: { formatter: "{value}%" } },
      yAxis: { type: "category", data: missingCols },
      series: [
        {
          name: "Missing Ratio",
          type: "bar",
          data: missingRatios,
          itemStyle: { color: "#f59e0b" },
        },
      ],
    };
  }, [report?.content?.eda?.missing_analysis]);

  const distributionOption = useMemo(() => {
    if (
      !activeFeature ||
      !report?.content?.eda?.distributions?.[activeFeature]
    )
      return null;

    const dist = report.content.eda.distributions[activeFeature];
    const isNumeric = dist.type === "numeric";

    if (isNumeric) {
      return {
        tooltip: {
          trigger: "axis",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (params: any) => {
            const p = params[0];
            const binStart = dist.bins[p.dataIndex];
            const binEnd = dist.bins[p.dataIndex + 1];
            return `${activeFeature}<br/>Range: ${binStart.toFixed(
              2
            )} - ${binEnd.toFixed(2)}<br/>Count: ${p.value}`;
          },
        },
        grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
        xAxis: {
          type: "category",
          data: dist.bins.slice(0, -1).map((b: number) => b.toFixed(2)),
          name: "Value",
          nameLocation: "middle",
          nameGap: 35,
        },
        yAxis: { type: "value", name: "Frequency" },
        series: [
          {
            name: activeFeature,
            type: "bar",
            data: dist.counts,
            barWidth: "95%",
            itemStyle: {
              color: "#3b82f6",
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };
    } else {
      return {
        tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
        grid: { left: "3%", right: "4%", bottom: "15%", containLabel: true },
        xAxis: {
          type: "category",
          data: dist.labels,
          axisLabel: { rotate: 45, interval: 0 },
        },
        yAxis: { type: "value" },
        series: [
          {
            name: activeFeature,
            type: "bar",
            data: dist.counts,
            itemStyle: {
              color: "#10b981",
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      };
    }
  }, [activeFeature, report?.content?.eda?.distributions]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-semibold">Failed to load report</h2>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "processing":
      case "generating":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "failed":
      case "error":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const datasetName =
    typeof report.dataset === "object"
      ? report.dataset.name
      : "Unknown Dataset";
  const datasetRows =
    typeof report.dataset === "object" ? report.dataset.row_count : 0;
  const datasetCols =
    typeof report.dataset === "object" ? report.dataset.column_count : 0;

  return (
    <div className="container mx-auto space-y-8 p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 h-8 w-8"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              {report.title}
            </h1>
            <Badge className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(report.created_at), "PPP p")}</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="h-3 w-3" />
              <span>{datasetName}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* AI Summary */}
      {report.ai_summary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">AI Executive Summary</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-foreground/90">
              {report.ai_summary}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {(report.report_type === "eda" || report.report_type === "full") && (
            <TabsTrigger value="eda">EDA Insights</TabsTrigger>
          )}
          {(report.report_type === "model" ||
            report.report_type === "full") && (
            <TabsTrigger value="model">Model Performance</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Dataset Size
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {datasetRows.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Rows across {datasetCols} columns
                </p>
              </CardContent>
            </Card>
            {report.trained_model && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Best Model
                  </CardTitle>
                  <BrainCircuit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold truncate">
                    {report.trained_model.display_name}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {report.trained_model.primary_metric}:{" "}
                    {report.trained_model.metrics[
                      report.trained_model.primary_metric
                    ]?.toFixed(4)}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="eda" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Feature Distributions</CardTitle>
                <CardDescription>
                  Analyze the distribution of individual features.
                </CardDescription>
                <div className="mt-4 w-[200px]">
                  <Label>Select Feature</Label>
                  <Select
                    value={activeFeature || ""}
                    onValueChange={setSelectedFeature}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feature" />
                    </SelectTrigger>
                    <SelectContent>
                      {report?.content?.eda?.distributions &&
                        Object.keys(report.content.eda.distributions).map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {distributionOption ? (
                  <Chart
                    option={distributionOption}
                    style={{ height: "400px", width: "100%" }}
                  />
                ) : (
                  <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                    Select a feature to view its distribution
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Correlation Matrix</CardTitle>
                <CardDescription>
                  Heatmap showing relationships between numerical features.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  option={heatmapOption}
                  style={{ height: "400px", width: "100%" }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Missing Values</CardTitle>
                <CardDescription>
                  Percentage of missing data per column.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  option={missingOption}
                  style={{ height: "400px", width: "100%" }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance</CardTitle>
              <CardDescription>
                Detailed metrics and feature importance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {report.trained_model && (
                <>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">Metrics</h3>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {Object.entries(report.trained_model.metrics).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="rounded-lg border p-3 text-center"
                          >
                            <div className="text-sm font-medium text-muted-foreground uppercase">
                              {key}
                            </div>
                            <div className="text-xl font-bold">
                              {typeof value === "number"
                                ? value.toFixed(4)
                                : value}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="mb-2 text-lg font-semibold">
                      Feature Importance
                    </h3>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {Object.entries(report.trained_model.feature_importance)
                          .sort(([, a], [, b]) => b - a)
                          .map(([feature, importance]) => (
                            <div
                              key={feature}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{feature}</span>
                              <div className="flex items-center gap-2">
                                <div className="h-2 w-32 overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className="h-full bg-primary"
                                    style={{
                                      width: `${importance * 100}%`,
                                    }}
                                  />
                                </div>
                                <span className="w-12 text-right text-xs text-muted-foreground">
                                  {(importance * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    </ScrollArea>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
