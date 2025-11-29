import { apiClient } from "@/lib/api-client";
import { type DashboardResponse } from "./types";

type DashboardApiResponse = {
  status: number;
  message: string;
  data: DashboardResponse;
};

export const fetchDashboard = async (): Promise<DashboardResponse> => {
  try {
    const response =
      await apiClient.get<DashboardApiResponse>("/dashboard/summary");
    return response.data.data;
  } catch {
    // return getMockDashboard();
    return Promise.reject("Failed to fetch dashboard data");
  }
};
