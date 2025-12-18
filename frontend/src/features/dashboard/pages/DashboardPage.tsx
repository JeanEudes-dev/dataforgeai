import React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Database,
  Cpu,
  FileText,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { containerVariants, listItemVariants } from "../../../theme/motion";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await apiClient.get("/core/dashboard/stats/");
      return response.data;
    },
  });

  const { data: recentDatasets } = useQuery({
    queryKey: ["recent-datasets"],
    queryFn: async () => {
      const response = await apiClient.get("/datasets/?limit=5");
      return response.data;
    },
  });

  const datasetList = Array.isArray(recentDatasets)
    ? recentDatasets
    : recentDatasets?.results || [];

  const statCards = [
    {
      title: "Datasets",
      value: stats?.datasets_count ?? 0,
      icon: Database,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Total uploaded datasets",
    },
    {
      title: "Models",
      value: stats?.models_count ?? 0,
      icon: Cpu,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      description: "Trained ML models",
    },
    {
      title: "Reports",
      value: stats?.reports_count ?? 0,
      icon: FileText,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description: "Generated analysis reports",
    },
    {
      title: "Predictions",
      value: "1.2k", // Placeholder or fetch from backend
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Total predictions made",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your analytics workspace.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate("/app/assistant")}>
            Ask AI Assistant
          </Button>
          <Button onClick={() => navigate("/app/datasets/upload")}>
            <Plus className="mr-2 h-4 w-4" />
            Upload Dataset
          </Button>
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
      >
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={listItemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "..." : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Datasets</CardTitle>
            <CardDescription>
              Your most recently uploaded data files.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {datasetList.length > 0 ? (
                datasetList.map(
                  (ds: {
                    id: string;
                    name: string;
                    created_at: string;
                    file_size: number;
                    status?: string;
                    row_count?: number;
                    file_type?: string;
                  }) => (
                    <div
                      key={ds.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/eda?datasetId=${ds.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/5 rounded text-primary">
                          <Database className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{ds.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(ds.file_type || "csv").toUpperCase()} •{" "}
                            {ds.row_count || 0} rows
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={
                            ds.status === "ready" ? "success" : "secondary"
                          }
                        >
                          {ds.status || "uploaded"}
                        </Badge>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  )
                )
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No datasets found. Upload one to get started.
                </div>
              )}
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/app/datasets">View all datasets</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to speed up your workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate("/app/modeling")}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-500" />
                  Train AutoML Model
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Automatically find the best model for your data.
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate("/app/reports")}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-500" />
                  Generate Report
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Create a comprehensive PDF/HTML summary.
                </span>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4"
              onClick={() => navigate("/app/assistant")}
            >
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Get AI Insights
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Ask questions about your data in natural language.
                </span>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
