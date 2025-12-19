import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../../api/client";
import { Button } from "../../../components/ui/button";
import {
  Upload,
  X,
  AlertCircle,
  ArrowLeft,
  Database,
  ShieldCheck,
  Zap,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import { containerVariants, listItemVariants } from "../../../theme/motion";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Progress } from "../../../components/ui/progress";

export const UploadDatasetPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setName(selectedFile.name.split(".")[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", name);

    try {
      const response = await apiClient.post("/datasets/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });

      // Success! Navigate to the dataset detail or EDA
      navigate(`/app/eda?datasetId=${response.data.id}`);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(
        error.response?.data?.detail ||
          "Failed to upload dataset. Please try again."
      );
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      className="max-w-4xl mx-auto space-y-10"
    >
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/app/datasets")}
          className="rounded-full"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Upload Dataset
          </h1>
          <p className="text-muted-foreground mt-1">
            Import your data to start generating insights.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {!file ? (
                <div
                  className="group relative border-2 border-dashed border-muted-foreground/20 rounded-xl p-16 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer"
                  onClick={() =>
                    document.getElementById("file-upload")?.click()
                  }
                >
                  <div className="mx-auto h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Upload className="h-10 w-10 text-primary/60" />
                  </div>
                  <h3 className="mt-6 text-lg font-semibold">
                    Drop your file here
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">
                    Support for CSV and Excel files up to 50MB.
                  </p>
                  <Button variant="outline" className="mt-8 shadow-sm">
                    Select File
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx"
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex items-center justify-between p-5 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl text-primary">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{file.name}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setFile(null)}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="dataset-name" className="text-sm font-bold">
                      Dataset Name
                    </Label>
                    <Input
                      id="dataset-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12 rounded-xl border-muted-foreground/20 focus:border-primary"
                      placeholder="e.g., Customer Churn 2024"
                      disabled={isUploading}
                    />
                  </div>

                  {isUploading && (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-3 p-4 bg-destructive/10 text-destructive text-sm font-medium rounded-xl border border-destructive/20"
                    >
                      <AlertCircle className="h-5 w-5 shrink-0" />
                      {error}
                    </motion.div>
                  )}

                  <div className="flex justify-end gap-4 pt-4">
                    <Button
                      variant="ghost"
                      className="px-8"
                      onClick={() => setFile(null)}
                      disabled={isUploading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="px-10 h-12 rounded-xl shadow-lg shadow-primary/20"
                      onClick={handleUpload}
                      disabled={isUploading || !name}
                    >
                      {isUploading ? "Processing..." : "Start Analysis"}
                    </Button>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">
            What happens next?
          </h3>
          <div className="space-y-4">
            {[
              {
                title: "Schema Detection",
                desc: "We'll automatically identify data types and structures.",
                icon: <Database className="h-5 w-5" />,
              },
              {
                title: "Data Validation",
                desc: "Checks for missing values, outliers, and inconsistencies.",
                icon: <ShieldCheck className="h-5 w-5" />,
              },
              {
                title: "Auto-EDA",
                desc: "Instant visual summaries and statistical insights.",
                icon: <Zap className="h-5 w-5" />,
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={listItemVariants}
                className="p-5 bg-card rounded-xl border border-border/50 flex items-start gap-4 shadow-sm"
              >
                <div className="p-2 bg-primary/5 rounded-lg text-primary shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          <Card className="bg-primary/5 border-none shadow-none">
            <CardContent className="p-5">
              <p className="text-xs text-primary/80 font-medium leading-relaxed">
                Your data is encrypted and processed securely. We never share
                your raw datasets with third parties.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
