import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Plus,
  Download,
  Share2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

import { reportsApi, type Report } from "../../../api/reports";
import { datasetsApi } from "../../../api/datasets";
import { mlApi } from "../../../api/ml";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useToast } from "../../../hooks/use-toast";
import { containerVariants, listItemVariants } from "../../../theme/motion";

export default function ReportsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [datasetId, setDatasetId] = useState("");
  const [modelId, setModelId] = useState("none");
  const [reportType, setReportType] = useState("full");

  // Fetch datasets for the project
  const { data: datasets } = useQuery({
    queryKey: ["datasets", projectId],
    queryFn: () => datasetsApi.list(projectId!),
    enabled: !!projectId,
  });

  // Fetch models for the selected dataset
  const { data: models } = useQuery({
    queryKey: ["models", datasetId],
    queryFn: () => mlApi.list(datasetId),
    enabled: !!datasetId && datasetId !== "",
  });

  // Fetch reports
  const { data: reports, isLoading } = useQuery({
    queryKey: ["reports", projectId],
    queryFn: () => reportsApi.list(), // Backend might need filtering by project, but for now list all
  });

  const generateMutation = useMutation({
    mutationFn: reportsApi.generate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setIsGenerateOpen(false);
      toast({
        title: "Report generation started",
        description: "Your report is being prepared and will be ready shortly.",
      });
      // Reset form
      setTitle("");
      setDatasetId("");
      setModelId("none");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Failed to generate report",
        description:
          err.response?.data?.detail || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({
        title: "Report deleted",
        description: "The report has been successfully removed.",
      });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !datasetId) return;

    generateMutation.mutate({
      title,
      dataset_id: datasetId,
      model_id: modelId === "none" ? undefined : modelId,
      report_type: reportType,
    });
  };

  const getStatusBadge = (status: Report["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30"
          >
            <CheckCircle2 className="h-3 w-3" /> Ready
          </Badge>
        );
      case "processing":
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30 animate-pulse"
          >
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-muted/50 text-muted-foreground border-border"
          >
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge
            variant="outline"
            className="gap-1 bg-destructive/10 text-destructive border-destructive/20"
          >
            <AlertCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
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
            Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate and manage comprehensive analysis reports.
          </p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-sm">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl">Generate New Report</DialogTitle>
              <DialogDescription>
                Create a detailed report including EDA insights and model
                performance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">
                  Report Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Q3 Sales Analysis"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  className="rounded-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataset" className="text-sm font-semibold">
                  Dataset
                </Label>
                <Select value={datasetId} onValueChange={setDatasetId} required>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets?.map((ds: { id: string; name: string }) => (
                      <SelectItem key={ds.id} value={ds.id}>
                        {ds.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-semibold">
                  Model (Optional)
                </Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No model (EDA only)</SelectItem>
                    {models?.results?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.display_name} (
                        {typeof m.metrics?.[m.primary_metric] === "number"
                          ? m.metrics[m.primary_metric].toFixed(4)
                          : "N/A"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-semibold">
                  Report Type
                </Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">
                      Full Report (EDA + Model)
                    </SelectItem>
                    <SelectItem value="eda">EDA Only</SelectItem>
                    <SelectItem value="model">
                      Model Performance Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  className="w-full sm:w-auto px-8"
                  disabled={generateMutation.isPending || !title || !datasetId}
                >
                  {generateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate Report
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
        </div>
      ) : reports?.results?.length === 0 ? (
        <motion.div variants={listItemVariants}>
          <Card className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-muted bg-transparent">
            <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <CardTitle className="text-xl">No reports yet</CardTitle>
            <CardDescription className="max-w-sm mt-2 text-base">
              You haven't generated any reports for this project. Click the
              button above to create your first one.
            </CardDescription>
            <Button
              variant="outline"
              className="mt-8 shadow-sm"
              onClick={() => setIsGenerateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create First Report
            </Button>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {reports?.results?.map((report) => (
              <motion.div key={report.id} variants={listItemVariants} layout>
                <Card className="h-full flex flex-col border-none shadow-sm hover:shadow-md transition-all duration-200 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-xl text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                    <CardTitle className="mt-5 text-lg font-bold line-clamp-1">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2.5 bg-muted/30 rounded-lg text-sm">
                        <span className="text-muted-foreground font-medium">
                          Type
                        </span>
                        <Badge
                          variant="secondary"
                          className="capitalize font-semibold text-[10px]"
                        >
                          {report.report_type}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-5 pt-0 flex gap-2">
                    {report.status === "completed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 shadow-sm border-muted hover:border-primary/50 hover:bg-primary/5 transition-all"
                          asChild
                        >
                          <a
                            href={report.file}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3.5 w-3.5" /> Download
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-3 shadow-sm border-muted hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => deleteMutation.mutate(report.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
