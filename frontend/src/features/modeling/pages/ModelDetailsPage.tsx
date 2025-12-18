import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  Play,
  BarChart3,
  Settings,
  Info,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

import { mlApi } from "../../../api/ml";
import { predictionsApi } from "../../../api/predictions";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../components/ui/tabs";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Chart } from "../../../components/ui/chart";
import { useToast } from "../../../hooks/use-toast";

export default function ModelDetailsPage() {
  const { modelId } = useParams<{ modelId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [predictionInput, setPredictionInput] = useState<
    Record<string, string>
  >({});
  const [predictionResult, setPredictionResult] = useState<{
    prediction?: string | number;
    probability?: number;
  } | null>(null);

  const { data: model, isLoading } = useQuery({
    queryKey: ["model", modelId],
    queryFn: () => mlApi.get(modelId!),
    enabled: !!modelId,
  });

  const predictMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      predictionsApi.predict(modelId!, data),
    onSuccess: (data) => {
      setPredictionResult(data);
      toast({
        title: "Prediction successful",
        description: "The model has returned a prediction for your input.",
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { detail?: string } } };
      toast({
        title: "Prediction failed",
        description:
          err.response?.data?.detail || "An error occurred during prediction.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!model) return <div>Model not found</div>;

  const featureImportanceOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true,
    },
    xAxis: {
      type: "value",
      boundaryGap: [0, 0.01],
    },
    yAxis: {
      type: "category",
      data: Object.keys(model.feature_importance || {}).reverse(),
    },
    series: [
      {
        name: "Importance",
        type: "bar",
        data: Object.values(model.feature_importance || {}).reverse(),
        itemStyle: {
          color: "#3b82f6",
        },
      },
    ],
  };

  const handlePredict = (e: React.FormEvent) => {
    e.preventDefault();
    predictMutation.mutate(predictionInput);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {model.display_name || model.algorithm_type}
            </h1>
            <Badge variant="secondary">v1.0</Badge>
          </div>
          <p className="text-muted-foreground">
            Trained on {new Date(model.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Download Model
          </Button>
          <Button
            className="gap-2"
            onClick={() => navigate(`/app/predictions?model=${model.id}`)}
          >
            <Play className="h-4 w-4" />
            Batch Predict
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>
              {model.primary_metric || "Performance"}
            </CardDescription>
            <CardTitle className="text-2xl">
              {(model.metrics?.[model.primary_metric] || 0).toFixed(4)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Features</CardDescription>
            <CardTitle className="text-2xl">
              {Object.keys(model.feature_importance || {}).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Algorithm</CardDescription>
            <CardTitle className="text-2xl truncate">
              {model.algorithm_type}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Status</CardDescription>
            <CardTitle className="text-2xl text-emerald-500 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" /> Active
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="importance">Feature Importance</TabsTrigger>
          <TabsTrigger value="try">Try it out</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Model Parameters</CardTitle>
                <CardDescription>
                  Hyperparameters used during training.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(model.hyperparameters || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className="flex justify-between py-1 border-b last:border-0"
                      >
                        <span className="text-muted-foreground font-medium">
                          {key}
                        </span>
                        <span className="font-mono text-sm">
                          {JSON.stringify(value)}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Training Info</CardTitle>
                <CardDescription>
                  Details about the training process.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Dataset</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof model.dataset === "object"
                        ? `${model.dataset.name} (${model.dataset.id})`
                        : model.dataset}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Settings className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Training Job</p>
                    <p className="text-sm text-muted-foreground">
                      {typeof model.training_job === "object"
                        ? model.training_job.id
                        : model.training_job}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="importance">
          <Card>
            <CardHeader>
              <CardTitle>Feature Importance</CardTitle>
              <CardDescription>
                Relative contribution of each feature to the model's
                predictions.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[500px]">
              <Chart option={featureImportanceOption} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="try">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Single Prediction</CardTitle>
                <CardDescription>
                  Enter feature values to get a real-time prediction.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePredict} className="space-y-4">
                  {Object.keys(model.feature_importance || {}).map(
                    (feature) => (
                      <div key={feature} className="space-y-2">
                        <Label htmlFor={feature}>{feature}</Label>
                        <Input
                          id={feature}
                          placeholder={`Enter ${feature}`}
                          value={predictionInput[feature] || ""}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPredictionInput({
                              ...predictionInput,
                              [feature]: e.target.value,
                            })
                          }
                        />
                      </div>
                    )
                  )}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={predictMutation.isPending}
                  >
                    {predictMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Predict
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
                <CardDescription>
                  Prediction output from the model.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px]">
                {predictionResult ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                      Predicted Value
                    </div>
                    <div className="text-6xl font-bold text-primary">
                      {typeof predictionResult.prediction === "number"
                        ? predictionResult.prediction.toFixed(4)
                        : predictionResult.prediction}
                    </div>
                    {typeof predictionResult.probability === "number" && (
                      <div className="text-lg text-muted-foreground">
                        Confidence:{" "}
                        {(predictionResult.probability * 100).toFixed(2)}%
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Enter values and click Predict to see results.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
