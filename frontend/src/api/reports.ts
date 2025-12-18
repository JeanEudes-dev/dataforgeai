import { apiClient } from "./client";
import type { PaginatedResponse } from "./types";

export interface Report {
  id: string;
  dataset: string;
  model?: string;
  title: string;
  report_type: "eda" | "model" | "full";
  status: "pending" | "processing" | "completed" | "failed";
  file?: string;
  share_token?: string;
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
