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
import { containerVariants, listItemVariants } from "../../../theme/motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

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
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Batch Predictions
          </h1>
          <p className="text-muted-foreground mt-1">
            Using model:{" "}
            <span className="font-semibold text-foreground">
              {model?.model_type_display || "Loading..."}
            </span>
          </p>
        </div>
        {modelId && (
          <Link to={`/app/modeling/${modelId}`}>
            <Button variant="outline" size="sm" className="shadow-sm">
              View Model Details
            </Button>
          </Link>
        )}
      </div>

      {!predictionResult ? (
        <motion.div variants={listItemVariants} className="space-y-8">
          <Card className="border-none shadow-sm bg-primary/5 dark:bg-primary/10 border-primary/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-primary">Schema Requirement</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Your upload must contain the same columns as the training
                    data (excluding the target column). Ensure data types match
                    for optimal results.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardContent className="pt-6">
              {!file ? (
                <div
                  className="border-2 border-dashed border-muted rounded-2xl p-16 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                  onClick={() =>
                    document.getElementById("predict-upload")?.click()
                  }
                >
                  <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    Upload data for prediction
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                    Drag and drop your CSV or Excel file here, or click to
                    browse.
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
                <div className="space-y-8">
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-2xl border border-border">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB • Ready to process
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setFile(null)}
                      disabled={isPredicting}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>

                  {error && (
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive text-sm rounded-xl border border-destructive/20">
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      <p className="font-medium">{error}</p>
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      className="px-6"
                      onClick={() => setFile(null)}
                      disabled={isPredicting}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="px-8 shadow-md"
                      onClick={handlePredict}
                      disabled={isPredicting}
                    >
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
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={listItemVariants} className="space-y-8">
          <Card className="border-none shadow-sm bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                Predictions Complete
              </h3>
              <p className="text-emerald-700 dark:text-emerald-400 mt-2 max-w-md mx-auto">
                Successfully processed{" "}
                <span className="font-bold">{predictionResult.row_count}</span>{" "}
                rows. Your results are ready for download.
              </p>
              <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  size="lg"
                  className="shadow-lg bg-emerald-600 hover:bg-emerald-700 text-white border-none"
                  onClick={() => window.open(predictionResult.download_url)}
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download Results (CSV)
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-background/50"
                  onClick={() => setPredictionResult(null)}
                >
                  Run Another Batch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Preview Table Placeholder */}
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Preview Results</CardTitle>
              <CardDescription>
                Top 5 rows of the generated predictions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-12 text-center">
              <div className="max-w-xs mx-auto">
                <Layers className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Preview table is being generated. Download the full CSV to see
                  all predicted values and confidence scores.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};
