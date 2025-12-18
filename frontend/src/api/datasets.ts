import { apiClient } from "./client";

export interface Dataset {
  id: string;
  name: string;
  file: string;
  file_size: number;
  file_size_display: string;
  row_count: number;
  column_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const datasetsApi = {
  list: (projectId?: string) => {
    const url = projectId ? `/datasets/?project=${projectId}` : "/datasets/";
    return apiClient.get<any>(url).then((res) => {
      if (Array.isArray(res.data)) return res.data;
      if (res.data && Array.isArray(res.data.results)) return res.data.results;
      return [];
    });
  },

  get: (id: string) => {
    return apiClient.get<Dataset>(`/datasets/${id}/`).then((res) => res.data);
  },

  delete: (id: string) => {
    return apiClient.delete(`/datasets/${id}/`);
  },
};
