import client from "./client";

export interface DashboardStats {
  datasets_count: number;
  models_count: number;
  reports_count: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await client.get<DashboardStats>("/core/dashboard/stats/");
    return response.data;
  },
};
