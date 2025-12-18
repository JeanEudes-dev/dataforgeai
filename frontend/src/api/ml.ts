import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface TrainingJob {
  id: string;
  dataset: string;
  target_column: string;
  task_type: "classification" | "regression";
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  error_message?: string;
  best_model?: string;
  created_at: string;
  updated_at: string;
}

export interface TrainedModel {
  id: string;
  dataset: any;
  training_job: any;
  name: string;
  display_name: string;
  algorithm_type: string;
  task_type: "classification" | "regression";
  metrics: Record<string, number>;
  primary_metric: string;
  hyperparameters?: Record<string, unknown>;
  feature_importance: Record<string, number>;
  created_at: string;
}

export const mlApi = {
  list: (datasetId?: string) => {
    const url = datasetId ? `/ml/models/?dataset=${datasetId}` : "/ml/models/";
    return apiClient
      .get<PaginatedResponse<TrainedModel>>(url)
      .then((res) => res.data);
  },

  get: (id: string) => {
    return apiClient
      .get<TrainedModel>(`/ml/models/${id}/`)
      .then((res) => res.data);
  },

  getShap: (id: string) => {
    return apiClient
      .get<Record<string, unknown>>(`/ml/models/${id}/shap/`)
      .then((res) => res.data);
  },

  delete: (id: string) => {
    return apiClient.delete(`/ml/models/${id}/`);
  },

  download: (id: string) => {
    return apiClient.get(`/ml/models/${id}/download/`, {
      responseType: "blob",
    });
  },

  listJobs: (datasetId?: string) => {
    const url = datasetId ? `/ml/jobs/?dataset=${datasetId}` : "/ml/jobs/";
    return apiClient
      .get<PaginatedResponse<TrainingJob>>(url)
      .then((res) => res.data);
  },

  getJob: (id: string) => {
    return apiClient
      .get<TrainingJob>(`/ml/jobs/${id}/`)
      .then((res) => res.data);
  },

  createJob: (data: { dataset_id: string; target_column: string }) => {
    return apiClient
      .post<TrainingJob>("/ml/jobs/", data)
      .then((res) => res.data);
  },
};
