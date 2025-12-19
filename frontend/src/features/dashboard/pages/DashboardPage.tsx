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
import type { Dataset } from "../../../api/datasets";
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
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      description: "Total uploaded datasets",
    },
    {
      title: "Models",
      value: stats?.models_count ?? 0,
      icon: Cpu,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      description: "Trained ML models",
    },
    {
      title: "Reports",
      value: stats?.reports_count ?? 0,
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      description: "Generated analysis reports",
    },
    {
      title: "Predictions",
      value: "1.2k",
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      description: "Total predictions made",
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your analytics workspace.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="shadow-sm"
            onClick={() => navigate("/app/assistant")}
          >
            Ask AI Assistant
          </Button>
          <Button
            className="shadow-sm"
            onClick={() => navigate("/app/datasets/upload")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Upload Dataset
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={listItemVariants}>
            <Card className="border-none shadow-sm bg-card hover:shadow-md transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
        {/* Recent Datasets */}
        <Card className="lg:col-span-4 border-none shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between bg-muted/30 px-6 py-4">
            <div>
              <CardTitle className="text-lg">Recent Datasets</CardTitle>
              <CardDescription>
                Your most recently uploaded data
              </CardDescription>
            </div>
            <Link to="/app/datasets">
              <Button variant="ghost" size="sm" className="text-primary">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {datasetList.length > 0 ? (
                datasetList.map((ds: Dataset) => (
                  <div
                    key={ds.id}
                    className="flex items-center justify-between p-4 px-6 hover:bg-muted/20 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/eda?datasetId=${ds.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{ds.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {ds.row_count?.toLocaleString() || 0} rows
                          </span>
                          <span className="text-muted-foreground text-[10px]">
                            •
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(ds.file_type || "csv").toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className="font-normal text-[10px] uppercase tracking-wider"
                      >
                        {ds.status || "ready"}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Database className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">
                    No datasets found. Start by uploading one.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to speed up your workflow.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4 border-muted hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={() => navigate("/app/modeling")}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-sm">
                    Train AutoML Model
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Automatically find the best model for your data.
                  </span>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4 border-muted hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={() => navigate("/app/reports")}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-sm">Generate Report</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Create a comprehensive PDF/HTML summary.
                  </span>
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="justify-start h-auto py-4 px-4 border-muted hover:border-primary/50 hover:bg-primary/5 transition-all group"
              onClick={() => navigate("/app/assistant")}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="font-semibold text-sm">Get AI Insights</span>
                  <span className="text-xs text-muted-foreground mt-0.5">
                    Ask questions about your data in natural language.
                  </span>
                </div>
              </div>
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};
