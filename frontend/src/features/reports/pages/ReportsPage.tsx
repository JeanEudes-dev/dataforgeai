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
          <Badge variant="success" className="gap-1">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Generate and manage comprehensive analysis reports.
          </p>
        </div>
        <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Generate Report
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate New Report</DialogTitle>
              <DialogDescription>
                Create a detailed report including EDA insights and model
                performance.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Report Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Q3 Sales Analysis"
                  value={title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTitle(e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataset">Dataset</Label>
                <Select value={datasetId} onValueChange={setDatasetId} required>
                  <SelectTrigger>
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
                <Label htmlFor="model">Model (Optional)</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No model (EDA only)</SelectItem>
                    {models?.results?.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.algorithm} (
                        {typeof m.metric_value === "number"
                          ? m.metric_value.toFixed(4)
                          : "N/A"}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
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
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={generateMutation.isPending || !title || !datasetId}
                >
                  {generateMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : reports?.results?.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle>No reports yet</CardTitle>
          <CardDescription className="max-w-sm mt-2">
            You haven't generated any reports for this project. Click the button
            above to create your first one.
          </CardDescription>
        </Card>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {reports?.results?.map((report) => (
              <motion.div key={report.id} variants={listItemVariants} layout>
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      {getStatusBadge(report.status)}
                    </div>
                    <CardTitle className="mt-4 line-clamp-1">
                      {report.title}
                    </CardTitle>
                    <CardDescription>
                      Created{" "}
                      {format(new Date(report.created_at), "MMM d, yyyy")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium capitalize">
                          {report.report_type}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 flex gap-2">
                    {report.status === "completed" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-1"
                          asChild
                        >
                          <a
                            href={report.file}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-3 w-3" /> Download
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" className="px-2">
                          <Share2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteMutation.mutate(report.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
