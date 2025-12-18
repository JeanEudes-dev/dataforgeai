import React, { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import {
  Layers,
  Upload,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { pageVariants } from "../../../theme/motion";

export const PredictionsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const modelId = searchParams.get("modelId");
  const [file, setFile] = useState<File | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<{
    row_count?: number;
    download_url?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: model } = useQuery({
    queryKey: ["model", modelId],
    queryFn: async () => {
      if (!modelId) return null;
      const response = await apiClient.get(`/ml/models/${modelId}/`);
      return response.data;
    },
    enabled: !!modelId,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  };

  const handlePredict = async () => {
    if (!file || !modelId) return;

    setIsPredicting(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("model_id", modelId);

    try {
      const response = await apiClient.post("/predictions/batch/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setPredictionResult(response.data);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(
        error.response?.data?.detail ||
          "Failed to process predictions. Please check your file schema."
      );
    } finally {
      setIsPredicting(false);
    }
  };

  if (!modelId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Layers className="h-16 w-16 text-muted-foreground/20 mb-4" />
        <h2 className="text-xl font-semibold">No model selected</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Please select a trained model from the Modeling page to make
          predictions.
        </p>
        <Link to="/app/modeling" className="mt-6">
          <Button>Go to Modeling</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Batch Predictions
          </h1>
          <p className="text-muted-foreground">
            Using model: {model?.model_type_display || "Loading..."}
          </p>
        </div>
      </div>

      {!predictionResult ? (
        <div className="bg-card p-8 rounded-xl border border-border space-y-6">
          <div className="flex items-start gap-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
            <FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-primary">Schema Requirement</p>
              <p className="text-muted-foreground mt-1">
                Your upload must contain the same columns as the training data
                (excluding the target column).
              </p>
            </div>
          </div>

          {!file ? (
            <div
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("predict-upload")?.click()}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm font-medium">
                Upload data for prediction
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                CSV or Excel files only
              </p>
              <input
                id="predict-upload"
                type="file"
                className="hidden"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFile(null)}
                  disabled={isPredicting}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setFile(null)}
                  disabled={isPredicting}
                >
                  Cancel
                </Button>
                <Button onClick={handlePredict} disabled={isPredicting}>
                  {isPredicting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Layers className="mr-2 h-4 w-4" />
                  )}
                  {isPredicting ? "Processing..." : "Run Predictions"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-100 rounded-xl p-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h3 className="text-lg font-semibold mt-4 text-green-900">
              Predictions Complete
            </h3>
            <p className="text-green-700 mt-2">
              Successfully processed {predictionResult.row_count} rows.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button
                onClick={() => window.open(predictionResult.download_url)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Results (CSV)
              </Button>
              <Button
                variant="outline"
                onClick={() => setPredictionResult(null)}
              >
                Run Another Batch
              </Button>
            </div>
          </div>

          {/* Preview Table Placeholder */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-neutral-50">
              <h3 className="text-sm font-semibold">Preview (Top 5 rows)</h3>
            </div>
            <div className="p-8 text-center text-muted-foreground text-sm">
              Preview table would be rendered here with predicted values.
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
