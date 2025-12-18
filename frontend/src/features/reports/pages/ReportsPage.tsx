import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DocumentTextIcon,
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
  Button,
  Modal,
  Select,
  SkeletonCard,
} from "@/components/ui";
import { StatusBadge, EmptyState } from "@/components/shared";
import { reportsApi, datasetsApi, mlApi, getErrorMessage } from "@/api";
import { useToastActions } from "@/contexts";
import { formatRelativeTime } from "@/utils";
import type { ReportListItem, GenerateReportParams } from "@/types";

export function ReportsPage() {
  const queryClient = useQueryClient();
  const toast = useToastActions();
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedDatasetId, setSelectedDatasetId] = useState("");
  const [selectedReportType, setSelectedReportType] = useState<
    "eda" | "model" | "full"
  >("full");
  const [selectedModelId, setSelectedModelId] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports"],
    queryFn: () => reportsApi.list(),
  });

  const { data: datasetsData } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list(),
  });

  const { data: modelsData } = useQuery({
    queryKey: ["trained-models"],
    queryFn: () => mlApi.listModels(),
  });

  const generateMutation = useMutation({
    mutationFn: (params: GenerateReportParams) => reportsApi.generate(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success(
        "Report generating",
        "Your report is being generated in the background."
      );
      closeGenerateModal();
    },
    onError: (err) => {
      toast.error("Generation failed", getErrorMessage(err));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: reportsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report deleted", "The report has been removed.");
    },
    onError: (err) => {
      toast.error("Delete failed", getErrorMessage(err));
    },
  });

  const closeGenerateModal = () => {
    setIsGenerateModalOpen(false);
    setSelectedDatasetId("");
    setSelectedReportType("full");
    setSelectedModelId("");
  };

  const handleGenerate = () => {
    if (!selectedDatasetId) {
      toast.error("Missing dataset", "Please select a dataset.");
      return;
    }
    generateMutation.mutate({
      dataset_id: selectedDatasetId,
      report_type: selectedReportType,
      model_id:
        selectedReportType === "model" || selectedReportType === "full"
          ? selectedModelId || undefined
          : undefined,
    });
  };

  const handleDelete = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const reports = data?.results || [];
  const datasets = datasetsData?.results || [];
  const models = modelsData?.results || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card variant="premium" className="relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

        <div className="relative px-8 py-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Insights
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Reports
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Generate EDA summaries or model performance packs. Cards show
              status and freshness.
            </p>
          </div>
          <Button
            size="lg"
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setIsGenerateModalOpen(true)}
            className="shadow-lg shadow-primary/25"
          >
            Generate report
          </Button>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-error-500">
              Failed to load reports. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={<DocumentTextIcon className="w-8 h-8" />}
          title="No reports yet"
          description="Generate your first report to get a comprehensive summary of your data analysis."
          action={{
            label: "Generate report",
            onClick: () => setIsGenerateModalOpen(true),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {reports.map((report: ReportListItem) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                layout
              >
                <Card hoverable variant="elevated" className="h-full">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl border border-border bg-muted/50 flex items-center justify-center text-muted-foreground">
                          <DocumentTextIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate text-lg">
                            {report.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(report.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 truncate max-w-[180px]">
                        {report.dataset.name}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 capitalize">
                        {report.report_type} report
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-1">
                          Status
                        </p>
                        <p className="text-sm font-semibold text-foreground capitalize">
                          {report.status}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-border bg-card">
                        <p className="text-xs text-muted-foreground mb-1">
                          Updated
                        </p>
                        <p className="text-sm font-semibold text-foreground">
                          {formatRelativeTime(
                            report.updated_at || report.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/reports/${report.id}`} className="flex-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                          disabled={report.status !== "completed"}
                        >
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(report.id, report.title)}
                        disabled={deleteMutation.isPending}
                      >
                        <TrashIcon className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Generate Modal */}
      <Modal
        isOpen={isGenerateModalOpen}
        onClose={closeGenerateModal}
        title="Generate report"
        description="Select a dataset and report type. Generation runs in the background."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeGenerateModal}>
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!selectedDatasetId}
              isLoading={generateMutation.isPending}
            >
              Generate
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 flex items-start gap-3 text-sm text-muted-foreground">
            <SparklesIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                Background generation
              </p>
              <p className="text-muted-foreground">
                We'll notify you and update the list when the report is ready.
                You can navigate away safely.
              </p>
            </div>
          </div>

          <Select
            label="Dataset"
            value={selectedDatasetId}
            onChange={setSelectedDatasetId}
            options={datasets
              .filter((d) => d.status === "ready")
              .map((d) => ({ value: d.id, label: d.name }))}
            placeholder="Select a dataset..."
          />

          <Select
            label="Report type"
            value={selectedReportType}
            onChange={(value) =>
              setSelectedReportType(value as "eda" | "model" | "full")
            }
            options={[
              { value: "eda", label: "EDA only — data analysis summary" },
              { value: "model", label: "Model only — performance report" },
              { value: "full", label: "Full report — analysis + model" },
            ]}
          />

          {(selectedReportType === "model" ||
            selectedReportType === "full") && (
            <Select
              label="Model (optional)"
              value={selectedModelId}
              onChange={setSelectedModelId}
              options={models.map((m) => ({
                value: m.id,
                label: `${m.display_name} — ${m.target_column}`,
              }))}
              placeholder="Select a model..."
            />
          )}
        </div>
      </Modal>
    </div>
  );
}

export default ReportsPage;
