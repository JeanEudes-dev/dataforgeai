import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  DocumentIcon,
  TrashIcon,
  ArrowRightIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import {
  Card,
  CardContent,
  Button,
  Modal,
  Input,
  SkeletonCard,
} from "@/components/ui";
import { StatusBadge, EmptyState } from "@/components/shared";
import { FileUpload } from "@/components/forms";
import { datasetsApi, getErrorMessage } from "@/api";
import { useToastActions } from "@/contexts";
import { formatRelativeTime, formatNumber } from "@/utils";
import type { DatasetListItem } from "@/types";

export function DatasetsPage() {
  const queryClient = useQueryClient();
  const toast = useToastActions();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["datasets"],
    queryFn: () => datasetsApi.list(),
  });

  const uploadMutation = useMutation({
    mutationFn: datasetsApi.upload,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset uploaded", "Your dataset is being processed.");
      closeUploadModal();
    },
    onError: (uploadError) => {
      toast.error("Upload failed", getErrorMessage(uploadError));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: datasetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      toast.success("Dataset deleted", "The dataset has been removed.");
    },
    onError: (deleteError) => {
      toast.error("Delete failed", getErrorMessage(deleteError));
    },
  });

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadName("");
    setUploadDescription("");
    setSelectedFile(null);
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    uploadMutation.mutate({
      file: selectedFile,
      name: uploadName || undefined,
      description: uploadDescription || undefined,
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const datasets = data?.results || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900" />
        <div className="relative px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400">
              Data workspace
            </p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-50">
              Datasets
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              Upload, manage, and launch training from your datasets. Cards show
              freshness, size, and readiness status.
            </p>
          </div>
          <Button
            leftIcon={<PlusIcon className="w-5 h-5" />}
            onClick={() => setIsUploadModalOpen(true)}
          >
            Upload dataset
          </Button>
        </div>
      </div>

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
              Failed to load datasets. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : datasets.length === 0 ? (
        <EmptyState
          icon={<TableCellsIcon className="w-8 h-8" />}
          title="No datasets yet"
          description="Upload your first dataset to start analyzing data and training models."
          action={{
            label: "Upload dataset",
            onClick: () => setIsUploadModalOpen(true),
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence>
            {datasets.map((dataset: DatasetListItem) => (
              <motion.div
                key={dataset.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                layout
              >
                <Card hoverable className="h-full">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-700 dark:text-gray-300">
                          <DocumentIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {dataset.name}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {formatRelativeTime(dataset.created_at)}
                          </p>
                        </div>
                      </div>
                      <StatusBadge status={dataset.status} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                        {dataset.original_filename}
                      </span>
                      {dataset.file_size_display && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {dataset.file_size_display}
                        </span>
                      )}
                      {dataset.row_count && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          {formatNumber(dataset.row_count, 0)} rows
                        </span>
                      )}
                      {dataset.column_count && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                          {dataset.column_count} cols
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Status
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                          {dataset.status}
                        </p>
                      </div>
                      <div className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          Updated
                        </p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatRelativeTime(
                            dataset.updated_at || dataset.created_at
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/datasets/${dataset.id}`} className="flex-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          rightIcon={<ArrowRightIcon className="w-4 h-4" />}
                        >
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(dataset.id, dataset.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <TrashIcon className="w-4 h-4 text-error-500" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        title="Upload dataset"
        description="Upload a CSV or Excel file to analyze"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={closeUploadModal}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              isLoading={uploadMutation.isPending}
            >
              Upload
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <FileUpload
            onFileSelect={setSelectedFile}
            onError={(uploadError) => toast.error("File error", uploadError)}
            isUploading={uploadMutation.isPending}
          />

          {selectedFile && (
            <>
              <Input
                label="Dataset name (optional)"
                placeholder="Enter a name for this dataset"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
              <Input
                label="Description (optional)"
                placeholder="Add a description"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default DatasetsPage;
