import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import { Plus, FileSpreadsheet, Trash2, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { containerVariants, listItemVariants } from "../../../theme/motion";
import { Link, useNavigate } from "react-router-dom";

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
    switch (status) {
      case "ready":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Ready
          </span>
        );
      case "processing":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            Processing
          </span>
        );
      case "error":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
          <p className="text-muted-foreground">
            Upload and manage your data files
          </p>
        </div>
        <Link to="/app/datasets/upload">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Upload Dataset
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-card animate-pulse rounded-lg border border-border"
            />
          ))}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {datasetList.map(
            (dataset: {
              id: string;
              name: string;
              created_at: string;
              file_size: number;
              file_size_display?: string;
              row_count?: number;
              column_count?: number;
              status: string;
            }) => (
              <motion.div
                key={dataset.id}
                variants={listItemVariants}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all group cursor-pointer"
                onClick={() => navigate(`/app/eda?datasetId=${dataset.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{dataset.name}</h3>
                      {getStatusBadge(dataset.status)}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{dataset.file_size_display || "Unknown size"}</span>
                      <span>•</span>
                      <span>{dataset.row_count || 0} rows</span>
                      <span>•</span>
                      <span>{dataset.column_count || 0} columns</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/eda?datasetId=${dataset.id}`);
                    }}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add delete logic here if needed
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )
          )}
        </motion.div>
      )}

      {!isLoading && datasetList.length === 0 && (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <FileSpreadsheet className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No datasets yet</h3>
          <p className="text-muted-foreground">
            Upload your first CSV or XLSX file to start analyzing.
          </p>
          <Link to="/app/datasets/upload" className="mt-6 inline-block">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Upload Dataset
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
