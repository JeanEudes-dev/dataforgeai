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
  file_type?: string;
  created_at: string;
  updated_at: string;
}

export interface DatasetColumn {
  id: string;
  name: string;
  original_name: string;
  dtype: string;
  pandas_dtype: string;
  null_count: number;
  null_ratio: number;
  unique_count: number;
}

export interface DatasetSchema {
  columns: DatasetColumn[];
  total_columns: number;
}

export interface DatasetPreview {
  columns: string[];
  rows: Record<string, unknown>[];
  total_rows: number;
}

export const datasetsApi = {
  list: (projectId?: string) => {
    const url = projectId ? `/datasets/?project=${projectId}` : "/datasets/";
    return apiClient
      .get<Dataset[] | { results: Dataset[] }>(url)
      .then((res) => {
        if (Array.isArray(res.data)) return res.data;
        if (
          res.data &&
          "results" in res.data &&
          Array.isArray(res.data.results)
        )
          return res.data.results;
        return [];
      });
  },

  get: (id: string) => {
    return apiClient.get<Dataset>(`/datasets/${id}/`).then((res) => res.data);
  },

  getPreview: (id: string, rows: number = 10) => {
    return apiClient
      .get<DatasetPreview>(`/datasets/${id}/preview/?rows=${rows}`)
      .then((res) => res.data);
  },

  getSchema: (id: string) => {
    return apiClient
      .get<DatasetSchema>(`/datasets/${id}/schema/`)
      .then((res) => res.data);
  },

  delete: (id: string) => {
    return apiClient.delete(`/datasets/${id}/`);
  },
};
