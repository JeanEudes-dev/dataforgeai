import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface Report {
  id: string;
  dataset:
    | string
    | { id: string; name: string; row_count: number; column_count: number };
  model?: string;
  trained_model?: {
    id: string;
    name: string;
    display_name: string;
    metrics: Record<string, number>;
    primary_metric: string;
    feature_importance: Record<string, number>;
  };
  title: string;
  report_type: "eda" | "model" | "full";
  status: "pending" | "processing" | "completed" | "failed";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content?: Record<string, any>;
  ai_summary?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  model_comparison?: Array<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  report_metadata?: Record<string, any>;
  file?: string;
  share_token?: string;
  is_public?: boolean;
  created_at: string;
  updated_at: string;
}

export const reportsApi = {
  list: (datasetId?: string) => {
    const url = datasetId ? `/reports/dataset/${datasetId}/` : "/reports/";
    return apiClient
      .get<PaginatedResponse<Report>>(url)
      .then((res) => res.data);
  },

  get: (id: string) => {
    return apiClient.get<Report>(`/reports/${id}/`).then((res) => res.data);
  },

  generate: (data: {
    dataset_id: string;
    model_id?: string;
    title: string;
    report_type: string;
  }) => {
    return apiClient
      .post<Report>("/reports/generate/", data)
      .then((res) => res.data);
  },

  delete: (id: string) => {
    return apiClient.delete(`/reports/${id}/`);
  },

  getShared: (token: string) => {
    return apiClient
      .get<Report>(`/reports/shared/${token}/`)
      .then((res) => res.data);
  },
};
