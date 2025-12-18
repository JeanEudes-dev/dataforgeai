import { apiClient } from "./client";

export interface PredictionJob {
  id: string;
  model: string;
  status: "pending" | "processing" | "completed" | "failed";
  input_file: string;
  output_file?: string;
  error_message?: string;
  created_at: string;
}

export const predictionsApi = {
  predict: (modelId: string, data: Record<string, unknown>) => {
    return apiClient
      .post("/predictions/predict/", { model_id: modelId, input_data: data })
      .then((res) => res.data);
  },

  batchPredict: (modelId: string, file: File) => {
    const formData = new FormData();
    formData.append("model_id", modelId);
    formData.append("input_file", file);
    return apiClient
      .post<PredictionJob>("/predictions/batch/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((res) => res.data);
  },

  getJob: (id: string) => {
    return apiClient
      .get<PredictionJob>(`/predictions/jobs/${id}/`)
      .then((res) => res.data);
  },

  listJobs: (modelId?: string) => {
    const url = modelId
      ? `/predictions/jobs/?model=${modelId}`
      : "/predictions/jobs/";
    return apiClient.get<PredictionJob[]>(url).then((res) => res.data);
  },
};
