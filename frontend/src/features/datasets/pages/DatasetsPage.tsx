import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import type { Dataset } from "../../../api/datasets";
import { Button } from "../../../components/ui/button";
import {
  Plus,
  FileSpreadsheet,
  Trash2,
  ExternalLink,
  Database,
  Clock,
  BarChart3,
  MoreVertical,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { containerVariants, listItemVariants } from "../../../theme/motion";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { format } from "date-fns";

export const DatasetsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: datasets, isLoading } = useQuery({
    queryKey: ["datasets"],
    queryFn: async () => {
      const response = await apiClient.get("/datasets/");
      return response.data;
    },
  });

  const datasetList = Array.isArray(datasets)
    ? datasets
    : datasets?.results || [];

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "ready":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200"
          >
            Ready
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
          >
            Processing
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="destructive"
            className="bg-destructive/10 text-destructive border-destructive/20"
          >
            Error
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

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
            Datasets
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your data sources for analysis.
          </p>
        </div>
        <Link to="/app/datasets/upload">
          <Button className="gap-2 shadow-sm">
            <Plus className="h-4 w-4" />
            Upload Dataset
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-card/50 animate-pulse rounded-xl border border-border"
            />
          ))}
        </div>
      ) : datasetList.length === 0 ? (
        <motion.div variants={listItemVariants}>
          <Card className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted bg-transparent">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <Database className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <CardTitle className="text-xl">No datasets yet</CardTitle>
            <CardDescription className="max-w-sm mt-2 text-base">
              Upload your first CSV or XLSX file to start your data journey.
            </CardDescription>
            <Link to="/app/datasets/upload" className="mt-8">
              <Button variant="outline" className="shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Upload First Dataset
              </Button>
            </Link>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {datasetList.map((dataset: Dataset) => (
              <motion.div key={dataset.id} variants={listItemVariants} layout>
                <Card
                  className="h-full flex flex-col border-none shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
                  onClick={() => navigate(`/app/eda?datasetId=${dataset.id}`)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileSpreadsheet className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(dataset.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            asChild
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/app/eda?datasetId=${dataset.id}`);
                              }}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" /> Analyze
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download className="mr-2 h-4 w-4" /> Download
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <CardTitle className="mt-5 text-lg font-bold line-clamp-1">
                      {dataset.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(dataset.created_at), "MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-muted/30 rounded-lg">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                          Rows
                        </p>
                        <p className="text-sm font-semibold mt-0.5">
                          {dataset.row_count?.toLocaleString() || "0"}
                        </p>
                      </div>
                      <div className="p-2.5 bg-muted/30 rounded-lg">
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                          Columns
                        </p>
                        <p className="text-sm font-semibold mt-0.5">
                          {dataset.column_count || "0"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{dataset.file_size_display || "Unknown size"}</span>
                      <div className="flex items-center gap-1 text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Analyze <ExternalLink className="h-3 w-3" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};
