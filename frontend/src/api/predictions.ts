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
      .post("/predictions/predict/", {
        model_id: modelId,
        data: [data],
        include_probabilities: true,
      })
      .then((res) => {
        const { predictions, probabilities } = res.data;
        const prediction = predictions[0];
        let probability: number | undefined;

        if (probabilities && probabilities[0]) {
          const probs = probabilities[0];
          // If prediction is a key in probs, use that.
          if (
            (typeof prediction === "string" ||
              typeof prediction === "number") &&
            probs[prediction] !== undefined
          ) {
            probability = probs[prediction];
          } else {
            // Fallback: max probability
            const values = Object.values(probs) as number[];
            if (values.length > 0) {
              probability = Math.max(...values);
            }
          }
        }

        return { prediction, probability };
      });
  },

  batchPredict: (modelId: string, file: File) => {
    const formData = new FormData();
    formData.append("model_id", modelId);
    formData.append("file", file);
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
